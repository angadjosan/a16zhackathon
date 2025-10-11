# Disable Row Level Security (RLS) for Development

## Quick Fix: Disable RLS Completely

### Method 1: Through Supabase Dashboard (Easiest)

1. **Go to your Supabase Dashboard**
2. **Navigate to Storage** (left sidebar)
3. **Click on the `documents` bucket**
4. **Go to Settings tab**
5. **Toggle OFF "Row Level Security"**
6. **Click Save**

### Method 2: Through SQL (Alternative)

1. **Go to SQL Editor** in Supabase Dashboard
2. **Run this SQL to disable RLS on storage:**

```sql
-- Disable RLS on storage.objects table
ALTER TABLE storage.objects DISABLE ROW LEVEL SECURITY;

-- Remove any existing policies on storage.objects
DROP POLICY IF EXISTS "Public Access" ON storage.objects;
DROP POLICY IF EXISTS "Allow public uploads" ON storage.objects;
DROP POLICY IF EXISTS "Allow public downloads" ON storage.objects;
```

3. **Click Run**

### Method 3: Create Permissive Policy (If you want to keep RLS enabled)

If you prefer to keep RLS enabled but allow all operations:

1. **Go to SQL Editor**
2. **Run this SQL:**

```sql
-- Create a permissive policy that allows all operations
CREATE POLICY "Allow all operations" ON storage.objects
FOR ALL USING (true) WITH CHECK (true);
```

## Verify the Fix

After disabling RLS:

1. **Restart your development server:**
   ```bash
   npm run dev
   ```

2. **Try uploading a file** - it should work without RLS errors

## Security Note

⚠️ **Important**: Disabling RLS removes all security restrictions. This is fine for development but should NOT be used in production. For production, you'll want to create proper RLS policies.

## Alternative: Quick Test Mode

If you want to test without setting up Supabase at all, I can create a mock mode that bypasses Supabase entirely. Would you like me to do that?
