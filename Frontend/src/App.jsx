import React from 'react';
import { useQuiz } from './hooks/useQuiz';
import { FileUpload } from './components/FileUpload';
import { QuizInterface } from './components/QuizInterface';
import { Dashboard } from './components/Dashboard';
import { FileQuestion } from 'lucide-react';
import confetti from 'canvas-confetti';
import BackgroundParticles from './components/BackgroundParticles';

function App() {
  const {
    questions,
    currentIndex,
    currentQuestion,
    totalQuestions,
    userAnswers,
    quizState, // upload, active, review, results, dashboard
    stats,
    wrongQuestionIds,
    isShuffle,

    loadQuestions,
    toggleShuffle,
    startReviewMode,
    submitAnswer,
    nextQuestion,
    resetQuiz,
    exitToDashboard,
    setQuizState,
    tags,
    addTag,
    resumeQuiz
  } = useQuiz();

  const handleShuffle = () => toggleShuffle();
  const handleReview = () => startReviewMode();

  // Decide what to render based on state
  let content = null;

  switch (quizState) {
    case 'upload':
      content = <FileUpload onFileUpload={loadQuestions} />;
      break;

    case 'active':
    case 'review':
      content = (
        <QuizInterface
          question={currentQuestion}
          currentIndex={currentIndex}
          totalQuestions={totalQuestions}
          onAnswer={submitAnswer}
          onNext={nextQuestion}
          userAnswer={userAnswers[currentQuestion?.id]}
          tags={tags}
          onAddTag={addTag}
        />
      );
      break;

    case 'results':
    case 'dashboard':
      content = (
        <Dashboard
          stats={stats}
          wrongCount={wrongQuestionIds.length}
          onResume={resumeQuiz}
          onReview={handleReview}
          onShuffle={handleShuffle}
          isShuffle={isShuffle}
          onReset={resetQuiz}
        />
      );
      break;

    default:
      content = <div>Unknown State</div>;
  }

  return (
    <div className="min-h-screen flex flex-col relative overflow-hidden text-gray-800 font-sans">
      <BackgroundParticles />
      {/* Navbar */}
      <header className="bg-white/80 backdrop-blur-md border-b border-gray-100/50 sticky top-0 z-50 px-6 py-4 shadow-sm">
        <div className="max-w-5xl mx-auto flex justify-between items-center">
          <div className="flex items-center gap-2 text-blue-700 font-bold text-xl cursor-default">
            <div className="bg-blue-100 p-2 rounded-lg">
              <FileQuestion size={24} />
            </div>
            CISA Master
          </div>

          {quizState !== 'upload' && (
            <button
              onClick={exitToDashboard}
              className="text-sm font-medium text-gray-600 hover:text-blue-600 transition-colors"
            >
              Main Menu
            </button>
          )}
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-grow flex flex-col items-center justify-start pt-8 pb-12 px-4">
        {content}
      </main>

      {/* Footer */}
      <footer className="py-6 text-center text-gray-400 text-sm">
        Offline CISA Practice App • Local Storage Enabled
      </footer>
    </div>
  );
}

export default App;
