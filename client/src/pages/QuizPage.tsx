import React, { useEffect, useState, useCallback, useRef } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Layout } from '../components/Layout';
import { Timer } from '../components/Timer';
import { QuizCard } from '../components/QuizCard';
import { FeedbackOverlay } from '../components/FeedbackOverlay';
import { quizApi } from '../services/api';
import { Question, SubmitResult, EventPhase } from '../types';

export const QuizPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const phase = (searchParams.get('phase') as EventPhase) || 'PRE_QUALIFIER';

  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState('');
  const [timeLeft, setTimeLeft] = useState(30);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [feedback, setFeedback] = useState<SubmitResult | null>(null);
  const [error, setError] = useState('');
  const [startTime, setStartTime] = useState<number>(0);
  const [tabSwitchCount, setTabSwitchCount] = useState(0);
  const [showAntiCheatToast, setShowAntiCheatToast] = useState(false);

  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const tabSwitchesRef = useRef(0); // always fresh per question

  const currentQuestion = questions[currentIndex];

  useEffect(() => {
    async function loadQuestions() {
      setIsLoading(true);
      try {
        const response = await quizApi.getQuestions(phase);
        if (response.error) {
          setError(response.error);
          return;
        }
        const data = response.data as { questions: Question[] };
        const unanswered = data.questions.filter((q) => !q.answered);
        setQuestions(unanswered);
        if (unanswered.length > 0) {
          setTimeLeft(unanswered[0].timeLimit);
        }
      } catch {
        setError('加载题目失败');
      } finally {
        setIsLoading(false);
      }
    }
    loadQuestions();
  }, [phase]);

  // Anti-cheat: detect tab/window switches
  useEffect(() => {
    if (!currentQuestion || feedback || isSubmitting) return;

    const handleVisibilityChange = () => {
      // Only count when the tab becomes hidden (user leaves)
      // Using ONLY visibilitychange to avoid double-counting with window blur
      if (document.hidden) {
        tabSwitchesRef.current += 1;
        const newCount = tabSwitchesRef.current;
        setTabSwitchCount(newCount);
        
        if (newCount >= 5) {
          // Automatic ban triggered on backend during submission, 
          // but we redirect here for better UX
          alert('检测到违规切屏次数过多，您的账号已被封禁。');
          navigate('/dashboard');
          return;
        }

        setShowAntiCheatToast(true);
        setTimeout(() => setShowAntiCheatToast(false), 3000);
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [currentQuestion?.id, feedback, isSubmitting, navigate]);

  useEffect(() => {
    if (!currentQuestion || feedback || isSubmitting) return;

    setTimeLeft(currentQuestion.timeLimit);
    setStartTime(Date.now());

    if (timerRef.current) clearInterval(timerRef.current);

    timerRef.current = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          handleTimeout();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [currentIndex, currentQuestion?.id]);

  const handleTimeout = useCallback(async () => {
    if (!currentQuestion || isSubmitting || feedback) return;
    setIsSubmitting(true);
    const timeTaken = Date.now() - startTime;
    try {
      await quizApi.submitAnswer(currentQuestion.id, '__TIMEOUT__', timeTaken);
    } catch (err) {
      console.error('Timeout submission error:', err);
    }
    moveToNext();
  }, [currentQuestion, isSubmitting, feedback, startTime]);

  const handleSubmit = async () => {
    if (!currentQuestion || !selectedAnswer.trim() || isSubmitting || feedback) return;
    setIsSubmitting(true);
    const timeTaken = Date.now() - startTime;
    const switches = tabSwitchesRef.current;
    try {
      const response = await quizApi.submitAnswer(currentQuestion.id, selectedAnswer.trim(), timeTaken, switches);
      
      // Handle ban status (403 from backend)
      if (response.error && response.error.includes('banned')) {
        alert('您的账号已被封禁：' + (response.error || '切屏次数过多'));
        navigate('/dashboard');
        return;
      }

      if (response.error) {
        setError(response.error);
        setIsSubmitting(false);
        return;
      }
      const result = response.data as SubmitResult;
      setFeedback(result);
    } catch {
      setError('提交失败，请重试');
      setIsSubmitting(false);
    }
  };

  const moveToNext = useCallback(() => {
    setFeedback(null);
    setSelectedAnswer('');
    setError('');
    setIsSubmitting(false);
    setTabSwitchCount(0);
    tabSwitchesRef.current = 0;
    if (currentIndex < questions.length - 1) {
      setCurrentIndex((prev) => prev + 1);
    } else {
      navigate(`/results?phase=${phase}`);
    }
  }, [currentIndex, questions.length, phase, navigate]);

  if (isLoading) {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center">
            <span className="text-6xl font-brush text-ink-300 animate-float">诗</span>
            <p className="mt-4 text-ink-400 font-kai">加载题目中...</p>
          </div>
        </div>
      </Layout>
    );
  }

  if (questions.length === 0) {
    return (
      <Layout>
        <div className="text-center py-16">
          <span className="text-6xl font-brush text-gold-500">🎉</span>
          <h2 className="text-2xl font-brush text-ink-900 mt-4">全部完成！</h2>
          <p className="text-ink-500 mt-2 font-kai">你已经答完了所有题目</p>
          <button onClick={() => navigate(`/results?phase=${phase}`)} className="btn btn-primary mt-6">
            查看成绩
          </button>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="max-w-2xl mx-auto">
        {/* Progress */}
        <div className="mb-6">
          <div className="flex justify-between text-sm text-ink-500 mb-2 font-kai">
            <span>第 {currentIndex + 1} / {questions.length} 题</span>
            <span>{phase === 'FINALS' ? '🔴 决赛' : '🟢 预选赛'}</span>
          </div>
          <div className="h-2 bg-ink-100 rounded-full overflow-hidden">
            <div
              className="h-full bg-seal-500 rounded-full transition-all duration-300"
              style={{ width: `${((currentIndex + 1) / questions.length) * 100}%` }}
            />
          </div>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">
            {error}
          </div>
        )}

        {/* Anti-cheat live warning */}
        {showAntiCheatToast && tabSwitchCount > 0 && (
          <div className="mb-4 p-3 bg-yellow-50 border-2 border-yellow-400 text-yellow-800 rounded-lg text-sm font-kai animate-seal-stamp">
            🚨 检测到切屏！当前切屏次数：<strong>{tabSwitchCount}</strong> / 5
            {tabSwitchCount >= 3 && ' ⚠️ 再切 ' + (5 - tabSwitchCount) + ' 次将自动判错！'}
          </div>
        )}

        {/* Quiz Card */}
        <QuizCard
          question={currentQuestion}
          questionNumber={currentIndex + 1}
          totalQuestions={questions.length}
        >
          {/* Timer */}
          <div className="mb-6">
            <Timer
              seconds={timeLeft}
              totalSeconds={currentQuestion.timeLimit}
            />
          </div>

          {/* Multiple Choice / True-False */}
          {(currentQuestion.type === 'MULTIPLE_CHOICE' || currentQuestion.type === 'TRUE_FALSE') && (
            <div className="space-y-3">
              {currentQuestion.options?.map((option, idx) => (
                <button
                  key={idx}
                  onClick={() => setSelectedAnswer(option)}
                  className={`option-btn ${selectedAnswer === option ? 'selected' : ''}`}
                  disabled={isSubmitting || !!feedback}
                >
                  <span className="inline-flex items-center gap-3">
                    <span className="w-8 h-8 rounded-full bg-ink-100 flex items-center justify-center text-sm font-bold text-ink-500 shrink-0">
                      {String.fromCharCode(65 + idx)}
                    </span>
                    <span>{option}</span>
                  </span>
                </button>
              ))}
            </div>
          )}

          {/* Short Answer */}
          {currentQuestion.type === 'SHORT_ANSWER' && (
            <div>
              <textarea
                className="input resize-none font-kai"
                rows={3}
                value={selectedAnswer}
                onChange={(e) => setSelectedAnswer(e.target.value)}
                placeholder="请输入答案..."
                disabled={isSubmitting || !!feedback}
              />
              <p className="text-xs text-ink-400 mt-2 font-kai">
                💡 匹配任意关键词即可得分
              </p>
            </div>
          )}

          {/* Submit Button */}
          <button
            onClick={handleSubmit}
            disabled={!selectedAnswer.trim() || isSubmitting || !!feedback}
            className={`btn w-full py-3 text-lg mt-6 font-kai ${
              selectedAnswer.trim() && !isSubmitting && !feedback
                ? 'btn-primary'
                : 'bg-ink-100 text-ink-300 cursor-not-allowed'
            }`}
          >
            {isSubmitting ? (
              <span className="flex items-center justify-center gap-2">
                <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                提交中...
              </span>
            ) : (
              '提 交'
            )}
          </button>
        </QuizCard>

        {/* Feedback Overlay */}
        {feedback && (
          <FeedbackOverlay
            isCorrect={feedback.submission.isCorrect}
            correctAnswer={feedback.correctAnswer}
            explanation={feedback.explanation}
            onContinue={moveToNext}
            antiCheatWarning={feedback.antiCheatWarning}
            tabSwitches={feedback.submission.tabSwitches}
          />
        )}
      </div>
    </Layout>
  );
};
