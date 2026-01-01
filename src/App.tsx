import { useState, useEffect, useRef } from 'react';
import {
  getUser,
  createUser,
  getMatch,
  getActiveMatchByUser,
  resetExpiredMatches,
  User,
  Match,
} from './lib/supabase';
import { findMatch } from './lib/matching';
import Onboarding from './components/Onboarding';
import Matching from './components/Matching';
import Chat from './components/Chat';

type AppState = 'onboarding' | 'matching' | 'chat';

function App() {
  // Default to onboarding, but will switch to chat if session exists
  const [state, setState] = useState<AppState>('onboarding');
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [match, setMatch] = useState<Match | null>(null);
  const [partner, setPartner] = useState<User | null>(null);
  const hasTriedMatchingRef = useRef(false);

  useEffect(() => {
    // Clean up expired matches on app startup
    resetExpiredMatches().then(() => {
      checkExistingSession();
    });
  }, []);

  // Poll for active match while in 'matching' state
  useEffect(() => {
    let pollInterval: NodeJS.Timeout | null = null;
    
    if (state === 'matching' && currentUser) {
      // Reset the flag when entering matching state
      hasTriedMatchingRef.current = false;
      
      // Immediately try to find a match when entering matching state
      if (!hasTriedMatchingRef.current) {
        hasTriedMatchingRef.current = true;
        console.log('[MATCH] Starting findMatch for user:', currentUser.id);
        (async () => {
          // First check if we already have a match
          const existingMatch = await getActiveMatchByUser(currentUser.id);
          if (existingMatch) {
            console.log('[MATCH] Found existing match:', existingMatch.id);
            const partnerId = existingMatch.user1_id === currentUser.id
              ? existingMatch.user2_id
              : existingMatch.user1_id;
            const partnerData = await getUser(partnerId);
            if (partnerData) {
              setMatch(existingMatch);
              setPartner(partnerData);
              setState('chat');
              return;
            }
          }
          
          // No existing match, try to create one
          await resetExpiredMatches();
          const matchId = await findMatch(currentUser);
          if (matchId) {
            const matchData = await getMatch(matchId);
            if (matchData) {
              const partnerId = matchData.user1_id === currentUser.id
                ? matchData.user2_id
                : matchData.user1_id;
              const partnerData = await getUser(partnerId);
              if (partnerData) {
                setMatch(matchData);
                setPartner(partnerData);
                setState('chat');
                return;
              }
            }
          }
        })();
      }
      
      pollInterval = setInterval(async () => {
        console.log('[MATCH POLL] Polling for active match for user:', currentUser.id);
        const activeMatch = await getActiveMatchByUser(currentUser.id);
        console.log('[MATCH POLL] getActiveMatchByUser result:', activeMatch);
        if (activeMatch) {
          const partnerId = activeMatch.user1_id === currentUser.id
            ? activeMatch.user2_id
            : activeMatch.user1_id;
          const partnerData = await getUser(partnerId);
          if (partnerData) {
            setMatch(activeMatch);
            setPartner(partnerData);
            setState('chat');
            if (pollInterval) clearInterval(pollInterval);
          }
        }
      }, 2000);
    }
    return () => {
      if (pollInterval) clearInterval(pollInterval);
    };
  }, [state, currentUser]);

  const checkExistingSession = async () => {
    const userId = localStorage.getItem('userId');
    if (!userId) return;

    const user = await getUser(userId);

    if (user) {
      setCurrentUser(user);

      const activeMatch = await getActiveMatchByUser(userId);

      if (activeMatch) {
        const partnerId = activeMatch.user1_id === userId
          ? activeMatch.user2_id
          : activeMatch.user1_id;

        const partnerData = await getUser(partnerId);

        if (partnerData) {
          setMatch(activeMatch);
          setPartner(partnerData);
          setState('chat');
        }
      } else {
        // User exists but no active match - go to matching state
        setState('matching');
      }
    }
  };

  const handleOnboardingComplete = async (data: {
    users_name: string;
    vibe: string;
    interests: string[];
    communicationStyle: string;
  }) => {
    // Prevent duplicate user creation: check if userId already exists
    const existingUserId = localStorage.getItem('userId');
    let user;
    if (existingUserId) {
      user = await getUser(existingUserId);
      if (!user) {
        localStorage.removeItem('userId');
      }
    }
    if (!user) {
      // No existing user, create new
      console.log('Creating user with data:', data);
      user = await createUser({
        users_name: data.users_name,
        vibe: data.vibe,
        interests: data.interests,
        communication_style: data.communicationStyle,
      });
      if (!user) {
        console.error('Error creating user - user is null');
        alert('Failed to create user. Check console for details.');
        return;
      }
      localStorage.setItem('userId', user.id);
    }
    setCurrentUser(user);
    setState('matching');

    // Always check for an active match before trying to find a new one
    const activeMatch = await getActiveMatchByUser(user.id);
    if (activeMatch) {
      const partnerId = activeMatch.user1_id === user.id
        ? activeMatch.user2_id
        : activeMatch.user1_id;
      const partnerData = await getUser(partnerId);
      if (partnerData) {
        setMatch(activeMatch);
        setPartner(partnerData);
        setState('chat');
        return;
      }
    }

    // No active match, reset any expired matches first, then try to find one
    setTimeout(async () => {
      await resetExpiredMatches();
      const matchId = await findMatch(user);
      if (matchId) {
        const matchData = await getMatch(matchId);
        if (matchData) {
          const partnerId = matchData.user1_id === user.id
            ? matchData.user2_id
            : matchData.user1_id;
          const partnerData = await getUser(partnerId);
          if (partnerData) {
            setMatch(matchData);
            setPartner(partnerData);
            setState('chat');
            return;
          }
        }
      }
      // No match found, retry
      setTimeout(() => handleOnboardingComplete(data), 3000);
    }, 2000);
  };

  if (state === 'onboarding') {
    return <Onboarding onComplete={handleOnboardingComplete} />;
  }

  if (state === 'matching') {
    return <Matching />;
  }

  if (state === 'chat' && currentUser && match && partner) {
    return <Chat currentUser={currentUser} match={match} partner={partner} />;
  }

  return null;
}

export default App;
