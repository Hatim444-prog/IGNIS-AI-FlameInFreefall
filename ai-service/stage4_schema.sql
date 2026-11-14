-- IGNIS AI Stage 4: visual observations; safe to execute repeatedly.
-- Requires existing sources and experiments tables and CREATE EXTENSION vector.
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
