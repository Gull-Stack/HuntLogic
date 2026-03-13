-- Feature 10: Credential Vaulting
-- State portal credentials with AES-256-GCM encryption

CREATE TABLE IF NOT EXISTS state_credentials (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  state_code TEXT NOT NULL,
  username TEXT NOT NULL,
  credential_blob TEXT NOT NULL,
  last_verified TIMESTAMP WITH TIME ZONE,
  status TEXT NOT NULL DEFAULT 'active',
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, state_code)
);

CREATE INDEX IF NOT EXISTS idx_state_credentials_user_id ON state_credentials(user_id);
CREATE INDEX IF NOT EXISTS idx_state_credentials_state_code ON state_credentials(state_code);
