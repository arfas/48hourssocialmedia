import {
  User,
  getUnmatchedUsers,
  createMatch,
  updateUser,
} from './supabase';

export async function findMatch(currentUser: User): Promise<string | null> {
  console.log('🔍 Starting match search for user:', currentUser.id);
  
  const unmatchedUsers = await getUnmatchedUsers(currentUser.id);
  console.log('📊 Found unmatched users:', unmatchedUsers?.length || 0);

  if (!unmatchedUsers || unmatchedUsers.length === 0) {
    console.warn('⚠️ No unmatched users found. Need at least 2 users to match.');
    return null;
  }

  const scoredUsers = unmatchedUsers.map((user) => {
    const sharedInterests = currentUser.interests.filter((interest) =>
      user.interests.includes(interest)
    ).length;

    const compatibleStyles = areStylesCompatible(
      currentUser.communication_style,
      user.communication_style
    );

    const compatibleVibes = areVibesCompatible(
      currentUser.vibe,
      user.vibe
    );

    const score =
      sharedInterests * 3 +
      (compatibleStyles ? 2 : 0) +
      (compatibleVibes ? 1 : 0);

    console.log(`  User: ${user.users_name} (${user.id}) - Score: ${score}`);

    return { user, score };
  });

  scoredUsers.sort((a, b) => b.score - a.score);

  const bestMatch = scoredUsers[0];
  console.log('✨ Best match:', bestMatch?.user.users_name, '- Score:', bestMatch?.score);
  
  if (bestMatch && bestMatch.score > 0) {
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 48);

    console.log('💾 Creating match...');
    const match = await createMatch({
      user1_id: currentUser.id,
      user2_id: bestMatch.user.id,
      expires_at: expiresAt,
    });

    if (!match) {
      console.error('❌ Failed to create match');
      return null;
    }

    console.log('✅ Match created:', match.id);
    
    console.log('Updating user matched status...');
    await updateUser(currentUser.id, { is_matched: true });
    await updateUser(bestMatch.user.id, { is_matched: true });

    return match.id;
  }

  console.warn('⚠️ No compatible match found (score must be > 0)');
  return null;
}

function areStylesCompatible(style1: string, style2: string): boolean {
  const compatibilityMap: Record<string, string[]> = {
    direct: ['direct', 'energetic'],
    thoughtful: ['thoughtful', 'calm'],
    energetic: ['energetic', 'direct'],
    calm: ['calm', 'thoughtful'],
  };

  return compatibilityMap[style1]?.includes(style2) || false;
}

function areVibesCompatible(vibe1: string, vibe2: string): boolean {
  const compatibilityMap: Record<string, string[]> = {
    deep: ['deep', 'supportive'],
    lighthearted: ['lighthearted', 'creative'],
    supportive: ['supportive', 'deep'],
    creative: ['creative', 'lighthearted'],
  };

  return compatibilityMap[vibe1]?.includes(vibe2) || false;
}
