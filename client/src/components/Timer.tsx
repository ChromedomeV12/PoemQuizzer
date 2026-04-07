import React from 'react';

interface TimerProps {
  seconds: number;
  totalSeconds: number;
}

export const Timer: React.FC<TimerProps> = ({ seconds, totalSeconds }) => {
  const percentage = (seconds / totalSeconds) * 100;
  const isLow = seconds <= 5;
  const isCritical = seconds <= 3;

  return (
    <div className="w-full">
      <div className="flex items-center justify-between mb-2">
        <span className={`text-lg font-brush ${
          isCritical ? 'text-seal-600 animate-pulse' : isLow ? 'text-warning' : 'text-ink-600'
        }`}>
          ⏱ {seconds} 秒
        </span>
        <span className="text-sm text-ink-400 font-kai">
          {seconds <= 0 ? '时间到！' : '答题时间'}
        </span>
      </div>
      <div className="w-full h-2.5 bg-ink-100 rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-1000 ease-linear ${
            isCritical
              ? 'bg-seal-500'
              : isLow
                ? 'bg-warning'
                : 'bg-bamboo-500'
          }`}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
};
