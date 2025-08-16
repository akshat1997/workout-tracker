import React from 'react';
import { useRestTimer } from '../hooks/useRestTimer';
import { formatTime } from '../utils';

interface RestTimerProps {
  defaultDuration?: number;
  onComplete?: () => void;
}

export const RestTimer: React.FC<RestTimerProps> = ({ defaultDuration = 60, onComplete }) => {
  const { timeLeft, isRunning, duration, start, pause, resume, reset, updateDuration } = useRestTimer({
    defaultDuration,
    onComplete
  });

  const progress = ((duration - timeLeft) / duration) * 100;

  return (
    <div className="w-full max-w-sm mx-auto p-4 bg-gray-900 rounded-lg shadow-lg">
      <h3 className="text-lg font-semibold text-white mb-4 text-center">Rest Timer</h3>
      
      <div className="relative w-48 h-48 mx-auto mb-4">
        <svg className="transform -rotate-90 w-48 h-48">
          <circle
            cx="96"
            cy="96"
            r="88"
            stroke="currentColor"
            strokeWidth="8"
            fill="none"
            className="text-gray-700"
          />
          <circle
            cx="96"
            cy="96"
            r="88"
            stroke="currentColor"
            strokeWidth="8"
            fill="none"
            strokeDasharray={`${2 * Math.PI * 88}`}
            strokeDashoffset={`${2 * Math.PI * 88 * (1 - progress / 100)}`}
            className="text-blue-500 transition-all duration-1000 ease-linear"
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-4xl font-bold text-white">{formatTime(timeLeft)}</span>
        </div>
      </div>

      <div className="flex gap-2 mb-4">
        {!isRunning && timeLeft === duration ? (
          <button
            onClick={() => start()}
            className="flex-1 bg-blue-500 hover:bg-blue-600 text-white font-semibold py-3 px-4 rounded-lg transition-colors"
          >
            Start
          </button>
        ) : (
          <>
            {isRunning ? (
              <button
                onClick={pause}
                className="flex-1 bg-yellow-500 hover:bg-yellow-600 text-white font-semibold py-3 px-4 rounded-lg transition-colors"
              >
                Pause
              </button>
            ) : (
              <button
                onClick={resume}
                className="flex-1 bg-green-500 hover:bg-green-600 text-white font-semibold py-3 px-4 rounded-lg transition-colors"
              >
                Resume
              </button>
            )}
            <button
              onClick={reset}
              className="flex-1 bg-gray-600 hover:bg-gray-700 text-white font-semibold py-3 px-4 rounded-lg transition-colors"
            >
              Reset
            </button>
          </>
        )}
      </div>

      <div className="flex gap-2">
        <button
          onClick={() => updateDuration(30)}
          className={`flex-1 py-2 px-3 rounded-lg font-medium transition-colors ${
            duration === 30
              ? 'bg-blue-500 text-white'
              : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
          }`}
        >
          30s
        </button>
        <button
          onClick={() => updateDuration(60)}
          className={`flex-1 py-2 px-3 rounded-lg font-medium transition-colors ${
            duration === 60
              ? 'bg-blue-500 text-white'
              : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
          }`}
        >
          60s
        </button>
        <button
          onClick={() => updateDuration(90)}
          className={`flex-1 py-2 px-3 rounded-lg font-medium transition-colors ${
            duration === 90
              ? 'bg-blue-500 text-white'
              : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
          }`}
        >
          90s
        </button>
        <button
          onClick={() => updateDuration(120)}
          className={`flex-1 py-2 px-3 rounded-lg font-medium transition-colors ${
            duration === 120
              ? 'bg-blue-500 text-white'
              : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
          }`}
        >
          120s
        </button>
      </div>
    </div>
  );
};
