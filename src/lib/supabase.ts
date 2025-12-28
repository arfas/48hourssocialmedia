// PocketBase Configuration
// PocketBase is a standalone server - no NPM package needed!
// Just use the REST API directly

const pbUrl = import.meta.env.VITE_POCKETBASE_URL || 'http://localhost:8090';

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
    const filter = encodeURIComponent(`is_active=true && (user1_id="${userId}" || user2_id="${userId}")`);
    const response = await pbApi.request(
      'GET',
      `/matches/records?filter=${filter}&limit=1`
    );

    if (response.items && response.items.length > 0) {
      return response.items[0] as Match;
    }
    return null;
  } catch (error) {
    console.error('❌ Error getting active match:', error);
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
