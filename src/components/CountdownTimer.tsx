import { useState, useEffect } from 'react';
import { Clock } from 'lucide-react';

interface CountdownTimerProps {
  expiresAt: string | Date;
  onExpire: () => void;
}

export default function CountdownTimer({ expiresAt, onExpire }: CountdownTimerProps) {
  const [timeRemaining, setTimeRemaining] = useState('');
  const [isExpired, setIsExpired] = useState(false);

  useEffect(() => {
    const updateTimer = () => {
      const now = new Date().getTime();
      const expiry = new Date(expiresAt).getTime();
      const diff = expiry - now;

      if (diff <= 0) {
        setTimeRemaining('0h 0m 0s');
        setIsExpired(true);
        onExpire();
        return;
      }

      const hours = Math.floor(diff / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diff % (1000 * 60)) / 1000);

      setTimeRemaining(`${hours}h ${minutes}m ${seconds}s`);
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);

    return () => clearInterval(interval);
  }, [expiresAt, onExpire]);

  return (
    <div
      className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium ${
        isExpired
          ? 'bg-red-100 text-red-700'
          : 'bg-blue-100 text-blue-700'
      }`}
    >
      <Clock className="w-4 h-4" />
      <span>{timeRemaining} remaining</span>
    </div>
  );
}
