import logging
from typing import Any, List, Dict
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, delete
from datetime import datetime, timezone, timedelta
from sqlalchemy.orm import selectinload
from sqlalchemy.orm.attributes import flag_modified
from app.db.models import (
    DashboardState, SharedDashboard, Project, Task, QuickTask, 
    Habit, HabitLog, ChatMessage, PrayerLog, Top3Item, 
    DailyCompletionLog, LifeGoalTier, LifeGoal
)
from app.repositories.base import _parse_json

logger = logging.getLogger(__name__)

def _serialize_dt(dt: Any) -> Any:
    """Helper to convert datetime to ISO string for JSON serialization."""
    if isinstance(dt, datetime):
        return dt.isoformat()
    return dt

# --- Dashboard (Aggregated View for Frontend) ---

async def get_dashboard_state_aggregated(db: AsyncSession, key: str = "default", user_id: str | None = None):
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
    projs_result = await db.execute(select(Project).filter(Project.share_id == None).order_by(Project.ordinal, Project.created_at.desc()))
    projs = projs_result.scalars().all()
    proj_ids = [p.id for p in projs]

    tasks_result = await db.execute(select(Task).filter(Task.project_id.in_(proj_ids)).order_by(Task.ordinal, Task.created_at))
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
                "ordinal": t.ordinal,
                "children": build_tree(task_list, t.id)
            })
        return nodes

    projects = [
        {"id": p.id, "title": p.title, "ordinal": p.ordinal, "tasks": build_tree(tasks_by_project.get(p.id, []))}
        for p in projs
    ]

    # 4. QuickTasks
    qt_result = await db.execute(select(QuickTask).order_by(QuickTask.ordinal, QuickTask.created_at.desc()))
    quickTasks = [{"id": q.id, "title": q.title, "done": bool(q.done), "deadline": q.deadline, "ordinal": q.ordinal} for q in qt_result.scalars().all()]

    # 5. Prayer Logs
    pr_result = await db.execute(select(PrayerLog).filter(PrayerLog.date >= sixty_days_ago))
    pr_logs = pr_result.scalars().all()
    prayerLogs = {}
    for pr in pr_logs:
        if pr.date not in prayerLogs: prayerLogs[pr.date] = {}
        # Return {completedAt: "..."} format for completed prayers with timestamp,
        # or true for legacy completed prayers without timestamp (backward compat)
        # or null for uncompleted prayers
        if pr.completed:
            if pr.completed_at:
                prayerLogs[pr.date][pr.prayer_name] = {"completedAt": pr.completed_at}
            else:
                prayerLogs[pr.date][pr.prayer_name] = True  # Legacy: no timestamp available
        else:
            prayerLogs[pr.date][pr.prayer_name] = None

    # 6. Top3 Items
    top3_result = await db.execute(select(Top3Item).order_by(Top3Item.slot))
    top3_rows = top3_result.scalars().all()
    top3Manual = [None, None, None]
    for tr in top3_rows:
        if 0 <= tr.slot < 3:
            top3Manual[tr.slot] = {
                "projectId": tr.project_id,
                "taskId": tr.task_id,
                "quickTaskId": tr.quick_task_id,
                "title": tr.title,
                "done": bool(tr.done)
            }

    # 7. Daily Completion Log
    dc_result = await db.execute(select(DailyCompletionLog).filter(DailyCompletionLog.date >= sixty_days_ago))
    dc_logs = dc_result.scalars().all()
    dailyCompletionLog = {dc.date: {"score": dc.score, **(dc.data or {})} for dc in dc_logs}

    # 8. Life Goals (Tiered)
    tiers_result = await db.execute(
        select(LifeGoalTier)
        .options(selectinload(LifeGoalTier.goals))
        .order_by(LifeGoalTier.ordinal)
    )
    tiers = tiers_result.scalars().all()
    
    # We also need the top-level 'collapsed' from DashboardState for now
    q = select(DashboardState).filter(DashboardState.key == key)
    if user_id is not None:
        q = q.filter(DashboardState.user_id == user_id)
    else:
        q = q.filter(DashboardState.user_id.is_(None))
    res_ds = await db.execute(q.order_by(DashboardState.updated_at.desc()))
    ds = res_ds.scalars().first()
    ds_data = _parse_json(ds.data, {}) if ds else {}
    lg_collapsed = ds_data.get("lifeGoals", {}).get("collapsed", False)
    timeline_routines = ds_data.get("timelineRoutines") if isinstance(ds_data.get("timelineRoutines"), dict) else {}
    section_order = ds_data.get("sectionOrder") if isinstance(ds_data.get("sectionOrder"), dict) else None

    lifeGoals = {
        "collapsed": lg_collapsed,
        "tiers": [
            {
                "id": t.id,
                "name": t.name,
                "emoji": t.emoji,
                "color": t.color,
                "collapsed": bool(t.collapsed),
                "ordinal": t.ordinal,
                "goals": [
                    {
                        "id": g.id,
                        "title": g.title,
                        "category": g.category,
                        "type": g.type,
                        "done": bool(g.done),
                        "deadline": g.deadline,
                        "ordinal": g.ordinal
                    }
                    for g in t.goals
                ]
            }
            for t in tiers
        ]
    }

    return {
        "dailyTaskTemplates": dailyTaskTemplates,
        "dailyTaskLogs": dailyTaskLogs,
        "projects": projects,
        "quickTasks": quickTasks,
        "prayerLogs": prayerLogs,
        "top3Manual": top3Manual,
        "dailyCompletionLog": dailyCompletionLog,
        "lifeGoals": lifeGoals,
        "timelineRoutines": timeline_routines,
        "timelinePanelExpanded": ds_data.get("timelinePanelExpanded", True),
        "todayTrainingExpanded": ds_data.get("todayTrainingExpanded", True),
        "lockedHabitsCollapsed": ds_data.get("lockedHabitsCollapsed", False),
        "projectExpandedState": ds_data.get("projectExpandedState", {}),
        "sectionOrder": section_order,
        "activePomodoroTask": ds_data.get("activePomodoroTask"),
    }

async def update_dashboard_from_json(db: AsyncSession, data: dict, key: str = "default", user_id: str | None = None):
    """Update dashboard state. Supports partial updates by checking key presence."""
    q = select(DashboardState).filter(DashboardState.key == key)
    if user_id is not None:
        q = q.filter(DashboardState.user_id == user_id)
    else:
        q = q.filter(DashboardState.user_id.is_(None))
    res_ds = await db.execute(q.order_by(DashboardState.updated_at.desc()))
    ds = res_ds.scalars().first()

    if not ds:
        ds = DashboardState(key=key, user_id=user_id, data={})
        db.add(ds)
    
    # RELATIONAL SYNC (Only if keys are present)
    
    if "dailyTaskTemplates" in data:
        incoming_habit_ids = [str(h["id"]) for h in data["dailyTaskTemplates"]]
        if incoming_habit_ids:
            await db.execute(delete(HabitLog).filter(HabitLog.habit_id.not_in(incoming_habit_ids)))
            await db.execute(delete(Habit).filter(Habit.id.not_in(incoming_habit_ids)))
        else:
            # DEFENSIVE: incoming is empty — only wipe if DB is also (near-)empty.
            # Otherwise this is almost certainly a partial/buggy payload and
            # blindly deleting everything would cause catastrophic data loss.
            existing_count_res = await db.execute(select(Habit))
            existing_count = len(existing_count_res.scalars().all())
            if existing_count == 0:
                await db.execute(delete(HabitLog))
                await db.execute(delete(Habit))
            # else: skip destructive delete — preserve existing data
            
        existing_res = await db.execute(select(Habit))
        existing_habits = {str(h.id): h for h in existing_res.scalars().all()}
        for i, h in enumerate(data["dailyTaskTemplates"]):
            hid = str(h["id"])
            if hid in existing_habits:
                existing_habits[hid].title = h["title"]
                existing_habits[hid].locked = 1 if h.get("locked") else 0
                existing_habits[hid].ordinal = h.get("ordinal", i)
            else:
                db.add(Habit(id=hid, title=h["title"], locked=1 if h.get("locked") else 0, ordinal=h.get("ordinal", i)))
    
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
            # DEFENSIVE: same guard as habits — only wipe if DB is empty.
            existing_count_res = await db.execute(select(QuickTask))
            if len(existing_count_res.scalars().all()) == 0:
                await db.execute(delete(QuickTask))
        existing_q_res = await db.execute(select(QuickTask))
        existing_qs = {str(q.id): q for q in existing_q_res.scalars().all()}
        for i, q in enumerate(data["quickTasks"]):
            qid = str(q["id"])
            if qid in existing_qs:
                existing_qs[qid].title = q["title"]
                existing_qs[qid].done = 1 if q.get("done") else 0
                existing_qs[qid].deadline = q.get("deadline")
                existing_qs[qid].ordinal = i
            else:
                db.add(QuickTask(id=qid, title=q["title"], done=1 if q.get("done") else 0, deadline=q.get("deadline"), ordinal=i))
    
    if "projects" in data:
        p_data = data["projects"]
        inc_proj_ids = [str(p["id"]) for p in p_data]
        
        # Only delete projects if "projects" key exists in payload (guard empty list for not_in)
        if inc_proj_ids:
            deleted_p_res = await db.execute(select(Project.id).filter(Project.share_id == None, Project.id.not_in(inc_proj_ids)))
            deleted_p_ids = deleted_p_res.scalars().all()
        else:
            # DEFENSIVE: incoming is empty — only wipe if DB has no personal
            # projects (fresh state). Otherwise this is almost certainly a
            # buggy partial payload; skip destructive delete.
            existing_personal_res = await db.execute(select(Project.id).filter(Project.share_id == None))
            existing_personal_ids = existing_personal_res.scalars().all()
            if len(existing_personal_ids) == 0:
                deleted_p_ids = []
            else:
                deleted_p_ids = []  # skip — preserve existing
        if deleted_p_ids:
            await db.execute(delete(Task).filter(Task.project_id.in_(deleted_p_ids)))
            await db.execute(delete(Project).filter(Project.id.in_(deleted_p_ids)))

        ex_p_res = await db.execute(select(Project).filter(Project.share_id == None))
        ex_projs = {str(p.id): p for p in ex_p_res.scalars().all()}
        
        # Prefetch tasks to avoid many small queries
        ex_t_res = await db.execute(select(Task).filter(Task.project_id.in_(list(ex_projs.keys()) if ex_projs else [None])))
        ex_tasks = {str(t.id): t for t in ex_t_res.scalars().all()}

        for i, p in enumerate(p_data):
            pid = str(p["id"])
            if pid in ex_projs:
                ex_projs[pid].title = p["title"]
                ex_projs[pid].ordinal = i
            else:
                db.add(Project(id=pid, title=p["title"], share_id=None, ordinal=i))
            
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
                
            async def upsert_t(tasks, proj_id, parent=None):
                for j, t in enumerate(tasks):
                    tid = str(t["id"])
                    if tid in ex_tasks:
                        ex_tasks[tid].title = t["title"]
                        ex_tasks[tid].parent_id = parent
                        ex_tasks[tid].done = 1 if t.get("done") else 0
                        ex_tasks[tid].deadline = t.get("deadline")
                        ex_tasks[tid].ordinal = j
                    else:
                        db.add(Task(id=tid, project_id=proj_id, parent_id=parent, title=t["title"], 
                                    done=1 if t.get("done") else 0, deadline=t.get("deadline"), ordinal=j))
                    if t.get("children"): await upsert_t(t["children"], proj_id, tid)
            await upsert_t(p.get("tasks", []), pid)

    if "prayerLogs" in data:
        for d_str, prayers in data["prayerLogs"].items():
            await db.execute(delete(PrayerLog).filter(PrayerLog.date == d_str))
            for p_name, value in prayers.items():
                # Handle both old boolean format and new object format {completedAt: "..."}
                if value is None or value is False:
                    is_completed = 0
                    completed_at = None
                elif isinstance(value, dict):
                    is_completed = 1 if value.get("completedAt") else 0
                    completed_at = value.get("completedAt")  # Preserve timestamp
                else:
                    is_completed = 1 if value else 0
                    completed_at = None
                db.add(PrayerLog(date=d_str, prayer_name=p_name, completed=is_completed, completed_at=completed_at))

    if "top3Manual" in data:
        incoming_top3 = data["top3Manual"]
        # DEFENSIVE: top3Manual is ALWAYS exactly 3 slots in a valid payload.
        # If we receive a shorter/empty list and the DB has entries, it's a
        # partial/buggy payload — skip the destructive delete.
        is_valid_shape = isinstance(incoming_top3, list) and len(incoming_top3) == 3
        if is_valid_shape:
            await db.execute(delete(Top3Item))
            for i, item in enumerate(incoming_top3):
                if item:
                    db.add(Top3Item(
                        slot=i,
                        project_id=item.get("projectId"),
                        task_id=item.get("taskId"),
                        quick_task_id=item.get("quickTaskId"),
                        title=item.get("title"),
                        done=1 if item.get("done") else 0
                    ))

    if "dailyCompletionLog" in data:
        for d_str, log in data["dailyCompletionLog"].items():
            existing = await db.execute(select(DailyCompletionLog).filter(DailyCompletionLog.date == d_str))
            dc = existing.scalar_one_or_none()
            score = log.get("score", 0)
            meta = {k: v for k, v in log.items() if k != "score"}
            if dc:
                dc.score = score
                dc.data = meta
            else:
                db.add(DailyCompletionLog(date=d_str, score=score, data=meta))

    if "lifeGoals" in data:
        lg = data["lifeGoals"]
        # Top-level state in blob for now
        merged = _parse_json(ds.data, {})
        if "lifeGoals" not in merged: merged["lifeGoals"] = {}
        merged["lifeGoals"]["collapsed"] = lg.get("collapsed", False)
        ds.data = merged

        for ui_key in ("timelineRoutines", "timelinePanelExpanded", "todayTrainingExpanded", "lockedHabitsCollapsed", "projectExpandedState", "sectionOrder", "activePomodoroTask"):
            if ui_key in data:
                merged = _parse_json(ds.data, {})
                merged[ui_key] = data[ui_key]
                ds.data = merged

        if "tiers" in lg:
            incoming_tier_ids = [str(t["id"]) for t in lg["tiers"]]
            # Careful: deleting goals first due to FK (guard empty list for not_in)
            if incoming_tier_ids:
                await db.execute(delete(LifeGoal).filter(LifeGoal.tier_id.not_in(incoming_tier_ids)))
                await db.execute(delete(LifeGoalTier).filter(LifeGoalTier.id.not_in(incoming_tier_ids)))
            else:
                # DEFENSIVE: only wipe tiers/goals if DB is already empty.
                existing_tiers_res = await db.execute(select(LifeGoalTier))
                if len(existing_tiers_res.scalars().all()) == 0:
                    await db.execute(delete(LifeGoal))
                    await db.execute(delete(LifeGoalTier))
                # else: skip — preserve existing tiers/goals
            
            ex_tiers_res = await db.execute(select(LifeGoalTier))
            ex_tiers = {str(t.id): t for t in ex_tiers_res.scalars().all()}
            
            for i, t in enumerate(lg["tiers"]):
                tid = str(t["id"])
                if tid in ex_tiers:
                    ex_tiers[tid].name = t["name"]
                    ex_tiers[tid].emoji = t.get("emoji")
                    ex_tiers[tid].color = t.get("color")
                    ex_tiers[tid].collapsed = 1 if t.get("collapsed") else 0
                    ex_tiers[tid].ordinal = i
                else:
                    db.add(LifeGoalTier(id=tid, name=t["name"], emoji=t.get("emoji"), 
                                       color=t.get("color"), collapsed=1 if t.get("collapsed") else 0, ordinal=i))
                
                inc_goal_ids = [str(g["id"]) for g in t.get("goals", [])]
                await db.execute(delete(LifeGoal).filter(LifeGoal.tier_id == tid, LifeGoal.id.not_in(inc_goal_ids)))
                
                ex_goals_res = await db.execute(select(LifeGoal).filter(LifeGoal.tier_id == tid))
                ex_goals = {str(g.id): g for g in ex_goals_res.scalars().all()}
                
                for j, g in enumerate(t.get("goals", [])):
                    gid = str(g["id"])
                    if gid in ex_goals:
                        ex_goals[gid].title = g["title"]
                        ex_goals[gid].category = g.get("category")
                        ex_goals[gid].type = g.get("type")
                        ex_goals[gid].done = 1 if g.get("done") else 0
                        ex_goals[gid].deadline = g.get("deadline")
                        ex_goals[gid].ordinal = j
                    else:
                        db.add(LifeGoal(id=gid, tier_id=tid, title=g["title"], category=g.get("category"),
                                        type=g.get("type"), done=1 if g.get("done") else 0, 
                                        deadline=g.get("deadline"), ordinal=j))

    # Event Sourcing: strip large log arrays to keep event payload small, then append async-style
    try:
        from app.services.event_sourcing import append_dashboard_event
        agg_id = user_id or "default"
        # Strip dailyTaskLogs and dailyCompletionLog (bulk data) to keep event payload small
        compact_data = {k: v for k, v in data.items() if k not in ("dailyTaskLogs", "dailyCompletionLog", "prayerLogs")}
        await append_dashboard_event(db, agg_id, compact_data, user_id)
    except Exception:
        pass

    await db.commit()

    # Return committed data directly — avoids re-fetching everything (10+ queries) after every PUT.
    # The frontend (syncMiddleware) does not consume the PUT response body.
    return data

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

    # Apply saved project order (frontend reorder)
    shared_data = _parse_json(shared.data, {})
    project_order = shared_data.get("projectOrder") or [] if isinstance(shared_data, dict) else []
    if project_order:
        by_id = {p["id"]: p for p in projects}
        ordered = [by_id[pid] for pid in project_order if pid in by_id]
        tail = [p for p in projects if p["id"] not in project_order]
        projects = ordered + tail

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
    
    if not isinstance(shared_data, dict):
        shared_data = _parse_json(shared.data, {}) or {}
    quickTasks = shared_data.get("quickTasks", [])
    notes = shared_data.get("notes", [])
    bonifici = shared_data.get("bonifici", [])
    passwordHash = shared_data.get("passwordHash")
    sectionPasswords = shared_data.get("sectionPasswords") or {}

    return {
        "share_id": shared.share_id,
        "title": shared.title,
        "data": {
            "projects": projects,
            "quickTasks": quickTasks,
            "notes": notes,
            "chat": chat,
            "bonifici": bonifici,
            "passwordHash": passwordHash,
            "sectionPasswords": sectionPasswords
        },
        "updated_at": _serialize_dt(shared.updated_at)
    }

async def get_all_shared_dashboards_aggregated(db: AsyncSession):
    """Batch-load all shared dashboards with 3 queries instead of N*4."""
    # 1. All shared dashboards
    res = await db.execute(select(SharedDashboard).order_by(SharedDashboard.updated_at.desc()))
    all_shared = res.scalars().all()
    if not all_shared:
        return []

    share_ids = [sd.share_id for sd in all_shared]
    shared_by_id = {sd.share_id: sd for sd in all_shared}

    # 2. All projects for all shared dashboards in one query
    projs_res = await db.execute(
        select(Project).filter(Project.share_id.in_(share_ids)).order_by(Project.created_at.desc())
    )
    all_projs = projs_res.scalars().all()
    proj_ids = [p.id for p in all_projs]
    projs_by_share: dict[str, list] = {sid: [] for sid in share_ids}
    for p in all_projs:
        projs_by_share[p.share_id].append(p)

    # 3. All tasks for all projects in one query
    tasks_by_project: dict[str, list] = {pid: [] for pid in proj_ids}
    if proj_ids:
        tasks_res = await db.execute(select(Task).filter(Task.project_id.in_(proj_ids)).order_by(Task.created_at))
        for t in tasks_res.scalars().all():
            tasks_by_project[t.project_id].append(t)

    # 4. All chat messages for all shared dashboards in one query
    chat_by_share: dict[str, list] = {sid: [] for sid in share_ids}
    chat_res = await db.execute(
        select(ChatMessage)
        .filter(ChatMessage.share_id.in_(share_ids))
        .order_by(ChatMessage.timestamp.desc())
    )
    for m in chat_res.scalars().all():
        chat_by_share[m.share_id].append(m)

    # Build aggregated results
    results = []
    for sd in all_shared:
        share_id = sd.share_id
        projs = projs_by_share.get(share_id, [])

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

        # Apply saved project order
        shared_data = _parse_json(sd.data, {})
        project_order = shared_data.get("projectOrder") or [] if isinstance(shared_data, dict) else []
        if project_order:
            by_id = {p["id"]: p for p in projects}
            ordered = [by_id[pid] for pid in project_order if pid in by_id]
            tail = [p for p in projects if p["id"] not in project_order]
            projects = ordered + tail

        # Chat (limited to last 100 per dashboard)
        chat_rows = chat_by_share.get(share_id, [])[-100:]
        chat = [
            {
                "id": m.id, "senderId": m.sender_id, "text": m.text,
                "timestamp": int(m.timestamp.timestamp() * 1000)
            }
            for m in chat_rows  # Already in desc order, reversed for chronological
        ]
        chat.reverse()

        if not isinstance(shared_data, dict):
            shared_data = _parse_json(sd.data, {}) or {}
        quickTasks = shared_data.get("quickTasks", [])
        notes = shared_data.get("notes", [])
        bonifici = shared_data.get("bonifici", [])
        passwordHash = shared_data.get("passwordHash")
        sectionPasswords = shared_data.get("sectionPasswords") or {}

        results.append({
            "share_id": sd.share_id,
            "title": sd.title,
            "data": {
                "projects": projects,
                "quickTasks": quickTasks,
                "notes": notes,
                "chat": chat,
                "bonifici": bonifici,
                "passwordHash": passwordHash,
                "sectionPasswords": sectionPasswords
            },
            "updated_at": _serialize_dt(sd.updated_at)
        })

    return results

async def update_shared_dashboard_from_json(db: AsyncSession, share_id: str, data: dict, title: str | None = None):
    """Partial update for shared dashboards."""
    res = await db.execute(select(SharedDashboard).filter(SharedDashboard.share_id == share_id))
    shared = res.scalar_one_or_none()
    
    if not shared:
        shared = SharedDashboard(share_id=share_id, title=title or "Progetti Condivisi", data=data)
        db.add(shared)
    else:
        if title: shared.title = title
        curr_data = dict(_parse_json(shared.data, {}) or {})
        curr_data.update(data)
        if "projectOrder" in data:
            curr_data["projectOrder"] = data["projectOrder"]
        elif "projects" in data:
            curr_data["projectOrder"] = [p["id"] for p in data["projects"]]
        shared.data = curr_data
        flag_modified(shared, "data")

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
