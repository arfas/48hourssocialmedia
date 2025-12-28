import { useState } from 'react';
import { Check } from 'lucide-react';

interface OnboardingProps {
  onComplete: (data: {
    users_name: string;
    vibe: string;
    interests: string[];
    communicationStyle: string;
  }) => void;
}

const VIBES = [
  { id: 'deep', label: 'Deep', description: 'Meaningful conversations' },
  { id: 'lighthearted', label: 'Lighthearted', description: 'Fun and casual' },
  { id: 'supportive', label: 'Supportive', description: 'Encouraging and caring' },
  { id: 'creative', label: 'Creative', description: 'Artistic and imaginative' },
];

const INTERESTS = [
  'Music', 'Movies', 'Books', 'Gaming', 'Travel',
  'Cooking', 'Sports', 'Art', 'Technology', 'Fitness'
];

const COMMUNICATION_STYLES = [
  { id: 'direct', label: 'Direct', description: 'Straightforward and clear' },
  { id: 'thoughtful', label: 'Thoughtful', description: 'Reflective and considered' },
  { id: 'energetic', label: 'Energetic', description: 'Enthusiastic and lively' },
  { id: 'calm', label: 'Calm', description: 'Peaceful and steady' },
];

export default function Onboarding({ onComplete }: OnboardingProps) {
  const [step, setStep] = useState(0);
  const [name, setName] = useState('');
  const [vibe, setVibe] = useState('');
  const [interests, setInterests] = useState<string[]>([]);
  const [communicationStyle, setCommunicationStyle] = useState('');

  const toggleInterest = (interest: string) => {
    if (interests.includes(interest)) {
      setInterests(interests.filter((i) => i !== interest));
    } else if (interests.length < 5) {
      setInterests([...interests, interest]);
    }
  };

  const canProceed = () => {
    if (step === 0) return name.trim().length > 0;
    if (step === 1) return vibe !== '';
    if (step === 2) return interests.length >= 3;
    if (step === 3) return communicationStyle !== '';
    return false;
  };

  const handleNext = () => {
    if (step < 3) {
      setStep(step + 1);
    } else {
      onComplete({ users_name: name, vibe, interests, communicationStyle });
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl p-8 max-w-2xl w-full">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">48-Hour Friendships</h1>
          <p className="text-gray-600">Connect with someone new for 48 hours</p>
        </div>

        <div className="mb-8 flex gap-2">
          {[0, 1, 2, 3].map((i) => (
            <div
              key={i}
              className={`h-2 flex-1 rounded-full transition-colors ${
                i <= step ? 'bg-blue-600' : 'bg-gray-200'
              }`}
            />
          ))}
        </div>

        {step === 0 && (
          <div className="space-y-6">
            <div>
              <label className="block text-lg font-semibold text-gray-900 mb-4">
                What's your name?
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Enter your name"
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-blue-600 focus:outline-none transition-colors"
                autoFocus
              />
            </div>
          </div>
        )}

        {step === 1 && (
          <div className="space-y-6">
            <div>
              <label className="block text-lg font-semibold text-gray-900 mb-4">
                What conversation vibe are you looking for?
              </label>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {VIBES.map((v) => (
                  <button
                    key={v.id}
                    onClick={() => setVibe(v.id)}
                    className={`p-4 border-2 rounded-lg text-left transition-all ${
                      vibe === v.id
                        ? 'border-blue-600 bg-blue-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <div className="font-semibold text-gray-900">{v.label}</div>
                    <div className="text-sm text-gray-600">{v.description}</div>
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-6">
            <div>
              <label className="block text-lg font-semibold text-gray-900 mb-2">
                Pick 3-5 interests
              </label>
              <p className="text-sm text-gray-600 mb-4">
                {interests.length}/5 selected (minimum 3)
              </p>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {INTERESTS.map((interest) => (
                  <button
                    key={interest}
                    onClick={() => toggleInterest(interest)}
                    className={`p-3 border-2 rounded-lg font-medium transition-all flex items-center justify-between ${
                      interests.includes(interest)
                        ? 'border-blue-600 bg-blue-50 text-blue-900'
                        : 'border-gray-200 text-gray-700 hover:border-gray-300'
                    }`}
                  >
                    {interest}
                    {interests.includes(interest) && (
                      <Check className="w-4 h-4" />
                    )}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="space-y-6">
            <div>
              <label className="block text-lg font-semibold text-gray-900 mb-4">
                What's your communication style?
              </label>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {COMMUNICATION_STYLES.map((style) => (
                  <button
                    key={style.id}
                    onClick={() => setCommunicationStyle(style.id)}
                    className={`p-4 border-2 rounded-lg text-left transition-all ${
                      communicationStyle === style.id
                        ? 'border-blue-600 bg-blue-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <div className="font-semibold text-gray-900">{style.label}</div>
                    <div className="text-sm text-gray-600">{style.description}</div>
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        <div className="mt-8 flex gap-3">
          {step > 0 && (
            <button
              onClick={() => setStep(step - 1)}
              className="px-6 py-3 border-2 border-gray-200 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition-colors"
            >
              Back
            </button>
          )}
          <button
            onClick={handleNext}
            disabled={!canProceed()}
            className={`flex-1 px-6 py-3 rounded-lg font-medium transition-colors ${
              canProceed()
                ? 'bg-blue-600 text-white hover:bg-blue-700'
                : 'bg-gray-200 text-gray-400 cursor-not-allowed'
            }`}
          >
            {step === 3 ? 'Find a Friend' : 'Next'}
          </button>
        </div>
      </div>
    </div>
  );
}
