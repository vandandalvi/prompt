CREATE TABLE IF NOT EXISTS interactions (
  id INTEGER PRIMARY KEY,
  raw_input TEXT,
  normalized_text TEXT,
  intent TEXT,
  final_prompt TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS memory (
  id INTEGER PRIMARY KEY,
  task TEXT,
  domain TEXT,
  usage_count INTEGER DEFAULT 1
);
