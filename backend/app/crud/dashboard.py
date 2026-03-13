import logging
from typing import Any, List, Dict
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, delete
from datetime import datetime, timezone, timedelta
from app.db.models import (
    DashboardState, SharedDashboard, Project, Task, QuickTask, 
    Habit, HabitLog, ChatMessage
)
from app.crud.base import _parse_json

logger = logging.getLogger(__name__)

def _serialize_dt(dt: Any) -> Any:
    """Helper to convert datetime to ISO string for JSON serialization."""
    if isinstance(dt, datetime):
        return dt.isoformat()
    return dt

# --- Dashboard (Aggregated View for Frontend) ---

async def get_dashboard_state_aggregated(db: AsyncSession, key: str = "default"):
    # 1. Habits (Templates)
    habits_result = await db.execute(select(Habit).order_by(Habit.ordinal))
    habits = habits_result.scalars().all()
    dailyTaskTemplates = [{"id": h.id, "title": h.title, "locked": bool(h.locked), "ordinal": h.ordinal} for h in habits]

    # 2. Habit Logs (Bounded to last 60 days)
    sixty_days_ago = (datetime.now(timezone.utc) - timedelta(days=60)).strftime("%Y-%m-%d")
    logs_result = await db.execute(select(HabitLog).filter(HabitLog.date >= sixty_days_ago))
    logs = logs_result.scalars().all()
    dailyTaskLogs = {}
    for l in logs:
        if l.date not in dailyTaskLogs: dailyTaskLogs[l.date] = []
        dailyTaskLogs[l.date].append({"id": l.habit_id, "done": bool(l.status)})

    # 3. Personal Projects & Tasks (Single-pass build)
    projs_result = await db.execute(select(Project).filter(Project.share_id == None).order_by(Project.created_at.desc()))
    projs = projs_result.scalars().all()
    proj_ids = [p.id for p in projs]

    tasks_result = await db.execute(select(Task).filter(Task.project_id.in_(proj_ids)).order_by(Task.created_at))
    all_tasks = tasks_result.scalars().all()

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

    # 4. Misc fields from DashboardState
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
    """Update dashboard state. Supports partial updates by checking key presence."""
    res_ds = await db.execute(select(DashboardState).filter(DashboardState.key == key))
    ds = res_ds.scalar_one_or_none()
    
    if not ds:
        ds = DashboardState(key=key, data=data)
        db.add(ds)
    else:
        # Merge new data into blob
        merged = _parse_json(ds.data, {})
        merged.update(data)
        ds.data = merged
    
    # RELATIONAL SYNC (Only if keys are present)
    
    if "dailyTaskTemplates" in data:
        incoming_habit_ids = [str(h["id"]) for h in data["dailyTaskTemplates"]]
        if incoming_habit_ids:
            await db.execute(delete(HabitLog).filter(HabitLog.habit_id.not_in(incoming_habit_ids)))
            await db.execute(delete(Habit).filter(Habit.id.not_in(incoming_habit_ids)))
        else:
            await db.execute(delete(HabitLog))
            await db.execute(delete(Habit))
            
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
    
    if "dailyTaskLogs" in data:
        # Partial update: only touch dates provided in the payload
        for d_str, logs in data["dailyTaskLogs"].items():
            await db.execute(delete(HabitLog).filter(HabitLog.date == d_str))
            for l in logs: db.add(HabitLog(habit_id=l["id"], date=d_str, status=1 if l.get("done") else 0))
    
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
    
    if "projects" in data:
        p_data = data["projects"]
        inc_proj_ids = [str(p["id"]) for p in p_data]
        
        # Only delete projects if "projects" key exists in payload (means we are syncing the whole list)
        deleted_p_res = await db.execute(select(Project.id).filter(Project.share_id == None, Project.id.not_in(inc_proj_ids)))
        deleted_p_ids = deleted_p_res.scalars().all()
        if deleted_p_ids:
            await db.execute(delete(Task).filter(Task.project_id.in_(deleted_p_ids)))
            await db.execute(delete(Project).filter(Project.id.in_(deleted_p_ids)))

        ex_p_res = await db.execute(select(Project).filter(Project.share_id == None))
        ex_projs = {str(p.id): p for p in ex_p_res.scalars().all()}
        for p in p_data:
            pid = str(p["id"])
            if pid in ex_projs:
                ex_projs[pid].title = p["title"]
            else:
                db.add(Project(id=pid, title=p["title"], share_id=None))
            
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

# --- Shared Dashboards (Optimized) ---

async def get_shared_dashboard_aggregated(db: AsyncSession, share_id: str):
    res = await db.execute(select(SharedDashboard).filter(SharedDashboard.share_id == share_id))
    shared = res.scalar_one_or_none()
    if not shared: return None

    # Projects & Tasks (Relational)
    projs_res = await db.execute(select(Project).filter(Project.share_id == share_id).order_by(Project.created_at.desc()))
    projs = projs_res.scalars().all()
    proj_ids = [p.id for p in projs]
    
    tasks_res = await db.execute(select(Task).filter(Task.project_id.in_(proj_ids)).order_by(Task.created_at))
    all_tasks = tasks_res.scalars().all()
    tasks_by_project = {pid: [] for pid in proj_ids}
    for t in all_tasks:
        tasks_by_project[t.project_id].append(t)

    def build_tree(task_list, parent_id=None):
        nodes = []
        for t in [x for x in task_list if x.parent_id == parent_id]:
            nodes.append({
                "id": t.id, "title": t.title, "done": bool(t.done), 
                "deadline": t.deadline, "children": build_tree(task_list, t.id)
            })
        return nodes

    projects = [
        {"id": p.id, "title": p.title, "tasks": build_tree(tasks_by_project.get(p.id, []))}
        for p in projs
    ]

    # Chat (Limited to last 100 entries)
    chat_res = await db.execute(
        select(ChatMessage)
        .filter(ChatMessage.share_id == share_id)
        .order_by(ChatMessage.timestamp.desc())
        .limit(100)
    )
    chat_rows = chat_res.scalars().all()
    chat = [
        {
            "id": m.id, "senderId": m.sender_id, "text": m.text, 
            "timestamp": int(m.timestamp.timestamp()*1000)
        } 
        for m in reversed(chat_rows)
    ]
    
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
        "updated_at": _serialize_dt(shared.updated_at)
    }

async def get_all_shared_dashboards_aggregated(db: AsyncSession):
    res = await db.execute(select(SharedDashboard).order_by(SharedDashboard.updated_at.desc()))
    share_ids = [sd.share_id for sd in res.scalars().all()]
    return [await get_shared_dashboard_aggregated(db, sid) for sid in share_ids]

async def update_shared_dashboard_from_json(db: AsyncSession, share_id: str, data: dict, title: str | None = None):
    """Partial update for shared dashboards."""
    res = await db.execute(select(SharedDashboard).filter(SharedDashboard.share_id == share_id))
    shared = res.scalar_one_or_none()
    
    if not shared:
        shared = SharedDashboard(share_id=share_id, title=title or "Progetti Condivisi", data=data)
        db.add(shared)
    else:
        if title: shared.title = title
        curr_data = _parse_json(shared.data, {})
        if isinstance(curr_data, dict):
            curr_data.update(data)
            shared.data = curr_data
        else:
            shared.data = data
    
    # RELATIONAL SYNC
    
    if "projects" in data:
        p_data = data["projects"]
        inc_proj_ids = [str(p["id"]) for p in p_data]
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
        ex_p_res = await db.execute(select(Project).filter(Project.share_id == share_id))
        ex_projs = {str(p.id): p for p in ex_p_res.scalars().all()}
        for p in p_data:
            pid = str(p["id"])
            if pid in ex_projs:
                ex_projs[pid].title = p["title"]
            else:
                db.add(Project(id=pid, title=p["title"], share_id=share_id))
            
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
    
    if "chat" in data:
        chat_data = data["chat"]
        # If chat is provided, we sync the list (usually we just append via a different method, but this is the bulk sync)
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

async def add_chat_message(db: AsyncSession, share_id: str, msg_data: dict):
    """Add a single chat message efficiently."""
    mid = str(msg_data["id"])
    new_msg = ChatMessage(
        id=mid,
        share_id=share_id,
        sender_id=msg_data["senderId"],
        text=msg_data["text"],
        timestamp=datetime.fromtimestamp(msg_data["timestamp"]/1000, tz=timezone.utc) if msg_data.get("timestamp") else datetime.now(timezone.utc)
    )
    db.add(new_msg)
    await db.commit()
    return {
        "id": new_msg.id,
        "senderId": new_msg.sender_id,
        "text": new_msg.text,
        "timestamp": int(new_msg.timestamp.timestamp()*1000)
    }
