import React from 'react';
import { Question } from '../types';

interface QuizCardProps {
  question: Question;
  questionNumber: number;
  totalQuestions: number;
  children: React.ReactNode;
}

export const QuizCard: React.FC<QuizCardProps> = ({
  question,
  questionNumber,
  totalQuestions,
  children,
}) => {
  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'MULTIPLE_CHOICE': return '选择题';
      case 'TRUE_FALSE': return '判断题';
      case 'SHORT_ANSWER': return '简答题';
      default: return type;
    }
  };

  return (
    <div className="card max-w-2xl mx-auto animate-fade-in poem-card">
      {/* Question Header */}
      <div className="flex items-center justify-between mb-4">
        <span className="text-sm font-kai text-ink-500">
          第 {questionNumber} / {totalQuestions} 题
        </span>
        <span className="text-xs px-3 py-1 bg-ink-100 rounded-full text-ink-600 font-kai">
          {getTypeLabel(question.type)}
        </span>
      </div>

      {/* Decorative line */}
      <div className="ink-divider" />

      {/* Question Text */}
      <h2 className="text-xl font-kai text-ink-900 mb-6 leading-relaxed whitespace-pre-line">
        {question.questionText}
      </h2>

      {/* Image (if any) */}
      {question.imageUrl && (
        <img
          src={question.imageUrl}
          alt="题目插图"
          className="w-full max-h-48 object-cover rounded-lg mb-6 border border-ink-100"
        />
      )}

      {/* Answer Area */}
      {children}
    </div>
  );
};
