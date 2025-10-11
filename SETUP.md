# Environment Setup Instructions

## Supabase Configuration

The application requires Supabase configuration to function properly. Follow these steps:

### 1. Create a Supabase Project

1. Go to [supabase.com](https://supabase.com)
2. Create a new project
3. Note down your project URL and anon key

### 2. Configure Environment Variables

The `.env.local` file has been created with placeholder values. Update it with your actual Supabase credentials:

```bash
# Replace these with your actual Supabase project credentials
NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
```

### 3. Set up Supabase Database

Run the SQL schema from `database/schema.sql` in your Supabase SQL editor to create the required tables.

### 4. Configure Storage Bucket

1. Go to Storage in your Supabase dashboard
2. Create a new bucket named `documents`
3. Set the bucket to public if you want public access to uploaded files

### 5. Other Environment Variables

Update the other environment variables as needed:

```bash
# Google Cloud Vision API (if using)
GOOGLE_APPLICATION_CREDENTIALS=./service_account.json

# Anthropic Claude API (if using)
ANTHROPIC_API_KEY=your-claude-api-key-here

# File upload configuration
MAX_FILE_SIZE=10485760
ALLOWED_FILE_TYPES=image/jpeg,image/png,application/pdf
```

## Testing the Setup

After configuring the environment variables, restart your development server:

```bash
npm run dev
```

The application should now work without the Supabase configuration errors.
