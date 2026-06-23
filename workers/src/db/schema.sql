CREATE TABLE IF NOT EXISTS tenants (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  plan TEXT NOT NULL,
  settings TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS questionnaires (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  source_format TEXT NOT NULL,
  original_file_key TEXT NOT NULL,
  original_file_name TEXT NOT NULL,
  original_file_size INTEGER,
  status TEXT NOT NULL,
  progress_total INTEGER,
  progress_parsed INTEGER,
  progress_answered INTEGER,
  progress_validated INTEGER,
  progress_approved INTEGER,
  progress_exported INTEGER,
  metadata TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  completed_at TEXT,
  exported_at TEXT,
  FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS questions (
  id TEXT PRIMARY KEY,
  questionnaire_id TEXT NOT NULL,
  section TEXT,
  subsection TEXT,
  number TEXT,
  text TEXT NOT NULL,
  type TEXT,
  required INTEGER,
  options TEXT,
  context TEXT,
  row_index INTEGER,
  column_mapping TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  FOREIGN KEY (questionnaire_id) REFERENCES questionnaires(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS answers (
  id TEXT PRIMARY KEY,
  question_id TEXT NOT NULL,
  questionnaire_id TEXT NOT NULL,
  tenant_id TEXT NOT NULL,
  text TEXT,
  confidence REAL,
  citations TEXT,
  reasoning TEXT,
  status TEXT,
  generated_by TEXT,
  model_used TEXT,
  tokens_used INTEGER,
  processing_time_ms INTEGER,
  validated_by TEXT,
  validated_at TEXT,
  approved_by TEXT,
  approved_at TEXT,
  rejected_by TEXT,
  rejected_at TEXT,
  rejection_reason TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  FOREIGN KEY (question_id) REFERENCES questions(id) ON DELETE CASCADE,
  FOREIGN KEY (questionnaire_id) REFERENCES questionnaires(id) ON DELETE CASCADE,
  FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS kb_docs (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL,
  name TEXT NOT NULL,
  original_file_name TEXT,
  original_file_key TEXT,
  original_file_size INTEGER,
  mime_type TEXT,
  type TEXT,
  description TEXT,
  tags TEXT,
  metadata TEXT,
  processing_status TEXT,
  processing_error TEXT,
  chunk_count INTEGER,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  processed_at TEXT,
  FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS kb_chunks (
  id TEXT PRIMARY KEY,
  doc_id TEXT NOT NULL,
  tenant_id TEXT NOT NULL,
  text TEXT NOT NULL,
  metadata TEXT,
  created_at TEXT NOT NULL,
  FOREIGN KEY (doc_id) REFERENCES kb_docs(id) ON DELETE CASCADE,
  FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE
);
