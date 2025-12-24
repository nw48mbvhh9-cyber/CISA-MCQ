import { useState, useEffect, useCallback } from 'react';

export const useQuiz = () => {
    // --- State ---
    const [questions, setQuestions] = useState([]);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [userAnswers, setUserAnswers] = useState({}); // { questionId: 'A' }
    const [quizState, setQuizState] = useState('upload'); // 'upload' | 'active' | 'review' | 'results'
    const [wrongQuestionIds, setWrongQuestionIds] = useState(() => {
        const saved = localStorage.getItem('cisa_wrong_ids');
        return saved ? JSON.parse(saved) : [];
    });
    const [stats, setStats] = useState(() => {
        const saved = localStorage.getItem('cisa_stats');
        return saved ? JSON.parse(saved) : { correct: 0, wrong: 0, total: 0 };
    });
    const [isShuffle, setIsShuffle] = useState(false);
    const [interactionQueue, setInteractionQueue] = useState([]); // Array of indices or IDs to iterate through
    const [tags, setTags] = useState(() => {
        const saved = localStorage.getItem('cisa_quiz_tags');
        return saved ? JSON.parse(saved) : {};
    });

    // --- Effects ---
    useEffect(() => {
        localStorage.setItem('cisa_wrong_ids', JSON.stringify(wrongQuestionIds));
    }, [wrongQuestionIds]);

    useEffect(() => {
        localStorage.setItem('cisa_stats', JSON.stringify(stats));
    }, [stats]);

    useEffect(() => {
        localStorage.setItem('cisa_quiz_tags', JSON.stringify(tags));
    }, [tags]);

    // --- Actions ---

    const loadQuestions = useCallback((data) => {
        if (!Array.isArray(data)) {
            alert("Invalid JSON format. Expected an array.");
            return;
        }
        setQuestions(data);
        // Default queue: 0 to N-1
        const initialQueue = data.map((_, idx) => idx);
        setInteractionQueue(initialQueue);
        setQuizState('active');
        setCurrentIndex(0);
    }, []);

    const toggleShuffle = useCallback(() => {
        setIsShuffle(prev => {
            const nextState = !prev;
            if (nextState) {
                // Shuffle current queue
                setInteractionQueue(prevQueue => {
                    const newQueue = [...prevQueue];
                    for (let i = newQueue.length - 1; i > 0; i--) {
                        const j = Math.floor(Math.random() * (i + 1));
                        [newQueue[i], newQueue[j]] = [newQueue[j], newQueue[i]];
                    }
                    return newQueue;
                });
                // Reset index to start of new shuffled queue if desired, or keep relative?
                // Simpler to reset to 0 for the new order logic-wise if user wants "Shuffle Mode",
                // usually implies "Give me random questions".
                // If mid-quiz, maybe just shuffle UNANSWERED ones?
                // For now, let's just shuffle the whole deck and reset index if easy, or shuffle remaining.
                // Let's simple shuffle entire deck and reset to 0.
                setCurrentIndex(0);
            } else {
                // Restore original order (0 to N-1) or whatever subset we are in
                // If we are in 'active' mode (all questions)
                const sorted = [...interactionQueue].sort((a, b) => a - b);
                setInteractionQueue(sorted);
            }
            return nextState;
        });
    }, [interactionQueue, quizState]);

    const startReviewMode = useCallback(() => {
        if (wrongQuestionIds.length === 0) {
            alert("No wrong questions to review!");
            return;
        }
        // Filter questions to find indices of wrong IDs
        const wrongIndices = questions
            .map((q, idx) => wrongQuestionIds.includes(q.id) ? idx : -1)
            .filter(idx => idx !== -1);

        setInteractionQueue(wrongIndices);
        setQuizState('review');
        setCurrentIndex(0);
        setIsShuffle(false);
    }, [questions, wrongQuestionIds]);

    const submitAnswer = useCallback((selectedOption) => {
        if (quizState !== 'active' && quizState !== 'review') return;

        const currentQIndex = interactionQueue[currentIndex];
        const currentQ = questions[currentQIndex];
        if (!currentQ) return;

        const isCorrect = selectedOption === currentQ.correct_answer;

        // Auto-tag "Great" if correct and not already tagged
        if (isCorrect) {
            const existingTag = tags[currentQ.id];
            if (!existingTag) {
                handleAddTag(currentQ.id, "Great");
            }
        }

        setStats(prev => ({
            ...prev,
            total: prev.total + 1,
            correct: prev.correct + (isCorrect ? 1 : 0),
            wrong: prev.wrong + (isCorrect ? 0 : 1)
        }));

        if (!isCorrect) {
            setWrongQuestionIds(prev => {
                if (!prev.includes(currentQ.id)) {
                    return [...prev, currentQ.id];
                }
                return prev;
            });
        }

        setUserAnswers(prev => ({
            ...prev,
            [currentQ.id]: selectedOption
        }));
    }, [currentIndex, interactionQueue, questions, quizState, tags]);

    const nextQuestion = useCallback(() => {
        if (currentIndex < interactionQueue.length - 1) {
            setCurrentIndex(prev => prev + 1);
        } else {
            if (quizState === 'review') {
                if (window.confirm("Review complete. Return to dashboard?")) {
                    setQuizState('results');
                }
            } else {
                setQuizState('results');
            }
        }
    }, [currentIndex, interactionQueue.length, quizState]);

    const resetQuiz = useCallback(() => {
        setQuizState('upload');
        setQuestions([]);
        setInteractionQueue([]);
        setCurrentIndex(0);
        setUserAnswers({});
        setTags({});
        localStorage.removeItem('cisa_quiz_tags');
    }, []);

    // --- Tagging Logic ---
    // Moved to top state

    // const [tags, setTags] = ... moved up
    // useEffect ... moved up

    const handleAddTag = useCallback((questionId, tagName) => {
        setTags(prev => ({
            ...prev,
            [questionId]: tagName
        }));
    }, []);

    // Fix Continue Quiz Logic
    // Store the "Active" state index/queue before going to review?
    // Actually, "Active" state is derived from ALL questions + linear queue [0...N].
    // If we just switch back to 'active', we need to decide WHERE to resume.
    // Ideally resume at the first unanswered question.

    const resumeQuiz = useCallback(() => {
        // Switch to active mode
        setQuizState('active');
        // Restore queue to full list
        const fullQueue = questions.map((_, i) => i);
        setInteractionQueue(fullQueue);

        // Find first unanswered question
        const firstUnanswered = fullQueue.findIndex(qIndex => {
            const qId = questions[qIndex].id;
            return !userAnswers[qId];
        });

        if (firstUnanswered !== -1) {
            setCurrentIndex(firstUnanswered);
        } else {
            // All answered? go to end or 0
            setCurrentIndex(0); // or handle finished
        }
    }, [questions, userAnswers]);

    const exitToDashboard = useCallback(() => {
        if (questions.length > 0) {
            setQuizState('dashboard');
        } else {
            setQuizState('upload');
        }
    }, [questions.length]);


    return {
        questions,
        currentIndex,
        currentQuestion: questions[interactionQueue[currentIndex]],
        totalQuestions: interactionQueue.length,
        userAnswers,
        quizState,
        stats,
        wrongQuestionIds,
        isShuffle,
        tags, // Export tags

        // Actions
        loadQuestions,
        toggleShuffle,
        startReviewMode,
        submitAnswer,
        nextQuestion,
        resetQuiz,
        exitToDashboard,
        setQuizState,
        addTag: handleAddTag, // Export addTag
        resumeQuiz // Export new resume action
    };
};
