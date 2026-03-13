import logging
from typing import Any
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, delete
from datetime import datetime, timezone
from app.db.models import (
    DashboardState, SharedDashboard, Project, Task, QuickTask, 
    Habit, HabitLog, ChatMessage
)
from app.crud.base import _parse_json

logger = logging.getLogger(__name__)

# --- Dashboard (Aggregated View for Frontend) ---

async def get_dashboard_state_aggregated(db: AsyncSession, key: str = "default"):
    # 1. Habits
    habits_result = await db.execute(select(Habit).order_by(Habit.ordinal))
    habits = habits_result.scalars().all()
    dailyTaskTemplates = [{"id": h.id, "title": h.title, "locked": bool(h.locked), "ordinal": h.ordinal} for h in habits]

    # 2. Habit Logs
    logs_result = await db.execute(select(HabitLog))
    logs = logs_result.scalars().all()
    dailyTaskLogs = {}
    for l in logs:
        if l.date not in dailyTaskLogs: dailyTaskLogs[l.date] = []
        dailyTaskLogs[l.date].append({"id": l.habit_id, "done": bool(l.status)})

    # 3. Quick Tasks
    qt_result = await db.execute(select(QuickTask).order_by(QuickTask.created_at.desc()))
    quickTasks = [{"id": q.id, "title": q.title, "done": bool(q.done), "deadline": q.deadline} for q in qt_result.scalars().all()]

    # 4. Personal Projects
    projs_result = await db.execute(select(Project).filter(Project.share_id == None).order_by(Project.created_at.desc()))
    projs = projs_result.scalars().all()
    
    async def get_task_tree(project_id, parent_id=None):
        res = await db.execute(select(Task).filter(Task.project_id == project_id, Task.parent_id == parent_id).order_by(Task.created_at))
        tree = []
        for t in res.scalars().all():
            tree.append({"id": t.id, "title": t.title, "done": bool(t.done), "deadline": t.deadline, "children": await get_task_tree(project_id, t.id)})
        return tree

    projects = []
    for p in projs:
        projects.append({"id": p.id, "title": p.title, "tasks": await get_task_tree(p.id)})

    # DashboardState for other fields (prayerLogs, etc.)
    res_ds = await db.execute(select(DashboardState).filter(DashboardState.key == key))
    ds = res_ds.scalar_one_or_none()
    ds_data = _parse_json(ds.data, {}) if ds else {}

    return {
        "dailyTaskTemplates": dailyTaskTemplates,
        "dailyTaskLogs": dailyTaskLogs,
        "projects": projects,
        "quickTasks": quickTasks,
        "prayerLogs": ds_data.get("prayerLogs", {}),
        "top3Manual": ds_data.get("top3Manual", [None, None, None]),
        "dailyCompletionLog": ds_data.get("dailyCompletionLog", {}),
        "lifeGoals": ds_data.get("lifeGoals"),
    }

async def update_dashboard_from_json(db: AsyncSession, data: dict, key: str = "default"):
    # First, save everything to the DashboardState blob for extra fields (prayerLogs, etc.)
    res_ds = await db.execute(select(DashboardState).filter(DashboardState.key == key))
    ds = res_ds.scalar_one_or_none()
    if not ds:
        ds = DashboardState(key=key, data=data)
        db.add(ds)
    else:
        ds.data = data
    
    # Sync habits
    if "dailyTaskTemplates" in data:
        await db.execute(delete(HabitLog))
        await db.execute(delete(Habit))
        for h in data["dailyTaskTemplates"]:
            db.add(Habit(id=h["id"], title=h["title"], locked=1 if h.get("locked") else 0, ordinal=h.get("ordinal", 0)))
    
    # Sync habit logs
    elif "dailyTaskLogs" in data: # Only delete logs if we didn't delete habits (which already deleted logs)
        await db.execute(delete(HabitLog))
        for d_str, logs in data["dailyTaskLogs"].items():
            for l in logs: db.add(HabitLog(habit_id=l["id"], date=d_str, status=1 if l.get("done") else 0))
    
    # Sync quick tasks
    if "quickTasks" in data:
        await db.execute(delete(QuickTask))
        for q in data["quickTasks"]:
            db.add(QuickTask(id=q["id"], title=q["title"], done=1 if q.get("done") else 0, deadline=q.get("deadline")))
    
    # Sync personal projects
    if "projects" in data:
        # Delete tasks first to avoid FK violation
        p_ids_res = await db.execute(select(Project.id).filter(Project.share_id == None))
        p_ids = p_ids_res.scalars().all()
        if p_ids:
            await db.execute(delete(Task).filter(Task.project_id.in_(p_ids)))
        await db.execute(delete(Project).filter(Project.share_id == None))
        for p in data["projects"]:
            db.add(Project(id=p["id"], title=p["title"], share_id=None))
            async def add_t(tasks, pid, parent=None):
                for t in tasks:
                    db.add(Task(id=t["id"], project_id=pid, parent_id=parent, title=t["title"], done=1 if t.get("done") else 0, deadline=t.get("deadline")))
                    if t.get("children"): await add_t(t["children"], pid, t["id"])
            await add_t(p.get("tasks", []), p["id"])
    
    await db.commit()
    return await get_dashboard_state_aggregated(db, key)

# --- Shared Dashboards ---

async def get_shared_dashboard_aggregated(db: AsyncSession, share_id: str):
    res = await db.execute(select(SharedDashboard).filter(SharedDashboard.share_id == share_id))
    shared = res.scalar_one_or_none()
    if not shared: return None
    projs_res = await db.execute(select(Project).filter(Project.share_id == share_id))
    async def get_t(pid, parent=None):
        r = await db.execute(select(Task).filter(Task.project_id == pid, Task.parent_id == parent).order_by(Task.created_at))
        return [{"id": t.id, "title": t.title, "done": bool(t.done), "deadline": t.deadline, "children": await get_t(pid, t.id)} for t in r.scalars().all()]
    projects = [{"id": p.id, "title": p.title, "tasks": await get_t(p.id)} for p in projs_res.scalars().all()]
    chat_res = await db.execute(select(ChatMessage).filter(ChatMessage.share_id == share_id).order_by(ChatMessage.timestamp))
    chat = [{"id": m.id, "senderId": m.sender_id, "text": m.text, "timestamp": int(m.timestamp.timestamp()*1000)} for m in chat_res.scalars().all()]
    
    # data can be a list or a dict in the DB
    shared_data = _parse_json(shared.data, {})
    quickTasks = shared_data.get("quickTasks", []) if isinstance(shared_data, dict) else []

    return {
        "share_id": shared.share_id,
        "title": shared.title,
        "data": {
            "projects": projects,
            "quickTasks": quickTasks,
            "chat": chat
        },
        "updated_at": shared.updated_at
    }

async def update_shared_dashboard_from_json(db: AsyncSession, share_id: str, data: dict | list, title: str | None = None):
    res = await db.execute(select(SharedDashboard).filter(SharedDashboard.share_id == share_id))
    shared = res.scalar_one_or_none()
    
    # Se data è una lista (vecchio formato), la convertiamo internamente
    if isinstance(data, list):
        data = {"projects": data, "quickTasks": [], "chat": []}

    if not shared:
        shared = SharedDashboard(share_id=share_id, title=title or "Progetti Condivisi", data=data)
        db.add(shared)
    else:
        if title: shared.title = title
        shared.data = data # Keep the blob for non-relational fields if needed
    
    # Sync relational tables
    p_ids_res = await db.execute(select(Project.id).filter(Project.share_id == share_id))
    p_ids = p_ids_res.scalars().all()
    if p_ids:
        await db.execute(delete(Task).filter(Task.project_id.in_(p_ids)))
    await db.execute(delete(Project).filter(Project.share_id == share_id))
    p_data = data.get("projects", [])
    for p in p_data:
        db.add(Project(id=p["id"], title=p["title"], share_id=share_id))
        async def add_t(tasks, pid, parent=None):
            for t in tasks:
                db.add(Task(id=t["id"], project_id=pid, parent_id=parent, title=t["title"], done=1 if t.get("done") else 0, deadline=t.get("deadline")))
                if t.get("children"): await add_t(t["children"], pid, t["id"])
        await add_t(p.get("tasks", []), p["id"])
    
    if "chat" in data:
        await db.execute(delete(ChatMessage).filter(ChatMessage.share_id == share_id))
        for msg in data["chat"]:
            db.add(ChatMessage(id=msg["id"], share_id=share_id, sender_id=msg["senderId"], text=msg["text"], 
                               timestamp=datetime.fromtimestamp(msg["timestamp"]/1000, tz=timezone.utc) if msg.get("timestamp") else datetime.now(timezone.utc)))
    
    await db.commit()
    return await get_shared_dashboard_aggregated(db, share_id)

async def get_all_shared_dashboards_aggregated(db: AsyncSession):
    res = await db.execute(select(SharedDashboard).order_by(SharedDashboard.updated_at.desc()))
    return [await get_shared_dashboard_aggregated(db, sd.share_id) for sd in res.scalars().all()]
