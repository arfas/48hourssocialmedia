import { Loader2 } from 'lucide-react';

export default function Matching() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full text-center">
        <div className="mb-6 flex justify-center">
          <Loader2 className="w-16 h-16 text-blue-600 animate-spin" />
        </div>
        <h2 className="text-2xl font-bold text-gray-900 mb-3">Finding your friend...</h2>
        <p className="text-gray-600">
          We're matching you with someone who shares your interests and vibe.
          This might take a moment.
        </p>
      </div>
    </div>
  );
}
