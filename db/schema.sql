PRAGMA foreign_keys = ON;

CREATE TABLE prayers (
  id    TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  body  TEXT NOT NULL
);

CREATE TABLE mystery_sets (
  id         TEXT PRIMARY KEY,
  name       TEXT NOT NULL,
  weekdays   TEXT NOT NULL,      -- comma list, 0 = domingo ... 6 = sabado
  sort_order INTEGER NOT NULL
);

CREATE TABLE mysteries (
  set_id TEXT NOT NULL REFERENCES mystery_sets(id),
  number INTEGER NOT NULL CHECK (number BETWEEN 1 AND 5),
  title  TEXT NOT NULL,
  PRIMARY KEY (set_id, number)
);

CREATE TABLE steps (
  seq        INTEGER PRIMARY KEY, -- order; gaps leave room for inserts
  position   TEXT NOT NULL,       -- bead id from the geometry spec
  title      TEXT NOT NULL,
  prayer_ids TEXT NOT NULL,       -- comma list of prayers.id, in order
  decade     INTEGER,             -- 1..5 on decade steps, else NULL
  ave_number INTEGER,             -- 1..10 on decade Avemarias, else NULL
  optional   INTEGER NOT NULL DEFAULT 0, -- 1 = traditional opening only
  note       TEXT
);
