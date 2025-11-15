CREATE TABLE IF NOT EXISTS workflow_versions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  workflow_id INTEGER NOT NULL,
  version INTEGER NOT NULL,
  definition_json TEXT NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (workflow_id) REFERENCES workflows (id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS workflow_nodes (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  workflow_version_id INTEGER NOT NULL,
  node_id TEXT NOT NULL,
  type TEXT NOT NULL,
  label TEXT,
  entry_actions_json TEXT,
  exit_actions_json TEXT,
  metadata_json TEXT,
  FOREIGN KEY (workflow_version_id) REFERENCES workflow_versions (id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS workflow_transitions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  workflow_version_id INTEGER NOT NULL,
  transition_id TEXT NOT NULL,
  source_node_id TEXT NOT NULL,
  target_node_id TEXT NOT NULL,
  trigger_json TEXT,
  validators_json TEXT,
  FOREIGN KEY (workflow_version_id) REFERENCES workflow_versions (id) ON DELETE CASCADE
);

