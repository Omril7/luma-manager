ALTER TABLE balance_snapshots
  ADD CONSTRAINT balance_snapshots_user_month_key UNIQUE (user_id, snapshot_month);
