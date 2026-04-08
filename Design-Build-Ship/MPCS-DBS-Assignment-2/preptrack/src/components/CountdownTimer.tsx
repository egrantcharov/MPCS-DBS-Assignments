'use client';

import { useState, useEffect, useCallback } from 'react';
import { Play, Pause, RotateCcw } from 'lucide-react';
import { cn } from '@/lib/utils';

interface CountdownTimerProps {
  initialMinutes?: number;
}

export default function CountdownTimer({ initialMinutes = 5 }: CountdownTimerProps) {
  const totalSeconds = initialMinutes * 60;
  const [timeLeft, setTimeLeft] = useState(totalSeconds);
  const [isRunning, setIsRunning] = useState(false);

  useEffect(() => {
    if (!isRunning || timeLeft <= 0) return;

    const interval = setInterval(() => {
      setTimeLeft((t) => {
        if (t <= 1) {
          setIsRunning(false);
          return 0;
        }
        return t - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [isRunning, timeLeft]);

  const reset = useCallback(() => {
    setIsRunning(false);
    setTimeLeft(totalSeconds);
  }, [totalSeconds]);

  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;
  const progress = timeLeft / totalSeconds;

  const timerColor =
    timeLeft <= 30
      ? 'text-red-600'
      : timeLeft <= 60
        ? 'text-amber-600'
        : 'text-indigo-600';

  return (
    <div className="card-elevated p-5 text-center">
      <p className="text-xs text-gray-500 mb-3 uppercase tracking-wider">Timer</p>

      {/* Progress bar */}
      <div className="w-full h-1.5 bg-gray-100 rounded-full mb-4 overflow-hidden">
        <div
          className={cn(
            'h-full rounded-full transition-all duration-1000',
            timeLeft <= 30
              ? 'bg-red-500'
              : timeLeft <= 60
                ? 'bg-amber-500'
                : 'bg-indigo-500'
          )}
          style={{ width: `${progress * 100}%` }}
        />
      </div>

      <p className={cn('text-4xl font-mono font-bold mb-4 transition-colors', timerColor)}>
        {String(minutes).padStart(2, '0')}:{String(seconds).padStart(2, '0')}
      </p>

      <div className="flex items-center justify-center gap-3">
        <button
          onClick={() => setIsRunning(!isRunning)}
          className={cn(
            'flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all',
            isRunning
              ? 'bg-amber-500 text-white hover:bg-amber-600'
              : 'bg-indigo-600 text-white hover:bg-indigo-700'
          )}
        >
          {isRunning ? <Pause size={14} /> : <Play size={14} />}
          {isRunning ? 'Pause' : 'Start'}
        </button>
        <button
          onClick={reset}
          className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium bg-gray-100 text-gray-600 hover:bg-gray-200 transition-all"
        >
          <RotateCcw size={14} />
          Reset
        </button>
      </div>
    </div>
  );
}
