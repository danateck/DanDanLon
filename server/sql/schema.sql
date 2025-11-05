CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE TABLE IF NOT EXISTS app_users (
  email         TEXT PRIMARY KEY,
  display_name  TEXT,
  photo_url     TEXT,
  created_at    TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS documents (
  id                   UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  owner_email          TEXT NOT NULL REFERENCES app_users(email) ON DELETE CASCADE,
  title                TEXT NOT NULL,
  file_name            TEXT NOT NULL,
  mime_type            TEXT NOT NULL,
  file_size            BIGINT,
  category             TEXT,
  year                 TEXT,
  org                  TEXT,
  recipient            JSONB DEFAULT '[]'::jsonb,
  shared_with          TEXT[] DEFAULT '{}',
  warranty_start       TIMESTAMPTZ,
  warranty_expires_at  TIMESTAMPTZ,
  auto_delete_after    TIMESTAMPTZ,
  uploaded_at          TIMESTAMPTZ DEFAULT now(),
  last_modified        TIMESTAMPTZ DEFAULT now(),
  file_data            BYTEA,
  file_url             TEXT
);

CREATE INDEX IF NOT EXISTS idx_documents_owner ON documents(owner_email);
