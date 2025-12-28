import { useState, useEffect } from 'react';
import {
  getUser,
  createUser,
  getMatch,
  getActiveMatchByUser,
  User,
  Match,
} from './lib/supabase';
import { findMatch } from './lib/matching';
import Onboarding from './components/Onboarding';
import Matching from './components/Matching';
import Chat from './components/Chat';

type AppState = 'onboarding' | 'matching' | 'chat';

function App() {
  const [state, setState] = useState<AppState>('onboarding');
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [match, setMatch] = useState<Match | null>(null);
  const [partner, setPartner] = useState<User | null>(null);

  useEffect(() => {
    checkExistingSession();
  }, []);

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
      }
    }
  };

  const handleOnboardingComplete = async (data: {
    users_name: string;
    vibe: string;
    interests: string[];
    communicationStyle: string;
  }) => {
    console.log('Creating user with data:', data);
    
    const user = await createUser({
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

    console.log('User created successfully:', user);
    setCurrentUser(user);
    localStorage.setItem('userId', user.id);
    setState('matching');

    console.log('Finding match for user:', user.id);
    const matchId = await findMatch(user);

    if (matchId) {
      console.log('Match found with ID:', matchId);
      const matchData = await getMatch(matchId);

      if (matchData) {
        console.log('Match data retrieved:', matchData);
        const partnerId = matchData.user1_id === user.id
          ? matchData.user2_id
          : matchData.user1_id;

        console.log('Getting partner data for:', partnerId);
        const partnerData = await getUser(partnerId);

        if (partnerData) {
          console.log('Partner data retrieved:', partnerData);
          setMatch(matchData);
          setPartner(partnerData);
          setState('chat');
        } else {
          console.error('❌ Failed to get partner data');
        }
      } else {
        console.error('❌ Failed to get match data');
      }
    } else {
      console.log('No match found, retrying in 3 seconds...');
      setTimeout(() => handleOnboardingComplete(data), 3000);
    }
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
