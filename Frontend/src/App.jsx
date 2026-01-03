import React from 'react';
import { useQuiz } from './hooks/useQuiz';
import { UploadPage } from './pages/UploadPage';
import { QuizPage } from './pages/QuizPage';
import { DashboardPage } from './pages/DashboardPage';
import BackgroundParticles from './components/BackgroundParticles';

function App() {
  const {
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
    tags,
    addTag,
    resumeQuiz,
    reviewTag,
    subMode,
    startFreshQuiz,
    completionMessage,
    notes,
    updateNote
  } = useQuiz();

  const handleShuffle = () => toggleShuffle();
  const handleReview = () => startReviewMode();

  // Decide what to render based on state
  let content = null;

  switch (quizState) {
    case 'upload':
      content = <UploadPage onFileUpload={loadQuestions} />;
      break;

    case 'active':
    case 'review':
      content = (
        <QuizPage
          question={currentQuestion}
          currentIndex={currentIndex}
          totalQuestions={totalQuestions}
          onAnswer={submitAnswer}
          onNext={nextQuestion}
          userAnswer={userAnswers[currentQuestion?.id]}
          tags={tags}
          onAddTag={addTag}
          onExit={exitToDashboard}
          subMode={subMode}
          completionMessage={completionMessage}
          notes={notes}
          onUpdateNote={updateNote}
        />
      );
      break;

    case 'results':
    case 'dashboard':
      content = (
        <DashboardPage
          stats={stats}
          wrongCount={wrongQuestionIds.length}
          onResume={resumeQuiz}
          onStartFresh={startFreshQuiz}
          onReview={handleReview}
          onShuffle={handleShuffle}
          isShuffle={isShuffle}
          onReset={resetQuiz}
          tags={tags}
          onReviewTag={reviewTag}
        />
      );
      break;

    default:
      content = <div>Unknown State</div>;
  }

  return (
    <div className="min-h-screen flex flex-col relative overflow-hidden text-gray-800 font-sans">
      <BackgroundParticles />
      {/* Navbar - Removed for consolidated header in QuizInterface */}

      {/* Main Content */}
      <main className="flex-grow flex flex-col">
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
