-- Schema PostgreSQL/Supabase (convertito da SQLite)
-- Conversioni: DATETIME -> TIMESTAMPTZ, INTEGER PK -> SERIAL, flag 0/1 -> BOOLEAN

CREATE TABLE alembic_version (
	version_num VARCHAR(32) NOT NULL, 
	CONSTRAINT alembic_version_pkc PRIMARY KEY (version_num)
);

CREATE TABLE shared_dashboards (
	id SERIAL PRIMARY KEY, 
	share_id VARCHAR(64) NOT NULL UNIQUE, 
	title VARCHAR(256) NOT NULL, 
	data JSONB NOT NULL, 
	updated_at TIMESTAMPTZ
);

CREATE TABLE users (
	id VARCHAR(128) NOT NULL, 
	email VARCHAR(256), 
	auth_provider VARCHAR(64), 
	created_at TIMESTAMPTZ, 
	CONSTRAINT pk_users PRIMARY KEY (id)
);

CREATE TABLE sources (
	id SERIAL PRIMARY KEY, 
	tipo VARCHAR(32) NOT NULL, 
	url_or_path VARCHAR(2048), 
	title VARCHAR(512), 
	metadata JSONB, 
	trust_score INTEGER NOT NULL, 
	status VARCHAR(32) NOT NULL, 
	content_hash VARCHAR(64), 
	error_code VARCHAR(64), 
	error_message TEXT, 
	created_at TIMESTAMPTZ
);

CREATE TABLE exercises (
	id VARCHAR(32) NOT NULL, 
	name VARCHAR(256) NOT NULL, 
	category VARCHAR(32) NOT NULL, 
	primary_muscles JSONB, 
	secondary_muscles JSONB, 
	cns_fatigue DOUBLE PRECISION NOT NULL, 
	joint_stress JSONB, 
	is_active BOOLEAN NOT NULL, 
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
	locked BOOLEAN, 
	ordinal INTEGER, 
	PRIMARY KEY (id)
);

CREATE TABLE life_goal_tiers (
	id VARCHAR(64) NOT NULL, 
	name VARCHAR(64) NOT NULL, 
	emoji VARCHAR(16), 
	color VARCHAR(32), 
	collapsed BOOLEAN, 
	ordinal INTEGER, 
	CONSTRAINT pk_life_goal_tiers PRIMARY KEY (id)
);

CREATE TABLE audit_events (
	id SERIAL PRIMARY KEY, 
	entity_type VARCHAR(64) NOT NULL, 
	entity_id VARCHAR(64) NOT NULL, 
	action VARCHAR(32) NOT NULL, 
	share_id VARCHAR(64), 
	actor_id VARCHAR(64), 
	old_data JSONB, 
	new_data JSONB, 
	metadata JSONB, 
	timestamp TIMESTAMPTZ
);

CREATE TABLE chat_messages (
	id VARCHAR(64) NOT NULL, 
	share_id VARCHAR(64) NOT NULL, 
	sender_id VARCHAR(64) NOT NULL, 
	text TEXT NOT NULL, 
	timestamp TIMESTAMPTZ, 
	PRIMARY KEY (id), 
	FOREIGN KEY(share_id) REFERENCES shared_dashboards (share_id)
);

CREATE TABLE contents (
	id SERIAL PRIMARY KEY, 
	source_id INTEGER NOT NULL, 
	raw_text TEXT, 
	clean_text TEXT, 
	parse_diagnostics JSONB, 
	created_at TIMESTAMPTZ, 
	FOREIGN KEY(source_id) REFERENCES sources (id)
);

CREATE TABLE daily_completion_log (
	id SERIAL PRIMARY KEY, 
	date VARCHAR(10) NOT NULL, 
	score INTEGER, 
	data JSONB
);

CREATE TABLE daily_readiness (
	id SERIAL PRIMARY KEY, 
	date TIMESTAMPTZ NOT NULL, 
	cns_fatigue DOUBLE PRECISION, 
	muscle_doms JSONB, 
	joint_pain JSONB, 
	created_at TIMESTAMPTZ
);

CREATE TABLE daily_schedules (
	id SERIAL PRIMARY KEY, 
	date TIMESTAMPTZ NOT NULL, 
	template_id VARCHAR(64), 
	is_completed BOOLEAN NOT NULL, 
	FOREIGN KEY(template_id) REFERENCES workout_day_templates (id)
);

CREATE TABLE daily_stats (
	id SERIAL PRIMARY KEY, 
	date VARCHAR(10) NOT NULL, 
	focus_score DOUBLE PRECISION, 
	habit_streak INTEGER, 
	top3_done_count INTEGER, 
	data JSONB, 
	updated_at TIMESTAMPTZ
);

CREATE TABLE dashboard_states (
	id SERIAL PRIMARY KEY, 
	"key" VARCHAR(64) NOT NULL, 
	data JSONB NOT NULL, 
	updated_at TIMESTAMPTZ, 
	user_id TEXT
);

CREATE TABLE domain_events (
	id SERIAL PRIMARY KEY, 
	aggregate_type VARCHAR(64) NOT NULL, 
	aggregate_id VARCHAR(128) NOT NULL, 
	event_type VARCHAR(64) NOT NULL, 
	payload JSONB NOT NULL, 
	user_id VARCHAR(128), 
	version INTEGER, 
	timestamp TIMESTAMPTZ
);

CREATE TABLE habit_logs (
	id SERIAL PRIMARY KEY, 
	habit_id VARCHAR(64) NOT NULL, 
	date VARCHAR(10) NOT NULL, 
	status INTEGER, 
	FOREIGN KEY(habit_id) REFERENCES habits (id)
);

CREATE TABLE life_goals (
	id VARCHAR(64) NOT NULL, 
	tier_id VARCHAR(64) NOT NULL, 
	title VARCHAR(512) NOT NULL, 
	category VARCHAR(64), 
	type VARCHAR(32), 
	done BOOLEAN, 
	deadline VARCHAR(10), 
	ordinal INTEGER, 
	CONSTRAINT pk_life_goals PRIMARY KEY (id), 
	CONSTRAINT fk_life_goals_tier_id_life_goal_tiers FOREIGN KEY(tier_id) REFERENCES life_goal_tiers (id)
);

CREATE TABLE prayer_logs (
	id SERIAL PRIMARY KEY, 
	date VARCHAR(10) NOT NULL, 
	prayer_name VARCHAR(64) NOT NULL, 
	completed BOOLEAN
);

CREATE TABLE projects (
	id VARCHAR(64) NOT NULL, 
	title VARCHAR(256) NOT NULL, 
	share_id VARCHAR(64), 
	created_at TIMESTAMPTZ, 
	ordinal INTEGER, 
	PRIMARY KEY (id), 
	FOREIGN KEY(share_id) REFERENCES shared_dashboards (share_id)
);

CREATE TABLE quick_tasks (
	id VARCHAR(64) NOT NULL, 
	title VARCHAR(512) NOT NULL, 
	done BOOLEAN, 
	deadline VARCHAR(10), 
	created_at TIMESTAMPTZ, 
	ordinal INTEGER, 
	PRIMARY KEY (id)
);

CREATE TABLE sessions (
	id SERIAL PRIMARY KEY, 
	source_id INTEGER, 
	intent VARCHAR(32) NOT NULL, 
	started_at TIMESTAMPTZ, 
	ended_at TIMESTAMPTZ, 
	FOREIGN KEY(source_id) REFERENCES sources (id)
);

CREATE TABLE top3_items (
	id SERIAL PRIMARY KEY, 
	slot INTEGER NOT NULL, 
	project_id VARCHAR(64), 
	task_id VARCHAR(64), 
	quick_task_id VARCHAR(64), 
	title VARCHAR(512), 
	done BOOLEAN
);

CREATE TABLE user_profiles (
	user_id VARCHAR(128) NOT NULL, 
	weight_kg DOUBLE PRECISION, 
	timezone VARCHAR(64), 
	preferences JSONB, 
	CONSTRAINT pk_user_profiles PRIMARY KEY (user_id), 
	CONSTRAINT fk_user_profiles_user_id_users FOREIGN KEY(user_id) REFERENCES users (id) ON DELETE CASCADE
);

CREATE TABLE content_chunks (
	id SERIAL PRIMARY KEY, 
	content_id INTEGER NOT NULL, 
	ordinal INTEGER NOT NULL, 
	text TEXT NOT NULL, 
	token_count INTEGER, 
	created_at TIMESTAMPTZ, 
	FOREIGN KEY(content_id) REFERENCES contents (id)
);

CREATE TABLE insights (
	id SERIAL PRIMARY KEY, 
	content_id INTEGER NOT NULL, 
	text TEXT NOT NULL, 
	transferable_principle TEXT, 
	applicability_contexts JSONB, 
	tipo VARCHAR(32) NOT NULL, 
	session_intent VARCHAR(32), 
	user_rating VARCHAR(32), 
	weight DOUBLE PRECISION NOT NULL, 
	created_at TIMESTAMPTZ, 
	FOREIGN KEY(content_id) REFERENCES contents (id)
);

CREATE TABLE tasks (
	id VARCHAR(64) NOT NULL, 
	project_id VARCHAR(64) NOT NULL, 
	parent_id VARCHAR(64), 
	title VARCHAR(512) NOT NULL, 
	done BOOLEAN, 
	deadline VARCHAR(10), 
	created_at TIMESTAMPTZ, 
	ordinal INTEGER, 
	PRIMARY KEY (id), 
	FOREIGN KEY(project_id) REFERENCES projects (id), 
	FOREIGN KEY(parent_id) REFERENCES tasks (id)
);

CREATE TABLE workout_day_exercises (
	id SERIAL PRIMARY KEY, 
	template_id VARCHAR(64) NOT NULL, 
	exercise_id VARCHAR(32) NOT NULL, 
	base_sets INTEGER NOT NULL, 
	base_reps INTEGER, 
	instruction VARCHAR(512), 
	custom_name VARCHAR(256), 
	ordinal INTEGER NOT NULL, 
	FOREIGN KEY(template_id) REFERENCES workout_day_templates (id), 
	FOREIGN KEY(exercise_id) REFERENCES exercises (id)
);

CREATE TABLE workout_logs (
	id SERIAL PRIMARY KEY, 
	template_id VARCHAR(64), 
	logged_at TIMESTAMPTZ NOT NULL, 
	FOREIGN KEY(template_id) REFERENCES workout_day_templates (id)
);

CREATE TABLE training_progressions (
	id SERIAL PRIMARY KEY, 
	exercise_id VARCHAR(32) NOT NULL, 
	data JSONB NOT NULL, 
	updated_at TIMESTAMPTZ, 
	FOREIGN KEY(exercise_id) REFERENCES exercises (id)
);

CREATE TABLE set_logs (
	id SERIAL PRIMARY KEY, 
	workout_log_id INTEGER NOT NULL, 
	exercise_id VARCHAR(32) NOT NULL, 
	set_number INTEGER NOT NULL, 
	weight_kg DOUBLE PRECISION, 
	reps INTEGER, 
	completed BOOLEAN NOT NULL, 
	FOREIGN KEY(workout_log_id) REFERENCES workout_logs (id), 
	FOREIGN KEY(exercise_id) REFERENCES exercises (id)
);
