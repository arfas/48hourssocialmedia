import { useState, useEffect, useRef } from 'react';
import { Send } from 'lucide-react';
import {
  Message,
  User,
  Match,
  getMessages,
  sendMessage,
  onMatchMessages,
} from '../lib/supabase';
import CountdownTimer from './CountdownTimer';

interface ChatProps {
  currentUser: User;
  match: Match;
  partner: User;
}

export default function Chat({ currentUser, match, partner }: ChatProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [isExpired, setIsExpired] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const now = new Date().getTime();
    const expiry = new Date(match.expires_at).getTime();
    setIsExpired(expiry <= now);

    loadMessages();

    const unsubscribe = onMatchMessages(match.id, (newMsg) => {
      setMessages((prev) => [...prev, newMsg]);
    });

    return () => {
      unsubscribe();
    };
  }, [match.id, match.expires_at]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const loadMessages = async () => {
    const data = await getMessages(match.id);
    if (data) {
      setMessages(data);
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!newMessage.trim() || isExpired) return;

    const success = await sendMessage({
      match_id: match.id,
      sender_id: currentUser.id,
      content: newMessage.trim(),
    });

    if (success) {
      setNewMessage('');
      // Force reload messages after sending
      loadMessages();
    }
  };

  const handleExpire = () => {
    setIsExpired(true);
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <div className="bg-white border-b border-gray-200 px-4 py-4 flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-gray-900">{partner.users_name}</h2>
          <p className="text-sm text-gray-600">
            {partner.interests.slice(0, 3).join(', ')}
          </p>
        </div>
        <CountdownTimer expiresAt={match.expires_at} onExpire={handleExpire} />
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-6 space-y-4">
        {messages.length === 0 ? (
          <div className="text-center text-gray-500 mt-8">
            <p className="text-lg font-medium mb-2">Start the conversation!</p>
            <p className="text-sm">You have 48 hours to get to know each other.</p>
          </div>
        ) : (
          messages.map((message) => {
            const isCurrentUser = message.sender_id === currentUser.id;
            return (
              <div
                key={message.id}
                className={`flex ${isCurrentUser ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-xs md:max-w-md px-4 py-3 rounded-2xl ${
                    isCurrentUser
                      ? 'bg-blue-600 text-white'
                      : 'bg-white text-gray-900 border border-gray-200'
                  }`}
                >
                  <p className="break-words">{message.content}</p>
                  <p
                    className={`text-xs mt-1 ${
                      isCurrentUser ? 'text-blue-100' : 'text-gray-500'
                    }`}
                  >
                    {new Date(message.created).toLocaleTimeString([], {
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </p>
                </div>
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {isExpired && (
        <div className="bg-red-50 border-t border-red-200 px-4 py-3 text-center">
          <p className="text-red-700 font-medium">
            Your 48-hour friendship has ended. This chat is now read-only.
          </p>
        </div>
      )}

      <div className="bg-white border-t border-gray-200 px-4 py-4">
        <form onSubmit={handleSendMessage} className="flex gap-2">
          <input
            type="text"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder={isExpired ? 'Chat has ended' : 'Type a message...'}
            disabled={isExpired}
            className="flex-1 px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-blue-600 focus:outline-none transition-colors disabled:bg-gray-100 disabled:cursor-not-allowed"
          />
          <button
            type="submit"
            disabled={!newMessage.trim() || isExpired}
            className={`px-6 py-3 rounded-lg font-medium transition-colors flex items-center gap-2 ${
              !newMessage.trim() || isExpired
                ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                : 'bg-blue-600 text-white hover:bg-blue-700'
            }`}
          >
            <Send className="w-5 h-5" />
            <span className="hidden sm:inline">Send</span>
          </button>
        </form>
      </div>
    </div>
  );
}
