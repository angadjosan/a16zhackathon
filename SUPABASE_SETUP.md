# Supabase Setup Guide

## Current Status
✅ Supabase project connected  
❌ Database schema not created  
❌ Storage bucket not created  

## Step 1: Create Database Tables

1. Go to your Supabase dashboard
2. Navigate to **SQL Editor** (in the left sidebar)
3. Copy and paste the entire contents of `database/schema.sql` into the SQL editor
4. Click **Run** to execute the SQL

This will create:
- `documents` table for storing uploaded files
- `extractions` table for AI-extracted data
- `proofs` table for verification proofs
- All necessary indexes and triggers

## Step 2: Create Storage Bucket

1. In your Supabase dashboard, go to **Storage** (in the left sidebar)
2. Click **New bucket**
3. Name it: `documents`
4. Set it to **Public** (so uploaded files can be accessed via URL)
5. Click **Create bucket**

## Step 3: Set Storage Policies (Optional)

If you want to restrict access, you can set up storage policies:

1. Go to **Storage** → **Policies**
2. Create a policy for the `documents` bucket
3. For now, you can use a simple policy that allows all operations

## Step 4: Test the Setup

After completing steps 1-2, restart your development server:

```bash
npm run dev
```

Then try uploading a file - it should work without errors!

## Troubleshooting

### If you get "table not found" errors:
- Make sure you ran the SQL schema in the SQL Editor
- Check that the tables appear in the **Table Editor**

### If you get "bucket not found" errors:
- Make sure you created the `documents` bucket in Storage
- Check that the bucket is set to Public

### If you get permission errors:
- You may need to enable RLS (Row Level Security) and create policies
- For development, you can temporarily disable RLS in the table settings
