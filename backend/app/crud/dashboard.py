import logging
from typing import Any
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, delete
from datetime import datetime, timezone, timedelta
from app.db.models import (
    DashboardState, SharedDashboard, Project, Task, QuickTask, 
    Habit, HabitLog, ChatMessage
)
from app.crud.base import _parse_json

logger = logging.getLogger(__name__)

# --- Dashboard (Aggregated View for Frontend) ---

async def get_dashboard_state_aggregated(db: AsyncSession, key: str = "default"):
    # 1. Habits (Templates)
    habits_result = await db.execute(select(Habit).order_by(Habit.ordinal))
    habits = habits_result.scalars().all()
    dailyTaskTemplates = [{"id": h.id, "title": h.title, "locked": bool(h.locked), "ordinal": h.ordinal} for h in habits]

    # 2. Habit Logs (Bounded to last 60 days for performance)
    sixty_days_ago = (datetime.now() - timedelta(days=60)).strftime("%Y-%m-%d")
    logs_result = await db.execute(select(HabitLog).filter(HabitLog.date >= sixty_days_ago))
    logs = logs_result.scalars().all()
    dailyTaskLogs = {}
    for l in logs:
        if l.date not in dailyTaskLogs: dailyTaskLogs[l.date] = []
        dailyTaskLogs[l.date].append({"id": l.habit_id, "done": bool(l.status)})

    # 3. Personal Projects & Tasks (Single-pass tree builder)
    projs_result = await db.execute(select(Project).filter(Project.share_id == None).order_by(Project.created_at.desc()))
    projs = projs_result.scalars().all()
    proj_ids = [p.id for p in projs]

    tasks_result = await db.execute(select(Task).filter(Task.project_id.in_(proj_ids)).order_by(Task.created_at))
    all_tasks = tasks_result.scalars().all()

    # Build memory map of tasks
    tasks_by_project = {pid: [] for pid in proj_ids}
    for t in all_tasks:
        tasks_by_project[t.project_id].append(t)

    def build_tree(task_list, parent_id=None):
        nodes = []
        for t in [x for x in task_list if x.parent_id == parent_id]:
            nodes.append({
                "id": t.id,
                "title": t.title,
                "done": bool(t.done),
                "deadline": t.deadline,
                "children": build_tree(task_list, t.id)
            })
        return nodes

    projects = [
        {"id": p.id, "title": p.title, "tasks": build_tree(tasks_by_project.get(p.id, []))}
        for p in projs
    ]

    # 4. Misc fields from DashboardState blob
    res_ds = await db.execute(select(DashboardState).filter(DashboardState.key == key))
    ds = res_ds.scalar_one_or_none()
    ds_data = _parse_json(ds.data, {}) if ds else {}

    quickTasks = ds_data.get("quickTasks")
    if quickTasks is None:
        qt_result = await db.execute(select(QuickTask).order_by(QuickTask.created_at.desc()))
        quickTasks = [{"id": q.id, "title": q.title, "done": bool(q.done), "deadline": q.deadline} for q in qt_result.scalars().all()]

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
    
    # Sync habits - UPSERT
    if "dailyTaskTemplates" in data:
        incoming_habit_ids = [str(h["id"]) for h in data["dailyTaskTemplates"]]
        
        # Eliminate removed habits
        if incoming_habit_ids:
            await db.execute(delete(HabitLog).filter(HabitLog.habit_id.not_in(incoming_habit_ids)))
            await db.execute(delete(Habit).filter(Habit.id.not_in(incoming_habit_ids)))
        else:
            await db.execute(delete(HabitLog))
            await db.execute(delete(Habit))
            
        # Get existing
        existing_res = await db.execute(select(Habit))
        existing_habits = {str(h.id): h for h in existing_res.scalars().all()}
        
        for h in data["dailyTaskTemplates"]:
            hid = str(h["id"])
            if hid in existing_habits:
                existing_habits[hid].title = h["title"]
                existing_habits[hid].locked = 1 if h.get("locked") else 0
                existing_habits[hid].ordinal = h.get("ordinal", 0)
            else:
                db.add(Habit(id=hid, title=h["title"], locked=1 if h.get("locked") else 0, ordinal=h.get("ordinal", 0)))
    
    # Sync habit logs
    elif "dailyTaskLogs" in data:
        # For logs, brute force per-day is generally acceptable or we can just upsert.
        # Since habit logs are simple date+id combinations, clearing the db completely on a full state update is standard,
        # but the optimized way is to only touch the provided dates.
        for d_str, logs in data["dailyTaskLogs"].items():
            await db.execute(delete(HabitLog).filter(HabitLog.date == d_str))
            for l in logs: db.add(HabitLog(habit_id=l["id"], date=d_str, status=1 if l.get("done") else 0))
    
    # Sync quick tasks - UPSERT
    if "quickTasks" in data:
        incoming_qids = [str(q["id"]) for q in data["quickTasks"]]
        if incoming_qids:
            await db.execute(delete(QuickTask).filter(QuickTask.id.not_in(incoming_qids)))
        else:
            await db.execute(delete(QuickTask))
            
        existing_q_res = await db.execute(select(QuickTask))
        existing_qs = {str(q.id): q for q in existing_q_res.scalars().all()}
        
        for q in data["quickTasks"]:
            qid = str(q["id"])
            if qid in existing_qs:
                existing_qs[qid].title = q["title"]
                existing_qs[qid].done = 1 if q.get("done") else 0
                existing_qs[qid].deadline = q.get("deadline")
            else:
                db.add(QuickTask(id=qid, title=q["title"], done=1 if q.get("done") else 0, deadline=q.get("deadline")))
    
    # Sync personal projects - UPSERT
    if "projects" in data:
        inc_proj_ids = [str(p["id"]) for p in data["projects"]]
        
        # Delete absent projects and their tasks
        if inc_proj_ids:
            deleted_p_res = await db.execute(select(Project.id).filter(Project.share_id == None, Project.id.not_in(inc_proj_ids)))
            deleted_p_ids = deleted_p_res.scalars().all()
            if deleted_p_ids:
                await db.execute(delete(Task).filter(Task.project_id.in_(deleted_p_ids)))
                await db.execute(delete(Project).filter(Project.id.in_(deleted_p_ids)))
        else:
            p_ids_res = await db.execute(select(Project.id).filter(Project.share_id == None))
            p_ids = p_ids_res.scalars().all()
            if p_ids:
                await db.execute(delete(Task).filter(Task.project_id.in_(p_ids)))
                await db.execute(delete(Project).filter(Project.share_id == None))

        # Existing projects map
        ex_p_res = await db.execute(select(Project).filter(Project.share_id == None))
        ex_projs = {str(p.id): p for p in ex_p_res.scalars().all()}
        
        for p in data["projects"]:
            pid = str(p["id"])
            if pid in ex_projs:
                ex_projs[pid].title = p["title"]
            else:
                db.add(Project(id=pid, title=p["title"], share_id=None))
            
            # Tasks for this project
            inc_task_ids = []
            def collect_tasks(tasks_list):
                for t in tasks_list:
                    inc_task_ids.append(str(t["id"]))
                    if t.get("children"): collect_tasks(t["children"])
            collect_tasks(p.get("tasks", []))
            
            if inc_task_ids:
                await db.execute(delete(Task).filter(Task.project_id == pid, Task.id.not_in(inc_task_ids)))
            else:
                await db.execute(delete(Task).filter(Task.project_id == pid))
                
            ex_t_res = await db.execute(select(Task).filter(Task.project_id == pid))
            ex_tasks = {str(t.id): t for t in ex_t_res.scalars().all()}
            
            async def upsert_t(tasks, proj_id, parent=None):
                for t in tasks:
                    tid = str(t["id"])
                    if tid in ex_tasks:
                        ex_tasks[tid].title = t["title"]
                        ex_tasks[tid].parent_id = parent
                        ex_tasks[tid].done = 1 if t.get("done") else 0
                        ex_tasks[tid].deadline = t.get("deadline")
                    else:
                        db.add(Task(id=tid, project_id=proj_id, parent_id=parent, title=t["title"], done=1 if t.get("done") else 0, deadline=t.get("deadline")))
                    if t.get("children"): await upsert_t(t["children"], proj_id, tid)
            
            await upsert_t(p.get("tasks", []), pid)
    
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
    
    # Sync relational tables - UPSERT style
    p_data = data.get("projects", [])
    inc_proj_ids = [str(p["id"]) for p in p_data]
    
    # 1. Delete removed projects and their tasks
    if inc_proj_ids:
        deleted_p_res = await db.execute(select(Project.id).filter(Project.share_id == share_id, Project.id.not_in(inc_proj_ids)))
        deleted_p_ids = deleted_p_res.scalars().all()
        if deleted_p_ids:
            await db.execute(delete(Task).filter(Task.project_id.in_(deleted_p_ids)))
            await db.execute(delete(Project).filter(Project.id.in_(deleted_p_ids)))
    else:
        p_ids_res = await db.execute(select(Project.id).filter(Project.share_id == share_id))
        p_ids = p_ids_res.scalars().all()
        if p_ids:
            await db.execute(delete(Task).filter(Task.project_id.in_(p_ids)))
            await db.execute(delete(Project).filter(Project.share_id == share_id))

    # 2. Update existing / Insert new projects
    ex_p_res = await db.execute(select(Project).filter(Project.share_id == share_id))
    ex_projs = {str(p.id): p for p in ex_p_res.scalars().all()}
    
    for p in p_data:
        pid = str(p["id"])
        if pid in ex_projs:
            ex_projs[pid].title = p["title"]
        else:
            db.add(Project(id=pid, title=p["title"], share_id=share_id))
            
        # Handle Tasks
        inc_task_ids = []
        def collect_tasks(tasks_list):
            for t in tasks_list:
                inc_task_ids.append(str(t["id"]))
                if t.get("children"): collect_tasks(t["children"])
        collect_tasks(p.get("tasks", []))
        
        if inc_task_ids:
            await db.execute(delete(Task).filter(Task.project_id == pid, Task.id.not_in(inc_task_ids)))
        else:
            await db.execute(delete(Task).filter(Task.project_id == pid))
            
        ex_t_res = await db.execute(select(Task).filter(Task.project_id == pid))
        ex_tasks = {str(t.id): t for t in ex_t_res.scalars().all()}
        
        async def upsert_t(tasks, proj_id, parent=None):
            for t in tasks:
                tid = str(t["id"])
                if tid in ex_tasks:
                    ex_tasks[tid].title = t["title"]
                    ex_tasks[tid].parent_id = parent
                    ex_tasks[tid].done = 1 if t.get("done") else 0
                    ex_tasks[tid].deadline = t.get("deadline")
                else:
                    db.add(Task(id=tid, project_id=proj_id, parent_id=parent, title=t["title"], done=1 if t.get("done") else 0, deadline=t.get("deadline")))
                if t.get("children"): await upsert_t(t["children"], proj_id, tid)
        
        await upsert_t(p.get("tasks", []), pid)
    
    # 3. Chat Messages - UPSERT
    if "chat" in data:
        chat_data = data["chat"]
        inc_chat_ids = [str(m["id"]) for m in chat_data]
        if inc_chat_ids:
            await db.execute(delete(ChatMessage).filter(ChatMessage.share_id == share_id, ChatMessage.id.not_in(inc_chat_ids)))
        else:
            await db.execute(delete(ChatMessage).filter(ChatMessage.share_id == share_id))
            
        ex_c_res = await db.execute(select(ChatMessage).filter(ChatMessage.share_id == share_id))
        ex_chats = {str(c.id): c for c in ex_c_res.scalars().all()}
        
        for msg in chat_data:
            mid = str(msg["id"])
            if mid not in ex_chats:
                db.add(ChatMessage(id=mid, share_id=share_id, sender_id=msg["senderId"], text=msg["text"], 
                                   timestamp=datetime.fromtimestamp(msg["timestamp"]/1000, tz=timezone.utc) if msg.get("timestamp") else datetime.now(timezone.utc)))
    
    await db.commit()
    return await get_shared_dashboard_aggregated(db, share_id)

async def get_all_shared_dashboards_aggregated(db: AsyncSession):
    res = await db.execute(select(SharedDashboard).order_by(SharedDashboard.updated_at.desc()))
    return [await get_shared_dashboard_aggregated(db, sd.share_id) for sd in res.scalars().all()]
