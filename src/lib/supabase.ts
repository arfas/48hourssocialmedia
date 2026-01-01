// PocketBase Configuration
// PocketBase is a standalone server - no NPM package needed!
// Just use the REST API directly

// Support both Vite (browser) and Node.js (ts-node) environments
let pbUrl = 'http://localhost:8090';
try {
  // @ts-ignore
  if (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.VITE_POCKETBASE_URL) {
    // Vite/browser
    pbUrl = import.meta.env.VITE_POCKETBASE_URL;
  } else if (typeof process !== 'undefined' && process.env && process.env.VITE_POCKETBASE_URL) {
    // Node.js/ts-node
    pbUrl = process.env.VITE_POCKETBASE_URL;
  }
} catch (e) {
  // fallback to default
}

console.log('🔌 PocketBase Client initialized');
console.log('📍 PocketBase URL:', pbUrl);
console.log('⚠️ Make sure PocketBase server is running at:', pbUrl);

// Helper to make API calls to PocketBase
const pbApi = {
  async request(method: string, path: string, data?: any) {
    const url = `${pbUrl}/api/collections${path}`;
    console.log(`📡 ${method} ${url}`);
    if (data) {
      console.log('📤 Sending:', JSON.stringify(data, null, 2));
    }
    
    const options: RequestInit = {
      method,
      headers: {
        'Content-Type': 'application/json',
      },
    };

    if (data) {
      options.body = JSON.stringify(data);
    }

    try {
      const response = await fetch(url, options);
      const responseData = await response.json();
      
      if (!response.ok) {
        console.error('❌ API Error Response:', {
          status: response.status,
          statusText: response.statusText,
          fullData: responseData,
        });
        console.error('🔴 Full Response JSON:', JSON.stringify(responseData, null, 2));
        
        // Log the request that failed
        if (data) {
          console.error('📤 Request that failed:', JSON.stringify(data, null, 2));
        }
        
        // Detailed error message from validation data
        if (responseData.data && typeof responseData.data === 'object' && Object.keys(responseData.data).length > 0) {
          const fieldErrors = Object.entries(responseData.data)
            .map(([field, error]: any) => {
              if (typeof error === 'object' && error.message) {
                return `${field}: ${error.message}`;
              }
              return `${field}: ${String(error)}`;
            })
            .join(', ');
          console.error('🔴 Field Validation Errors:', fieldErrors);
          throw new Error(`Validation Error: ${fieldErrors}`);
        }
        
        // Check for general error message
        if (responseData.message) {
          console.error('🔴 Error Message:', responseData.message);
          console.error('💡 This usually means: collection may not exist, or fields don\'t match schema');
          throw new Error(responseData.message);
        }
        
        console.error('🔴 Unknown error format:', JSON.stringify(responseData));
        throw new Error(`API Error: ${response.statusText}`);
      }

      console.log('✅ Success:', responseData);
      return responseData;
    } catch (error) {
      if (error instanceof Error) {
        console.error('🔴 Request Error:', error.message);
      }
      throw error;
    }
  },
};

export interface User {
  id: string;
  users_name: string;
  vibe: string;
  interests: string[];
  communication_style: string;
  is_matched: boolean;
  created: string;
}

export interface Match {
  id: string;
  user1_id: string;
  user2_id: string;
  created: string;
  expires_at: string;
  is_active: boolean;
}

export interface Message {
  id: string;
  match_id: string;
  sender_id: string;
  content: string;
  created: string;
}

// User operations
export const createUser = async (data: {
  users_name: string;
  vibe: string;
  interests: string[];
  communication_style: string;
}): Promise<User | null> => {
  try {
    console.log('Creating user with data:', data);
    
    const user = await pbApi.request('POST', '/profiles/records', {
      users_name: data.users_name,
      vibe: data.vibe,
      interests: data.interests,
      communication_style: data.communication_style,
      is_matched: false,
    });

    console.log('✅ User created:', user.id);
    return user as User;
  } catch (error) {
    console.error('❌ Error creating user:', error);
    if (error instanceof Error) {
      console.error('Error message:', error.message);
    }
    return null;
  }
};

export const getUser = async (userId: string): Promise<User | null> => {
  try {
    const user = await pbApi.request('GET', `/profiles/records/${userId}`);
    console.log('✅ User retrieved:', user.id);
    return user as User;
  } catch (error) {
    console.error('❌ Error getting user:', error);
    return null;
  }
};

export const getAllUsers = async (): Promise<User[]> => {
  try {
    const response = await pbApi.request('GET', '/profiles/records?perPage=500');
    return response.items as User[];
  } catch (error) {
    console.error('❌ Error getting users:', error);
    return [];
  }
};

export const updateUser = async (userId: string, data: Partial<User>): Promise<void> => {
  try {
    await pbApi.request('PATCH', `/profiles/records/${userId}`, data);
    console.log('✅ User updated:', userId);
  } catch (error) {
    console.error('❌ Error updating user:', error);
  }
};

// Match operations
export const createMatch = async (data: {
  user1_id: string;
  user2_id: string;
  expires_at: Date;
}): Promise<Match | null> => {
  try {
    console.log('Creating match...');
    
    const match = await pbApi.request('POST', '/matches/records', {
      user1_id: data.user1_id,
      user2_id: data.user2_id,
      expires_at: data.expires_at.toISOString(),
      is_active: true,
    });

    console.log('✅ Match created:', match.id);
    return match as Match;
  } catch (error) {
    console.error('❌ Error creating match:', error);
    return null;
  }
};

export const getMatch = async (matchId: string): Promise<Match | null> => {
  try {
    const match = await pbApi.request('GET', `/matches/records/${matchId}`);
    console.log('✅ Match retrieved:', match.id);
    return match as Match;
  } catch (error) {
    console.error('❌ Error getting match:', error);
    return null;
  }
};

export const getActiveMatchByUser = async (userId: string): Promise<Match | null> => {
  try {
    console.log('[MATCH DEBUG] Checking for active match for user:', userId);
    // Try user as user1_id (is_active is stored as string in PocketBase)
    const filter1 = encodeURIComponent(`is_active="true" && user1_id="${userId}"`);
    const url1 = `/matches/records?filter=${filter1}&limit=1`;
    console.log('[MATCH DEBUG] getActiveMatchByUser url1:', url1);
    const response1 = await pbApi.request('GET', url1);
    console.log('[MATCH DEBUG] getActiveMatchByUser response1:', response1);
    if (response1.items && response1.items.length > 0) {
      console.log('[MATCH DEBUG] ✅ Found match as user1_id:', response1.items[0]);
      return response1.items[0] as Match;
    }
    // Try user as user2_id
    const filter2 = encodeURIComponent(`is_active="true" && user2_id="${userId}"`);
    const url2 = `/matches/records?filter=${filter2}&limit=1`;
    console.log('[MATCH DEBUG] getActiveMatchByUser url2:', url2);
    const response2 = await pbApi.request('GET', url2);
    console.log('[MATCH DEBUG] getActiveMatchByUser response2:', response2);
    if (response2.items && response2.items.length > 0) {
      console.log('[MATCH DEBUG] ✅ Found match as user2_id:', response2.items[0]);
      return response2.items[0] as Match;
    }
    console.log('[MATCH DEBUG] ❌ No match found for user:', userId);
    return null;
  } catch (error) {
    console.error('❌ Error getting active match:', error);
    return null;
  }
};

// Check if a match exists between two specific users
export const getMatchBetweenUsers = async (user1Id: string, user2Id: string): Promise<Match | null> => {
  try {
    // Check both directions (is_active is stored as string in PocketBase)
    const filter1 = encodeURIComponent(`is_active="true" && user1_id="${user1Id}" && user2_id="${user2Id}"`);
    const response1 = await pbApi.request('GET', `/matches/records?filter=${filter1}&limit=1`);
    if (response1.items && response1.items.length > 0) {
      return response1.items[0] as Match;
    }
    
    const filter2 = encodeURIComponent(`is_active="true" && user1_id="${user2Id}" && user2_id="${user1Id}"`);
    const response2 = await pbApi.request('GET', `/matches/records?filter=${filter2}&limit=1`);
    if (response2.items && response2.items.length > 0) {
      return response2.items[0] as Match;
    }
    
    return null;
  } catch (error) {
    console.error('❌ Error checking match between users:', error);
    return null;
  }
};

export const getUnmatchedUsers = async (exceptUserId: string): Promise<User[]> => {
  try {
    // PocketBase filter syntax: use spaces around operators
    const filter = encodeURIComponent(`is_matched=false && id!="${exceptUserId}"`);
    const response = await pbApi.request(
      'GET',
      `/profiles/records?filter=${filter}&perPage=500`
    );
    console.log('📊 Found unmatched users:', response.items?.length || 0);
    return response.items as User[];
  } catch (error) {
    console.error('❌ Error getting unmatched users:', error);
    return [];
  }
};

// Message operations

// Reset is_matched for users whose matches have expired or are inactive
export const resetExpiredMatches = async (): Promise<void> => {
  try {
    // Get all active matches (is_active is stored as string in PocketBase)
    const now = new Date().toISOString();
    const filter = encodeURIComponent(`is_active="true" && expires_at<"${now}"`);
    const response = await pbApi.request('GET', `/matches/records?filter=${filter}&perPage=500`);
    const expiredMatches = response.items || [];
    for (const match of expiredMatches) {
      // Set match as inactive
      await pbApi.request('PATCH', `/matches/records/${match.id}`, { is_active: false });
      // Set both users as unmatched
      await updateUser(match.user1_id, { is_matched: false });
      await updateUser(match.user2_id, { is_matched: false });
      console.log(`♻️ Reset is_matched for users in expired match ${match.id}`);
    }
  } catch (error) {
    console.error('❌ Error resetting expired matches:', error);
  }
};
export const sendMessage = async (data: {
  match_id: string;
  sender_id: string;
  content: string;
}): Promise<Message | null> => {
  try {
    const message = await pbApi.request('POST', '/messages/records', {
      match_id: data.match_id,
      sender_id: data.sender_id,
      content: data.content,
    });

    console.log('✅ Message sent:', message.id);
    return message as Message;
  } catch (error) {
    console.error('❌ Error sending message:', error);
    return null;
  }
};

export const getMessages = async (matchId: string): Promise<Message[]> => {
  try {
    // Use PocketBase filter syntax: match_id=matchId (no quotes)
    const filter = encodeURIComponent(`match_id="${matchId}"`);
    const url = `/messages/records?filter=${filter}&sort=created&perPage=500`;
    console.log('[PocketBase DEBUG] matchId:', matchId);
    console.log('[PocketBase DEBUG] filter:', `match_id="${matchId}"`);
    console.log('[PocketBase DEBUG] url:', url);
    const response = await pbApi.request('GET', url);
    console.log('✅ Messages retrieved:', response.items?.length || 0, response);
    return (response.items && response.items.length > 0) ? response.items as Message[] : [];
  } catch (error) {
    console.error('❌ Error getting messages:', error);
    return [];
  }
};

export const onMatchMessages = (
  matchId: string,
  callback: (message: Message) => void
): (() => void) => {
  console.log('👂 Listening for messages on match:', matchId);
  const eventSource = new EventSource(`${pbUrl}/api/realtime`);
  eventSource.addEventListener('message', (e) => {
    try {
      const data = JSON.parse(e.data);
      console.log('[Realtime DEBUG] Incoming event:', data);
      if (
        data.action === 'create' &&
        data.collection === 'messages' &&
        data.record.match_id === matchId
      ) {
        callback(data.record as Message);
      }
    } catch (err) {
      console.error('Error parsing realtime message:', err);
    }
  });
  return () => {
    console.log('🔇 Stopped listening for messages');
    eventSource.close();
  };
};
