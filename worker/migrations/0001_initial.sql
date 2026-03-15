-- Users
CREATE TABLE users (
  id TEXT PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  name TEXT,
  avatar_url TEXT,
  role TEXT DEFAULT 'user', -- 'user' | 'admin'
  created_at INTEGER DEFAULT (unixepoch())
);

-- Topics
CREATE TABLE topics (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  type TEXT NOT NULL, -- 'keyword' | 'youtube_channel' | 'youtube_playlist'
  value TEXT NOT NULL,
  display_name TEXT,
  is_active INTEGER DEFAULT 1,
  created_at INTEGER DEFAULT (unixepoch()),
  FOREIGN KEY (user_id) REFERENCES users(id)
);

-- Refresh Jobs
CREATE TABLE refresh_jobs (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  status TEXT DEFAULT 'pending', -- 'pending' | 'running' | 'done' | 'failed'
  triggered_at INTEGER DEFAULT (unixepoch()),
  completed_at INTEGER,
  error_text TEXT,
  FOREIGN KEY (user_id) REFERENCES users(id)
);

-- Raw Sources (fetched before dedup)
CREATE TABLE topic_sources (
  id TEXT PRIMARY KEY,
  topic_id TEXT NOT NULL,
  refresh_job_id TEXT NOT NULL,
  source_url TEXT,
  title TEXT,
  raw_content TEXT,
  embedding_vector TEXT, -- JSON array
  fetched_at INTEGER DEFAULT (unixepoch()),
  FOREIGN KEY (topic_id) REFERENCES topics(id)
);

-- Summary Documents (post dedup + LLM)
CREATE TABLE summary_documents (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  refresh_job_id TEXT NOT NULL,
  topic_id TEXT,
  title TEXT NOT NULL,
  summary_text TEXT NOT NULL,
  source_urls TEXT, -- JSON array of source URLs
  created_at INTEGER DEFAULT (unixepoch()),
  FOREIGN KEY (user_id) REFERENCES users(id)
);

-- Glossary Terms
CREATE TABLE glossary_terms (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  term TEXT NOT NULL,
  definition TEXT NOT NULL,
  source_summary_id TEXT,
  created_at INTEGER DEFAULT (unixepoch()),
  FOREIGN KEY (user_id) REFERENCES users(id)
);

-- Quiz Sets
CREATE TABLE quiz_sets (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  summary_id TEXT NOT NULL,
  questions TEXT NOT NULL, -- JSON array of {question, options[], correct_index}
  score INTEGER,
  completed_at INTEGER,
  created_at INTEGER DEFAULT (unixepoch()),
  FOREIGN KEY (user_id) REFERENCES users(id)
);

-- Audio Assets
CREATE TABLE audio_assets (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  summary_id TEXT NOT NULL,
  r2_key TEXT NOT NULL,
  duration_seconds INTEGER,
  created_at INTEGER DEFAULT (unixepoch()),
  FOREIGN KEY (user_id) REFERENCES users(id)
);
