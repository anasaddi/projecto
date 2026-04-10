-- Schema esportato da km_db.sqlite
-- Per migrazione a PostgreSQL: convertire DATETIME -> TIMESTAMPTZ, INTEGER PK -> SERIAL

CREATE TABLE alembic_version (
	version_num VARCHAR(32) NOT NULL, 
	CONSTRAINT alembic_version_pkc PRIMARY KEY (version_num)
);

CREATE TABLE shared_dashboards (
	id INTEGER NOT NULL, 
	share_id VARCHAR(64) NOT NULL UNIQUE, 
	title VARCHAR(256) NOT NULL, 
	data JSON NOT NULL, 
	updated_at DATETIME, 
	PRIMARY KEY (id)
);

CREATE TABLE users (
	id VARCHAR(128) NOT NULL, 
	email VARCHAR(256), 
	auth_provider VARCHAR(64), 
	created_at DATETIME, 
	CONSTRAINT pk_users PRIMARY KEY (id)
);

CREATE TABLE sources (
	id INTEGER NOT NULL, 
	tipo VARCHAR(32) NOT NULL, 
	url_or_path VARCHAR(2048), 
	title VARCHAR(512), 
	metadata JSON, 
	trust_score INTEGER NOT NULL, 
	status VARCHAR(32) NOT NULL, 
	content_hash VARCHAR(64), 
	error_code VARCHAR(64), 
	error_message TEXT, 
	created_at DATETIME, 
	PRIMARY KEY (id)
);

CREATE TABLE exercises (
	id VARCHAR(32) NOT NULL, 
	name VARCHAR(256) NOT NULL, 
	category VARCHAR(32) NOT NULL, 
	primary_muscles JSON, 
	secondary_muscles JSON, 
	cns_fatigue FLOAT NOT NULL, 
	joint_stress JSON, 
	is_active INTEGER NOT NULL, 
	PRIMARY KEY (id)
);

CREATE TABLE workout_day_templates (
	id VARCHAR(64) NOT NULL, 
	day_name VARCHAR(256) NOT NULL, 
	weekday INTEGER, 
	PRIMARY KEY (id)
);

CREATE TABLE habits (
	id VARCHAR(64) NOT NULL, 
	title VARCHAR(256) NOT NULL, 
	locked INTEGER, 
	ordinal INTEGER, 
	PRIMARY KEY (id)
);

CREATE TABLE life_goal_tiers (
	id VARCHAR(64) NOT NULL, 
	name VARCHAR(64) NOT NULL, 
	emoji VARCHAR(16), 
	color VARCHAR(32), 
	collapsed INTEGER, 
	ordinal INTEGER, 
	CONSTRAINT pk_life_goal_tiers PRIMARY KEY (id)
);

CREATE TABLE audit_events (
	id INTEGER NOT NULL, 
	entity_type VARCHAR(64) NOT NULL, 
	entity_id VARCHAR(64) NOT NULL, 
	action VARCHAR(32) NOT NULL, 
	share_id VARCHAR(64), 
	actor_id VARCHAR(64), 
	old_data JSON, 
	new_data JSON, 
	metadata JSON, 
	timestamp DATETIME, 
	PRIMARY KEY (id)
);

CREATE TABLE chat_messages (
	id VARCHAR(64) NOT NULL, 
	share_id VARCHAR(64) NOT NULL, 
	sender_id VARCHAR(64) NOT NULL, 
	text TEXT NOT NULL, 
	timestamp DATETIME, 
	PRIMARY KEY (id), 
	FOREIGN KEY(share_id) REFERENCES shared_dashboards (share_id)
);

CREATE TABLE contents (
	id INTEGER NOT NULL, 
	source_id INTEGER NOT NULL, 
	raw_text TEXT, 
	clean_text TEXT, 
	parse_diagnostics JSON, 
	created_at DATETIME, 
	PRIMARY KEY (id), 
	FOREIGN KEY(source_id) REFERENCES sources (id)
);

CREATE TABLE daily_completion_log (
	id INTEGER NOT NULL, 
	date VARCHAR(10) NOT NULL, 
	score INTEGER, 
	data JSON, 
	CONSTRAINT pk_daily_completion_log PRIMARY KEY (id)
);

CREATE TABLE daily_readiness (
	id INTEGER NOT NULL, 
	date DATETIME NOT NULL, 
	cns_fatigue FLOAT, 
	muscle_doms JSON, 
	joint_pain JSON, 
	created_at DATETIME, 
	PRIMARY KEY (id)
);

CREATE TABLE daily_schedules (
	id INTEGER NOT NULL, 
	date DATETIME NOT NULL, 
	template_id VARCHAR(64), 
	is_completed INTEGER NOT NULL, 
	PRIMARY KEY (id), 
	FOREIGN KEY(template_id) REFERENCES workout_day_templates (id)
);

CREATE TABLE daily_stats (
	id INTEGER NOT NULL, 
	date VARCHAR(10) NOT NULL, 
	focus_score FLOAT, 
	habit_streak INTEGER, 
	top3_done_count INTEGER, 
	data JSON, 
	updated_at DATETIME, 
	CONSTRAINT pk_daily_stats PRIMARY KEY (id)
);

CREATE TABLE dashboard_states (
	id INTEGER NOT NULL, 
	"key" VARCHAR(64) NOT NULL, 
	data JSON NOT NULL, 
	updated_at DATETIME, 
	user_id TEXT, 
	PRIMARY KEY (id)
);

CREATE TABLE domain_events (
	id INTEGER NOT NULL, 
	aggregate_type VARCHAR(64) NOT NULL, 
	aggregate_id VARCHAR(128) NOT NULL, 
	event_type VARCHAR(64) NOT NULL, 
	payload JSON NOT NULL, 
	user_id VARCHAR(128), 
	version INTEGER, 
	timestamp DATETIME, 
	CONSTRAINT pk_domain_events PRIMARY KEY (id)
);

CREATE TABLE habit_logs (
	id INTEGER NOT NULL, 
	habit_id VARCHAR(64) NOT NULL, 
	date VARCHAR(10) NOT NULL, 
	status INTEGER, 
	PRIMARY KEY (id), 
	FOREIGN KEY(habit_id) REFERENCES habits (id)
);

CREATE TABLE life_goals (
	id VARCHAR(64) NOT NULL, 
	tier_id VARCHAR(64) NOT NULL, 
	title VARCHAR(512) NOT NULL, 
	category VARCHAR(64), 
	type VARCHAR(32), 
	done INTEGER, 
	deadline VARCHAR(10), 
	ordinal INTEGER, 
	CONSTRAINT pk_life_goals PRIMARY KEY (id), 
	CONSTRAINT fk_life_goals_tier_id_life_goal_tiers FOREIGN KEY(tier_id) REFERENCES life_goal_tiers (id)
);

CREATE TABLE prayer_logs (
	id INTEGER NOT NULL, 
	date VARCHAR(10) NOT NULL, 
	prayer_name VARCHAR(64) NOT NULL, 
	completed INTEGER, 
	CONSTRAINT pk_prayer_logs PRIMARY KEY (id)
);

CREATE TABLE projects (
	id VARCHAR(64) NOT NULL, 
	title VARCHAR(256) NOT NULL, 
	share_id VARCHAR(64), 
	created_at DATETIME, 
	ordinal INTEGER, 
	PRIMARY KEY (id), 
	FOREIGN KEY(share_id) REFERENCES shared_dashboards (share_id)
);

CREATE TABLE quick_tasks (
	id VARCHAR(64) NOT NULL, 
	title VARCHAR(512) NOT NULL, 
	done INTEGER, 
	deadline VARCHAR(10), 
	created_at DATETIME, 
	ordinal INTEGER, 
	PRIMARY KEY (id)
);

CREATE TABLE sessions (
	id INTEGER NOT NULL, 
	source_id INTEGER, 
	intent VARCHAR(32) NOT NULL, 
	started_at DATETIME, 
	ended_at DATETIME, 
	PRIMARY KEY (id), 
	FOREIGN KEY(source_id) REFERENCES sources (id)
);

CREATE TABLE top3_items (
	id INTEGER NOT NULL, 
	slot INTEGER NOT NULL, 
	project_id VARCHAR(64), 
	task_id VARCHAR(64), 
	quick_task_id VARCHAR(64), 
	title VARCHAR(512), 
	done INTEGER, 
	CONSTRAINT pk_top3_items PRIMARY KEY (id)
);

CREATE TABLE user_profiles (
	user_id VARCHAR(128) NOT NULL, 
	weight_kg FLOAT, 
	timezone VARCHAR(64), 
	preferences JSON, 
	CONSTRAINT pk_user_profiles PRIMARY KEY (user_id), 
	CONSTRAINT fk_user_profiles_user_id_users FOREIGN KEY(user_id) REFERENCES users (id) ON DELETE CASCADE
);

CREATE TABLE content_chunks (
	id INTEGER NOT NULL, 
	content_id INTEGER NOT NULL, 
	ordinal INTEGER NOT NULL, 
	text TEXT NOT NULL, 
	token_count INTEGER, 
	created_at DATETIME, 
	PRIMARY KEY (id), 
	FOREIGN KEY(content_id) REFERENCES contents (id)
);

CREATE TABLE insights (
	id INTEGER NOT NULL, 
	content_id INTEGER NOT NULL, 
	text TEXT NOT NULL, 
	transferable_principle TEXT, 
	applicability_contexts JSON, 
	tipo VARCHAR(32) NOT NULL, 
	session_intent VARCHAR(32), 
	user_rating VARCHAR(32), 
	weight FLOAT NOT NULL, 
	created_at DATETIME, 
	PRIMARY KEY (id), 
	FOREIGN KEY(content_id) REFERENCES contents (id)
);

CREATE TABLE tasks (
	id VARCHAR(64) NOT NULL, 
	project_id VARCHAR(64) NOT NULL, 
	parent_id VARCHAR(64), 
	title VARCHAR(512) NOT NULL, 
	done INTEGER, 
	deadline VARCHAR(10), 
	created_at DATETIME, 
	ordinal INTEGER, 
	PRIMARY KEY (id), 
	FOREIGN KEY(project_id) REFERENCES projects (id), 
	FOREIGN KEY(parent_id) REFERENCES tasks (id)
);

CREATE TABLE workout_day_exercises (
	id INTEGER NOT NULL, 
	template_id VARCHAR(64) NOT NULL, 
	exercise_id VARCHAR(32) NOT NULL, 
	base_sets INTEGER NOT NULL, 
	base_reps INTEGER, 
	instruction VARCHAR(512), 
	custom_name VARCHAR(256), 
	ordinal INTEGER NOT NULL, 
	PRIMARY KEY (id), 
	FOREIGN KEY(template_id) REFERENCES workout_day_templates (id), 
	FOREIGN KEY(exercise_id) REFERENCES exercises (id)
);

CREATE TABLE workout_logs (
	id INTEGER NOT NULL, 
	template_id VARCHAR(64), 
	logged_at DATETIME NOT NULL, 
	PRIMARY KEY (id), 
	FOREIGN KEY(template_id) REFERENCES workout_day_templates (id)
);

CREATE TABLE training_progressions (
	id INTEGER NOT NULL, 
	exercise_id VARCHAR(32) NOT NULL, 
	data JSON NOT NULL, 
	updated_at DATETIME, 
	PRIMARY KEY (id), 
	FOREIGN KEY(exercise_id) REFERENCES exercises (id)
);

CREATE TABLE set_logs (
	id INTEGER NOT NULL, 
	workout_log_id INTEGER NOT NULL, 
	exercise_id VARCHAR(32) NOT NULL, 
	set_number INTEGER NOT NULL, 
	weight_kg FLOAT, 
	reps INTEGER, 
	completed INTEGER NOT NULL, 
	PRIMARY KEY (id), 
	FOREIGN KEY(workout_log_id) REFERENCES workout_logs (id), 
	FOREIGN KEY(exercise_id) REFERENCES exercises (id)
);
