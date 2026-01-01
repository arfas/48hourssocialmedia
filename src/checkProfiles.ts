// Script to check all profiles in the database
import { getAllUsers } from './lib/supabase.ts';

(async () => {
  console.log('🔍 Checking all profiles in database...');
  const users = await getAllUsers();
  console.log(`Found ${users.length} profiles:`);
  
  users.forEach((user, index) => {
    console.log(`\n${index + 1}. ${user.users_name} (${user.id})`);
    console.log(`   - Vibe: ${user.vibe}`);
    console.log(`   - Communication: ${user.communication_style}`);
    console.log(`   - Matched: ${user.is_matched}`);
    console.log(`   - Created: ${user.created}`);
  });
})();
