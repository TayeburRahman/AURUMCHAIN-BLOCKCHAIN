import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!; // Using service role to bypass RLS

async function main() {
    const supabase = createClient(supabaseUrl, supabaseKey);
    
    const { data, error } = await supabase
        .from('projects')
        .select('*')
        .eq('blockchain_project_id', 107)
        .single();
    
    if (error) {
        console.error("Database error:", error.message);
    } else {
        console.log("Database Project Data:");
        console.log(` - ID: ${data.id}`);
        console.log(` - Blockchain ID: ${data.blockchain_id}`);
        console.log(` - Name: ${data.title || data.name}`);
        console.log(` - Status: ${data.status}`);
        console.log(` - Is Active: ${data.is_active}`);
    }
}

main();
