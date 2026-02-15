# Supabase Database Migrations

## How to Run Migrations

### Option 1: Supabase SQL Editor (Recommended for MVP)

1. Go to your Supabase project dashboard
2. Click **SQL Editor** in the sidebar
3. Click **New Query**
4. Copy and paste the contents of `migrations/001_households_schema.sql`
5. Click **Run** (or press Cmd/Ctrl + Enter)
6. Verify tables were created:
   - Go to **Table Editor**
   - You should see `households` and `household_members` tables

### Option 2: Supabase CLI (For Production)

```bash
# Install Supabase CLI
npm install -g supabase

# Login to Supabase
supabase login

# Link to your project
supabase link --project-ref your-project-ref

# Run migrations
supabase db push
```

## Database Schema

### `households` Table

| Column       | Type      | Description                        |
|-------------|-----------|-------------------------------------|
| id          | UUID      | Primary key                         |
| name        | TEXT      | Household name                      |
| created_by  | UUID      | User who created the household      |
| created_at  | TIMESTAMP | Creation timestamp                  |
| updated_at  | TIMESTAMP | Last update timestamp (auto-updated)|

### `household_members` Table

| Column       | Type      | Description                              |
|-------------|-----------|------------------------------------------|
| id          | UUID      | Primary key                               |
| household_id| UUID      | Foreign key to households                 |
| user_id     | UUID      | Foreign key to auth.users                 |
| permission  | TEXT      | 'read' or 'write'                         |
| invited_by  | UUID      | User who invited this member              |
| joined_at   | TIMESTAMP | When the user joined                      |

## Row Level Security (RLS)

All tables have RLS enabled with the following policies:

**households:**
- ✅ Users can view households they're members of
- ✅ Users can create new households
- ✅ Users with write permission can update households
- ✅ Creators can delete their households

**household_members:**
- ✅ Users can view members of their households
- ✅ Users with write permission can add members
- ✅ Users with write permission can update member permissions
- ✅ Users with write permission can remove members
- ✅ Users can remove themselves from any household

## Auto-Triggers

1. **Auto-update `updated_at`**: Automatically updates the `updated_at` column when a household is modified
2. **Auto-add creator as member**: When a household is created, the creator is automatically added as a member with write permission
