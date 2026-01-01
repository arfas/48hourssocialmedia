import {
  User,
  getUnmatchedUsers,
  createMatch,
  updateUser,
  getMatchBetweenUsers,
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

  scoredUsers.forEach(({ user, score }) => {
    console.log(`[MATCH DEBUG] Candidate: ${user.users_name} (${user.id}), Score: ${score}`);
  });

  scoredUsers.sort((a, b) => b.score - a.score);

  const bestMatch = scoredUsers[0];
  console.log('✨ Best match:', bestMatch?.user.users_name, '- Score:', bestMatch?.score);

  // Allow match even if score is 0 (fallback)
  if (bestMatch) {
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 48);

    // Check for existing active match between these two users (both directions)
    const existingMatch = await getMatchBetweenUsers(currentUser.id, bestMatch.user.id);
    if (existingMatch) {
      console.log('🔗 Existing match found between users:', existingMatch.id);
      // Make sure both are marked as matched
      await updateUser(currentUser.id, { is_matched: true });
      await updateUser(bestMatch.user.id, { is_matched: true });
      return existingMatch.id;
    }

    // Double-check that both users are still unmatched before creating match
    const latestUnmatched = await getUnmatchedUsers(currentUser.id);
    const stillUnmatched = latestUnmatched.find(u => u.id === bestMatch.user.id);
    if (!stillUnmatched) {
      console.warn('Best match is no longer unmatched. Aborting match creation.');
      return null;
    }

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
    // Only now set is_matched: true for both users
    await updateUser(currentUser.id, { is_matched: true });
    await updateUser(bestMatch.user.id, { is_matched: true });

    return match.id;
  }

  console.warn('⚠️ No compatible match found (should not happen)');
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
