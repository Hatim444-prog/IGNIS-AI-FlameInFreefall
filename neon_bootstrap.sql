-- IGNIS AI: bootstrap PostgreSQL schema for Neon (or any Postgres 16+ with pgvector).
-- Run once in the Neon SQL Editor or: psql "$DATABASE_URL" -v ON_ERROR_STOP=1 -f neon_bootstrap.sql

CREATE EXTENSION IF NOT EXISTS vector;

CREATE TABLE IF NOT EXISTS investigations (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    code TEXT NOT NULL UNIQUE,
    title TEXT NOT NULL,
    objective TEXT,
    description TEXT,
    nasa_url TEXT
);

CREATE TABLE IF NOT EXISTS experiments (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    investigation_id BIGINT NOT NULL REFERENCES investigations(id) ON DELETE CASCADE,
    experiment_code TEXT NOT NULL,
    fuel_material TEXT,
    fuel_phase TEXT,
    oxygen_percent DOUBLE PRECISION,
    pressure_pa DOUBLE PRECISION,
    airflow_m_s DOUBLE PRECISION,
    gravity_condition TEXT,
    research_focus TEXT,
    experiment_date DATE,
    flow_direction TEXT,
    gaps_sequence TEXT,
    filler_material TEXT,
    sample_thickness_mm DOUBLE PRECISION,
    pixel_ratio_mm_px DOUBLE PRECISION,
    ir_data_file TEXT,
    UNIQUE (investigation_id, experiment_code)
);

CREATE TABLE IF NOT EXISTS sources (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    investigation_id BIGINT REFERENCES investigations(id) ON DELETE SET NULL,
    experiment_id BIGINT REFERENCES experiments(id) ON DELETE SET NULL,
    filename TEXT NOT NULL,
    file_type TEXT NOT NULL,
    source_url TEXT,
    local_path TEXT,
    sha256 TEXT,
    verification_status TEXT NOT NULL DEFAULT 'unverified'
);

CREATE TABLE IF NOT EXISTS measurements (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    experiment_id BIGINT NOT NULL REFERENCES experiments(id) ON DELETE CASCADE,
    source_id BIGINT NOT NULL REFERENCES sources(id) ON DELETE CASCADE,
    variable_name TEXT NOT NULL,
    value DOUBLE PRECISION NOT NULL,
    unit TEXT,
    uncertainty DOUBLE PRECISION,
    source_row INTEGER,
    timestamp_s DOUBLE PRECISION
);

CREATE TABLE IF NOT EXISTS document_chunks (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    source_id BIGINT NOT NULL REFERENCES sources(id) ON DELETE CASCADE,
    chunk_index INTEGER NOT NULL,
    page_number INTEGER,
    content TEXT NOT NULL,
    embedding VECTOR(768),
    UNIQUE (source_id, chunk_index)
);

CREATE INDEX IF NOT EXISTS document_chunks_embedding_hnsw_idx
ON document_chunks USING hnsw (embedding vector_cosine_ops);

CREATE TABLE IF NOT EXISTS visual_observations (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    source_id BIGINT NOT NULL UNIQUE REFERENCES sources(id) ON DELETE CASCADE,
    experiment_id BIGINT REFERENCES experiments(id),
    description TEXT NOT NULL,
    analysis_type TEXT NOT NULL,
    model_name TEXT NOT NULL,
    sampled_timestamps_s JSONB,
    embedding VECTOR(768) NOT NULL,
    review_status TEXT NOT NULL DEFAULT 'pending_review'
      CHECK (review_status IN ('pending_review', 'reviewed')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS visual_observations_experiment_idx
ON visual_observations(experiment_id);

CREATE INDEX IF NOT EXISTS visual_observations_embedding_hnsw_idx
ON visual_observations USING hnsw (embedding vector_cosine_ops);
