#!/usr/bin/env node

/**
 * Supabase Setup Script
 * This script helps verify and set up Supabase configuration
 */

const { createClient } = require('@supabase/supabase-js');

async function checkSupabaseConfig() {
  console.log('🔍 Checking Supabase configuration...\n');
  
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  
  if (!url || !anonKey) {
    console.error('❌ Missing Supabase environment variables:');
    console.error('   NEXT_PUBLIC_SUPABASE_URL:', url ? '✅ Set' : '❌ Missing');
    console.error('   NEXT_PUBLIC_SUPABASE_ANON_KEY:', anonKey ? '✅ Set' : '❌ Missing');
    return false;
  }
  
  console.log('✅ Environment variables found');
  console.log('   URL:', url);
  console.log('   Key:', anonKey.substring(0, 20) + '...');
  
  try {
    const supabase = createClient(url, anonKey);
    
    // Test database connection
    console.log('\n🔍 Testing database connection...');
    const { data: tables, error: tablesError } = await supabase
      .from('information_schema.tables')
      .select('table_name')
      .eq('table_schema', 'public');
    
    if (tablesError) {
      console.error('❌ Database connection failed:', tablesError.message);
      return false;
    }
    
    console.log('✅ Database connected successfully');
    
    // Check for required tables
    const tableNames = tables.map(t => t.table_name);
    const requiredTables = ['documents', 'extractions', 'proofs'];
    const missingTables = requiredTables.filter(table => !tableNames.includes(table));
    
    if (missingTables.length > 0) {
      console.error('❌ Missing required tables:', missingTables.join(', '));
      console.log('\n📋 Please run the SQL schema in your Supabase SQL Editor:');
      console.log('   1. Go to Supabase Dashboard → SQL Editor');
      console.log('   2. Copy the contents of database/schema.sql');
      console.log('   3. Paste and run the SQL');
      return false;
    }
    
    console.log('✅ All required tables found');
    
    // Test storage connection
    console.log('\n🔍 Testing storage connection...');
    const { data: buckets, error: bucketsError } = await supabase.storage.listBuckets();
    
    if (bucketsError) {
      console.error('❌ Storage connection failed:', bucketsError.message);
      return false;
    }
    
    const bucketNames = buckets.map(b => b.name);
    if (!bucketNames.includes('documents')) {
      console.error('❌ Missing storage bucket: documents');
      console.log('\n📋 Please create the storage bucket:');
      console.log('   1. Go to Supabase Dashboard → Storage');
      console.log('   2. Click "New bucket"');
      console.log('   3. Name: documents');
      console.log('   4. Set to Public');
      console.log('   5. Click Create bucket');
      return false;
    }
    
    console.log('✅ Storage bucket found');
    
    console.log('\n🎉 Supabase configuration is complete!');
    console.log('   You can now restart your development server and test uploads.');
    
    return true;
    
  } catch (error) {
    console.error('❌ Configuration check failed:', error.message);
    return false;
  }
}

// Run the check
checkSupabaseConfig().then(success => {
  process.exit(success ? 0 : 1);
});
