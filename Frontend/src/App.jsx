import React, { useEffect, useState } from 'react';
import { LogIn } from 'lucide-react';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { auth } from './firebase';
import { useQuiz } from './hooks/useQuiz';
// import { UploadPage } from './pages/UploadPage'; // Removed
import { QuizPage } from './pages/QuizPage';
import { DashboardPage } from './pages/DashboardPage';
import { LoginPage } from './pages/LoginPage';
import BackgroundParticles from './components/BackgroundParticles';

function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const {
    currentIndex,
    currentQuestion,
    loadingQuestion,
    totalQuestions,
    userAnswers, // Restored
    quizState, // Restored
    stats,
    // wrongQuestionIds, // Removed
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
    updateNote,
    answeredCount, // New export
    globalTotalQuestions // New export
  } = useQuiz(user);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const handleShuffle = () => toggleShuffle();
  const handleReview = () => startReviewMode();
  const handleLogout = () => signOut(auth);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0f172a]">
        <div className="w-12 h-12 border-4 border-blue-500/30 border-t-blue-500 rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!user) {
    return <LoginPage />;
  }

  // Decide what to render based on state
  let content = null;

  switch (quizState) {
    // case 'upload':
    //   content = <UploadPage onFileUpload={loadQuestions} />;
    //   break;

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

          loadingQuestion={loadingQuestion}
          user={user}
          onLogout={handleLogout}

          // Pass global props for progress
          quizState={quizState}
          answeredCount={answeredCount}
          globalTotalQuestions={globalTotalQuestions}
        />
      );
      break;

    case 'results':
    case 'dashboard':
      content = (
        <DashboardPage
          stats={stats}
          // wrongCount is now derived from tags labeled "Hard"
          wrongCount={Object.values(tags).filter(t => t === 'Hard').length}
          onResume={resumeQuiz}
          onStartFresh={startFreshQuiz}
          onReview={handleReview}
          onShuffle={handleShuffle}
          isShuffle={isShuffle}
          // onReset={resetQuiz} // Removed reset button
          tags={tags}
          onReviewTag={reviewTag}
          user={user}
          onLogout={handleLogout}
        />
      );
      break;

    default:
      // Default fallback to Dashboard if unknown state (was 'upload')
      content = (
        <DashboardPage
          stats={stats}
          wrongCount={wrongQuestionIds.length}
          onResume={resumeQuiz}
          onStartFresh={startFreshQuiz}
          onReview={handleReview}
          onShuffle={handleShuffle}
          isShuffle={isShuffle}
          // onReset={resetQuiz}
          tags={tags}
          onReviewTag={reviewTag}
          user={user}
          onLogout={handleLogout}
        />
      );
  }

  return (
    <div className="min-h-screen flex flex-col relative overflow-hidden text-gray-800 font-sans">
      <BackgroundParticles />




      {/* Main Content */}
      <main className="flex-grow flex flex-col">
        {content}
      </main>

      {/* Footer */}
      <footer className="py-6 text-center text-gray-400 text-sm">
        Offline CISA Practice App • Local Storage Enabled
      </footer>
    </div >
  );
}

export default App;
