import React, { useEffect } from 'react';

interface FeedbackOverlayProps {
  isCorrect: boolean;
  correctAnswer: string;
  explanation: string | null;
  onContinue: () => void;
  delay?: number;
  antiCheatWarning?: string | null;
  tabSwitches?: number;
}

export const FeedbackOverlay: React.FC<FeedbackOverlayProps> = ({
  isCorrect,
  correctAnswer,
  explanation,
  onContinue,
  delay = 3000,
  antiCheatWarning,
  tabSwitches = 0,
}) => {
  useEffect(() => {
    const timer = setTimeout(onContinue, delay);
    return () => clearTimeout(timer);
  }, [onContinue, delay]);

  return (
    <div className="fixed inset-0 bg-ink-950/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fade-in">
      <div className="bg-white rounded-lg shadow-ink p-8 max-w-md w-full animate-seal-stamp relative overflow-hidden">
        {/* Decorative top bar */}
        <div className={`absolute top-0 left-0 right-0 h-1 ${
          isCorrect ? 'bg-success' : 'bg-seal-500'
        }`} />

        {/* Icon & Title */}
        <div className="text-center mb-6">
          <div className="text-6xl mb-3">
            {isCorrect ? '✅' : '❌'}
          </div>
          <h3 className={`text-2xl font-brush ${
            isCorrect ? 'text-success' : 'text-seal-600'
          }`}>
            {isCorrect ? '回答正确' : '回答错误'}
          </h3>
        </div>

        {/* Correct Answer */}
        <div className={`p-4 rounded-lg mb-4 border ${
          isCorrect
            ? 'bg-green-50 border-green-200'
            : 'bg-red-50 border-red-200'
        }`}>
          <p className="text-sm font-kai text-ink-500 mb-1">正确答案：</p>
          <p className="text-lg font-kai text-ink-900 whitespace-pre-line">{correctAnswer}</p>
        </div>

        {/* Anti-cheat warning */}
        {antiCheatWarning && (
          <div className={`p-4 rounded-lg mb-4 border ${
            tabSwitches >= 5
              ? 'bg-red-50 border-red-300'
              : 'bg-yellow-50 border-yellow-300'
          }`}>
            <p className="text-sm font-kai font-bold text-red-700">
              🚨 切屏检测
            </p>
            <p className="text-sm font-kai text-red-600 mt-1">
              切屏次数：{tabSwitches} 次
            </p>
            <p className="text-xs font-kai text-red-500 mt-1">
              {antiCheatWarning}
            </p>
          </div>
        )}

        {/* Explanation */}
        {explanation && (
          <div className="p-4 bg-ink-50 rounded-lg mb-6">
            <p className="text-sm font-kai text-ink-500 mb-1">解析：</p>
            <p className="text-sm text-ink-700 leading-relaxed whitespace-pre-line">{explanation}</p>
          </div>
        )}

        {/* Continue Button */}
        <button
          onClick={onContinue}
          className="btn btn-primary w-full py-3 text-lg font-kai"
        >
          下一题 →
        </button>

        {/* Auto-continue hint */}
        <p className="text-center text-xs text-ink-300 mt-3 font-kai">
          {delay / 1000} 秒后自动继续...
        </p>
      </div>
    </div>
  );
};
