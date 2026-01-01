// Script to reset all users to is_matched=false for testing
import { getAllUsers, updateUser } from './lib/supabase.ts';

(async () => {
  console.log('🔄 Resetting all users to is_matched=false...');
  const users = await getAllUsers();
  console.log(`Found ${users.length} users`);
  
  for (const user of users) {
    await updateUser(user.id, { is_matched: false });
    console.log(`✅ Reset user: ${user.users_name} (${user.id})`);
  }
  
  console.log('✅ All users reset!');
})();
