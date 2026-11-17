CREATE TABLE IF NOT EXISTS dashboard_state (
 id smallint PRIMARY KEY CHECK (id=1),
 revision bigint NOT NULL DEFAULT 0,
 payload jsonb NOT NULL DEFAULT '{}'::jsonb,
 updated_at timestamptz NOT NULL DEFAULT now()
);
INSERT INTO dashboard_state(id,revision,payload) VALUES(1,0,'{}'::jsonb) ON CONFLICT(id) DO NOTHING;
