-- Seriousness Evaluations Database Schema
-- This schema supports storing evaluation targets and their seriousness evaluations

-- Drop existing tables
DROP TABLE IF EXISTS evidence_tiers CASCADE;
DROP TABLE IF EXISTS evaluations CASCADE;
DROP TABLE IF EXISTS evaluation_targets CASCADE;

-- Table for entities being evaluated (politicians, organizations, etc.)
CREATE TABLE evaluation_targets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL UNIQUE,
    metadata JSONB DEFAULT '{}',  -- Store arbitrary metadata (party, state, role, etc.)
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Table for seriousness evaluations
CREATE TABLE evaluations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    target_id UUID NOT NULL REFERENCES evaluation_targets(id) ON DELETE CASCADE,
    context TEXT NOT NULL,
    model TEXT NOT NULL,
    prompt_version TEXT NOT NULL,

    -- Milestone and time horizon
    milestone TEXT,
    time_horizon_start TEXT,
    time_horizon_end TEXT,

    -- Raw scores (before activation adjustment)
    e_raw NUMERIC,
    v_raw NUMERIC,
    alpha_raw NUMERIC,

    -- Activation energy
    ea_required NUMERIC,
    ea_committed NUMERIC,
    a_factor_e NUMERIC,
    a_factor_v NUMERIC,
    a_factor_alpha NUMERIC,

    -- Adjusted scores (after activation)
    e_adj NUMERIC,
    v_adj NUMERIC,
    alpha_adj NUMERIC,
    magnitude NUMERIC,

    -- Designation and qualitative factors
    designation TEXT,
    stakes TEXT,
    fungibility TEXT,
    rationale TEXT,

    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

    -- Unique constraint: one evaluation per target/context/model/version combination
    CONSTRAINT unique_evaluation UNIQUE (target_id, context, model, prompt_version)
);

-- Table for evidence tiers
CREATE TABLE evidence_tiers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    evaluation_id UUID NOT NULL REFERENCES evaluations(id) ON DELETE CASCADE,
    tier TEXT NOT NULL CHECK (tier IN ('T1', 'T2', 'T3', 'T4')),
    evidence_text TEXT NOT NULL,
    sequence_order INTEGER,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX idx_evaluations_target_id ON evaluations(target_id);
CREATE INDEX idx_evaluations_model ON evaluations(model);
CREATE INDEX idx_evaluations_designation ON evaluations(designation);
CREATE INDEX idx_evaluations_context ON evaluations(context);
CREATE INDEX idx_evaluations_prompt_version ON evaluations(prompt_version);
CREATE INDEX idx_evidence_evaluation_id ON evidence_tiers(evaluation_id);
CREATE INDEX idx_targets_name ON evaluation_targets(name);

-- Updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers to update updated_at
CREATE TRIGGER update_evaluation_targets_updated_at BEFORE UPDATE ON evaluation_targets
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_evaluations_updated_at BEFORE UPDATE ON evaluations
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
