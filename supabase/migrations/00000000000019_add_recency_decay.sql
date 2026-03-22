-- Migration 19: Add recency_decay field to reputation_snapshots
-- Aligns database schema with shared-types ReputationSnapshot interface

ALTER TABLE reputation_snapshots
ADD COLUMN IF NOT EXISTS recency_decay FLOAT NOT NULL DEFAULT 1.0;

COMMENT ON COLUMN reputation_snapshots.recency_decay IS 'Time-based decay factor (0.0-1.0) applied to reputation score. 1.0 = no decay (recent activity), lower = older activity weighted less.';
