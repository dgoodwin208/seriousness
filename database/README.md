# Seriousness Evaluations Database

This directory contains the database schema and client code for storing seriousness evaluations.

## Schema Overview

The database consists of three main tables:

### 1. `evaluation_targets`
Stores the entities being evaluated (politicians, organizations, etc.)

- `id`: UUID primary key
- `name`: Unique name of the target (e.g., "Donald Trump")
- `metadata`: JSONB field for arbitrary metadata (party, state, role, etc.)
- `created_at`, `updated_at`: Timestamps

**Example metadata for politicians:**
```json
{
  "party": "Republican",
  "state": "FL",
  "office": "Governor",
  "first_elected": "2018"
}
```

### 2. `evaluations`
Stores seriousness evaluations for each target

- `id`: UUID primary key
- `target_id`: Foreign key to `evaluation_targets`
- `context`: System context (e.g., "United States")
- `model`: Model used (e.g., "claude-3-7-sonnet-20250219", "gpt-5")
- `prompt_version`: Version of the prompt template
- Seriousness scores (raw, activation, adjusted)
- `designation`, `stakes`, `fungibility`, `rationale`
- Unique constraint on (target_id, context, model, prompt_version)

### 3. `evidence_tiers`
Stores evidence supporting each evaluation

- Links to evaluations via `evaluation_id`
- Organizes evidence into tiers (T1, T2, T3, T4)

## Setup Instructions

### 1. Create the Schema in Supabase

1. Log into your Supabase project at https://supabase.com
2. Go to the SQL Editor
3. Copy the contents of `schema.sql`
4. Execute the SQL script
5. Verify the tables were created in the Table Editor

### 2. Configure Environment Variables

Create a `.env` file in the project root with:

```bash
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_KEY=your-anon-key
```

Get these values from your Supabase project settings under API.

## Usage

### Saving Evaluations with Metadata

When running evaluations from a CSV, all columns (except the entity column) are automatically saved as metadata:

```bash
python analysis/seriousness_evaluator_v2.py data/political_leaders.csv --model claude --db
```

If your CSV has columns like:
- name
- party
- state
- office

The party, state, and office will be saved as metadata for each target.

### Querying Evaluations with Metadata

```python
from database.supabase_client import SeriousnessDatabase

db = SeriousnessDatabase()

# Get all evaluations for a specific model
evals = db.get_all_evaluations(model="claude-3-7-sonnet-20250219")

# Each evaluation includes target metadata
for eval in evals:
    print(f"{eval['subject']}: {eval['metadata']}")
    print(f"  Designation: {eval['designation']}")
    print(f"  E_adj: {eval['e_adj']}")
```

### Comparing Models

The metadata is automatically included when comparing models:

```python
# Compare evaluations for the same target across models
comparisons = db.get_model_comparison("Joe Biden", "United States")

for eval in comparisons:
    print(f"Model: {eval['model']}")
    print(f"Party: {eval['metadata'].get('party')}")
    print(f"Designation: {eval['designation']}")
```

## Benefits of This Schema

1. **Normalized Data**: Target information is stored once, not duplicated across evaluations
2. **Flexible Metadata**: JSONB allows storing any additional fields without schema changes
3. **Easy Comparisons**: Foreign key relationships make it easy to compare multiple model evaluations for the same target
4. **Preserves Context**: All original CSV data is retained in the metadata field
5. **Scalable**: Can add new metadata fields without database migrations

## Demo Use Case: Multi-Model Political Leader Comparison

For comparing Claude, GPT-5, and DeepSeek evaluations of politicians:

1. Run evaluations with all three models:
   ```bash
   python analysis/seriousness_evaluator_v2.py data/political_leaders.csv --model claude --db
   python analysis/seriousness_evaluator_v2.py data/political_leaders.csv --model gpt --db
   python analysis/seriousness_evaluator_v2.py data/political_leaders.csv --model deepseek --db
   ```

2. Query and compare with metadata intact:
   ```python
   # Get all Claude evaluations
   claude_evals = db.get_all_evaluations(model="claude-3-7-sonnet-20250219")

   # Each includes party affiliation, state, office, etc.
   # Perfect for filtering/grouping by party, state, etc.
   ```

3. The metadata enables rich analysis:
   - Compare seriousness by party affiliation
   - Analyze model agreement by state
   - Track how different models evaluate different offices
