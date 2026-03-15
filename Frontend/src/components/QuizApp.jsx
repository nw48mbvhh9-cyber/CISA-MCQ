import React from 'react';
import { useQuiz } from '../hooks/useQuiz';
import { QuizPage } from '../pages/QuizPage';
import { DashboardPage } from '../pages/DashboardPage';
import BackgroundParticles from '../components/BackgroundParticles';

export const QuizApp = ({ user, dbUser, onLogout }) => {
    const {
        currentIndex,
        currentQuestion,
        loadingQuestion,
        totalQuestions,
        userAnswers,
        quizState,
        stats,
        isShuffle,
        toggleShuffle,
        startReviewMode,
        submitAnswer,
        nextQuestion,
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
        answeredCount,
        globalTotalQuestions,

        // Domain Props
        availableDomains,
        selectedDomain,
        selectDomain,
        domainError,
        refreshDomains,
        domainStats
    } = useQuiz(user);

    const handleShuffle = () => toggleShuffle();
    const handleReview = () => startReviewMode();

    // Decide what to render based on state
    let content = null;

    switch (quizState) {
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
                    onLogout={onLogout}

                    quizState={quizState}
                    answeredCount={answeredCount}
                    globalTotalQuestions={globalTotalQuestions}
                    domainTotalQuestions={domainStats?.total || 0}
                    domainStats={domainStats} // Pass context-aware stats
                />
            );
            break;

        case 'results':
        case 'dashboard':
        default:
            content = (
                <DashboardPage
                    stats={stats}
                    wrongCount={Object.values(tags).filter(t => t === 'Hard').length}
                    onResume={resumeQuiz}
                    onStartFresh={startFreshQuiz}
                    onReview={handleReview}
                    onShuffle={handleShuffle}
                    isShuffle={isShuffle}
                    tags={tags}
                    onReviewTag={reviewTag}
                    user={user}
                    dbUser={dbUser}
                    onLogout={onLogout}

                    // Domain Selection Props
                    availableDomains={availableDomains}
                    selectedDomain={selectedDomain}
                    onSelectDomain={selectDomain}
                    domainError={domainError}
                    onRefreshDomains={refreshDomains}
                    domainStats={domainStats}
                />
            );
            break;
    }

    return (
        <div className="min-h-screen flex flex-col relative overflow-hidden text-gray-800 font-sans">
            <BackgroundParticles />
            <main className="flex-grow flex flex-col">
                {content}
            </main>
            <footer className="py-6 text-center text-gray-400 text-sm">
                Offline CISA Practice App • Local Storage Enabled
            </footer>
        </div>
    );
};
