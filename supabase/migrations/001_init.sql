-- WealthIQ India — Migration 001: Initial setup
-- Enables required Postgres extensions. All tables are added in later migrations.
-- Every table in this project MUST have Row Level Security (RLS) enabled.

-- Enable the pgcrypto extension (used for bcrypt PIN hashing via Supabase Auth helpers)
create extension if not exists pgcrypto;
