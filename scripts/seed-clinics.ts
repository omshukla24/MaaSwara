import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import * as path from 'path';
import * as fs from 'fs';

// Load env vars from .env.local
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_KEY;

if (!supabaseUrl || !serviceKey) {
  console.error('❌ Missing Supabase URL or Service Key in .env.local');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, serviceKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

async function main() {
  console.log('🌱 Starting Supabase clinic seed...');

  const seedFilePath = path.resolve(process.cwd(), 'seed/partner-clinics.json');
  const clinicsData = JSON.parse(fs.readFileSync(seedFilePath, 'utf-8'));

  console.log(`Found ${clinicsData.length} clinics to insert.`);

  // Insert or Upsert clinics
  const { data, error } = await supabase
    .from('partner_clinics')
    .upsert(clinicsData, { onConflict: 'id' });

  if (error) {
    console.error('❌ Error seeding clinics:', error);
    process.exit(1);
  }

  console.log('✅ Successfully seeded partner clinics into Supabase!');
}

main();
