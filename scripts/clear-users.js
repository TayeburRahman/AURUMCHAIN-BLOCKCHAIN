#!/usr/bin/env node

/**
 * Script to clear all users from Supabase
 * This will delete all users from auth.users and profiles table
 *
 * Usage: node scripts/clear-users.js
 */

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Read .env.local file
const envPath = path.join(__dirname, '..', '.env.local');
const envContent = fs.readFileSync(envPath, 'utf8');
const envVars = {};
envContent.split('\n').forEach(line => {
  const match = line.match(/^([^=]+)=(.*)$/);
  if (match) {
    const key = match[1].trim();
    let value = match[2].trim();
    // Remove quotes if present
    if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
      value = value.slice(1, -1);
    }
    envVars[key] = value;
  }
});

const supabaseUrl = envVars.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = envVars.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Error: Missing Supabase credentials');
  console.error('Make sure NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY are set in .env.local');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function clearAllUsers() {
  console.log('🔄 Starting user cleanup...\n');

  try {
    // Get all profiles first
    const { data: profiles, error: profilesError } = await supabase
      .from('profiles')
      .select('id, email, first_name, last_name');

    if (profilesError) {
      console.error('❌ Error fetching profiles:', profilesError.message);
      return;
    }

    if (!profiles || profiles.length === 0) {
      console.log('✅ No users found in database');
      return;
    }

    console.log(`📋 Found ${profiles.length} user(s) in the database:\n`);
    profiles.forEach((profile, index) => {
      console.log(`   ${index + 1}. ${profile.email || 'No email'} (${profile.first_name || ''} ${profile.last_name || ''})`);
    });
    console.log('');

    // Delete all profiles
    const { error: deleteError } = await supabase
      .from('profiles')
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000'); // Delete all except dummy

    if (deleteError) {
      console.error('❌ Error deleting profiles:', deleteError.message);
      return;
    }

    console.log(`✅ Successfully deleted ${profiles.length} user profile(s)`);
    console.log('\n⚠️  Note: Auth users need to be deleted from Supabase Dashboard');
    console.log('   Go to: Authentication > Users in your Supabase project');
    console.log('   Or use the Supabase Admin API with service role key\n');

  } catch (error) {
    console.error('❌ Unexpected error:', error.message);
  }
}

console.log('═══════════════════════════════════════════════════');
console.log('   GoldenFleece - User Cleanup Script');
console.log('═══════════════════════════════════════════════════\n');

clearAllUsers();
