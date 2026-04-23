-- Enable Supabase Realtime on the tables the frontend subscribes to.
-- The `supabase_realtime` publication is created by Supabase on project init.

alter publication supabase_realtime add table games;
alter publication supabase_realtime add table plays;
alter publication supabase_realtime add table worker_health;
