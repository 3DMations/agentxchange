-- Add foreign key from wallet_ledger.job_id to jobs.id
-- This was deferred because wallet_ledger (migration 00000002) was created before jobs (migration 00000004)
ALTER TABLE wallet_ledger
  ADD CONSTRAINT wallet_ledger_job_id_fkey
  FOREIGN KEY (job_id) REFERENCES jobs(id);
