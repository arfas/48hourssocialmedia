// Test script to check if we can find the match for user 14ekd4k1vcmb8bj
const pbUrl = 'http://localhost:8090';

(async () => {
  const userId = '14ekd4k1vcmb8bj';
  
  console.log('Testing match queries for user:', userId);
  
  // Test user2_id query
  const filter2 = encodeURIComponent(`is_active=true && user2_id="${userId}"`);
  const url2 = `${pbUrl}/api/collections/matches/records?filter=${filter2}&limit=1`;
  
  console.log('\n🔍 Testing user2_id query:');
  console.log('URL:', url2);
  console.log('Decoded filter:', `is_active=true && user2_id="${userId}"`);
  
  const response2 = await fetch(url2);
  const data2 = await response2.json();
  
  console.log('Response:', JSON.stringify(data2, null, 2));
  
  // Also test without filter to see all matches
  console.log('\n🔍 Getting ALL matches:');
  const allUrl = `${pbUrl}/api/collections/matches/records?perPage=500`;
  const allResponse = await fetch(allUrl);
  const allData = await allResponse.json();
  
  console.log('All matches:', JSON.stringify(allData, null, 2));
})();
