// Script to check all matches in the database

(async () => {
  console.log('🔍 Checking all matches in database...');
  
  const pbUrl = 'http://localhost:8090';
  
  try {
    const response = await fetch(`${pbUrl}/api/collections/matches/records?perPage=500`);
    const data = await response.json();
    
    console.log(`Found ${data.items?.length || 0} matches:`);
    
    if (data.items && data.items.length > 0) {
      data.items.forEach((match: any, index: number) => {
        console.log(`\n${index + 1}. Match ID: ${match.id}`);
        console.log(`   - User 1: ${match.user1_id}`);
        console.log(`   - User 2: ${match.user2_id}`);
        console.log(`   - Active: ${match.is_active}`);
        console.log(`   - Expires: ${match.expires_at}`);
        console.log(`   - Created: ${match.created}`);
      });
    } else {
      console.log('No matches found.');
    }
  } catch (error) {
    console.error('Error fetching matches:', error);
  }
})();
