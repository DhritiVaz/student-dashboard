-- Users table: passwords are never stored; only password_hash (bcrypt) is stored.
CREATE TABLE IF NOT EXISTS users (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email      VARCHAR(255) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  name       VARCHAR(255) NOT NULL,
  student_id VARCHAR(50) DEFAULT NULL,
  department VARCHAR(255) DEFAULT 'Not Specified',
  avatar     VARCHAR(10) DEFAULT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_users_email ON users (LOWER(email));

-- Dashboard data per user (courses, timetable, calendar, notes, files, grades)
CREATE TABLE IF NOT EXISTS user_dashboard_data (
  user_id         UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  courses        JSONB NOT NULL DEFAULT '[]',
  calendar_events JSONB NOT NULL DEFAULT '[]',
  mind_space_items JSONB NOT NULL DEFAULT '[]',
  timetable      JSONB NOT NULL DEFAULT '{}',
  files          JSONB NOT NULL DEFAULT '[]',
  grades         JSONB NOT NULL DEFAULT '[]',
  updated_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
