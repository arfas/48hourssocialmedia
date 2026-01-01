// Script to add a test user with is_matched=false
import { createUser } from './lib/supabase.ts';

(async () => {
  const user = await createUser({
    users_name: 'testuser',
    vibe: 'deep',
    interests: ['Gaming', 'Travel', 'Cooking'],
    communication_style: 'direct',
  });
  console.log('Created test user:', user);
})();
