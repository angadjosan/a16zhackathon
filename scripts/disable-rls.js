#!/usr/bin/env node

/**
 * Disable RLS Script
 * This script helps disable Row Level Security for development
 */

const { createClient } = require('@supabase/supabase-js');

async function disableRLS() {
  console.log('🔧 Disabling Row Level Security for development...\n');
  
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  
  if (!url || !anonKey) {
    console.error('❌ Missing Supabase environment variables');
    return false;
  }
  
  try {
    const supabase = createClient(url, anonKey);
    
    console.log('📝 Running SQL to disable RLS...');
    
    // Disable RLS on storage.objects
    const { error: rlsError } = await supabase.rpc('exec_sql', {
      sql: 'ALTER TABLE storage.objects DISABLE ROW LEVEL SECURITY;'
    });
    
    if (rlsError) {
      console.log('⚠️  Could not disable RLS via RPC, trying alternative method...');
      
      // Alternative: Create permissive policy
      const { error: policyError } = await supabase.rpc('exec_sql', {
        sql: `
          DROP POLICY IF EXISTS "Allow all operations" ON storage.objects;
          CREATE POLICY "Allow all operations" ON storage.objects
          FOR ALL USING (true) WITH CHECK (true);
        `
      });
      
      if (policyError) {
        console.error('❌ Could not create permissive policy:', policyError.message);
        console.log('\n📋 Manual steps required:');
        console.log('   1. Go to Supabase Dashboard → Storage');
        console.log('   2. Click on your documents bucket');
        console.log('   3. Go to Settings tab');
        console.log('   4. Toggle OFF "Row Level Security"');
        console.log('   5. Click Save');
        return false;
      } else {
        console.log('✅ Created permissive RLS policy');
      }
    } else {
      console.log('✅ Disabled RLS on storage.objects');
    }
    
    console.log('\n🎉 RLS configuration updated!');
    console.log('   You can now restart your development server and test uploads.');
    
    return true;
    
  } catch (error) {
    console.error('❌ Failed to disable RLS:', error.message);
    console.log('\n📋 Manual steps required:');
    console.log('   1. Go to Supabase Dashboard → Storage');
    console.log('   2. Click on your documents bucket');
    console.log('   3. Go to Settings tab');
    console.log('   4. Toggle OFF "Row Level Security"');
    console.log('   5. Click Save');
    return false;
  }
}

// Run the script
disableRLS().then(success => {
  if (!success) {
    console.log('\n💡 Quick Alternative:');
    console.log('   You can also run the SQL manually in Supabase SQL Editor:');
    console.log('   ALTER TABLE storage.objects DISABLE ROW LEVEL SECURITY;');
  }
  process.exit(success ? 0 : 1);
});
