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
        const defaultStats = { correct: 0, wrong: 0, total: 0 };
        if (!saved) return defaultStats;
        try {
            const parsed = JSON.parse(saved);
            return { ...defaultStats, ...parsed };
        } catch (e) {
            return defaultStats;
        }
    });
    const [isShuffle, setIsShuffle] = useState(false);
    const [interactionQueue, setInteractionQueue] = useState([]); // Array of indices or IDs to iterate through
    const [tags, setTags] = useState(() => {
        const saved = localStorage.getItem('cisa_quiz_tags');
        return saved ? JSON.parse(saved) : {};
    });
    const [subMode, setSubMode] = useState(null); // 'present' | 'new' | null
    const [completionMessage, setCompletionMessage] = useState(null);

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

    const [notes, setNotes] = useState(() => {
        const saved = localStorage.getItem('cisa_quiz_notes');
        return saved ? JSON.parse(saved) : {};
    });

    useEffect(() => {
        localStorage.setItem('cisa_quiz_notes', JSON.stringify(notes));
    }, [notes]);

    // --- Actions ---

    const loadQuestions = useCallback((data) => {
        if (!Array.isArray(data)) {
            alert("Invalid JSON format. Expected an array.");
            return;
        }

        // --- FULL RESET ---
        setStats({ correct: 0, wrong: 0, total: 0 });
        setWrongQuestionIds([]);
        setUserAnswers({});
        setTags({});
        setNotes({});
        localStorage.removeItem('cisa_quiz_tags');
        localStorage.removeItem('cisa_quiz_notes');
        // ------------------

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
    }, [interactionQueue]);

    const startReviewMode = useCallback(() => {
        if (wrongQuestionIds.length === 0) {
            alert("No wrong questions to review!");
            return;
        }
        // Filter questions to find indices of wrong IDs
        const wrongIndices = questions
            .map((q, idx) => wrongQuestionIds.includes(q.id) ? idx : -1)
            .filter(idx => idx !== -1);

        // --- FRESH REVIEW: Clear answers for these questions ---
        setUserAnswers(prev => {
            const next = { ...prev };
            wrongQuestionIds.forEach(id => delete next[id]);
            return next;
        });
        // -----------------------------------------------------

        setInteractionQueue(wrongIndices);
        setQuizState('review');
        setSubMode(null); // Ensure we are not in 'present' mode from prior interactions
        setCurrentIndex(0);
        setIsShuffle(false);
    }, [questions, wrongQuestionIds]);

    const reviewTag = useCallback((tagName, mode = 'present', shuffle = false) => {
        let tagIndices = questions
            .map((q, idx) => tags[q.id] === tagName ? idx : -1)
            .filter(idx => idx !== -1);

        if (tagIndices.length === 0) {
            alert(`No questions found with tag: ${tagName}`);
            return;
        }

        if (mode === 'new') {
            // Clear answers for these specific questions
            setUserAnswers(prev => {
                const newAnswers = { ...prev };
                tagIndices.forEach(idx => {
                    delete newAnswers[questions[idx].id];
                });
                return newAnswers;
            });
        }

        if (shuffle) {
            for (let i = tagIndices.length - 1; i > 0; i--) {
                const j = Math.floor(Math.random() * (i + 1));
                [tagIndices[i], tagIndices[j]] = [tagIndices[j], tagIndices[i]];
            }
        }

        setInteractionQueue(tagIndices);
        setQuizState('review');
        setSubMode(mode);
        setCurrentIndex(0);
        setIsShuffle(shuffle);
    }, [questions, tags]);

    const handleAddTag = useCallback((questionId, tagName) => {
        setTags(prev => ({
            ...prev,
            [questionId]: tagName
        }));
    }, []);

    const submitAnswer = useCallback((selectedOption) => {
        if (quizState !== 'active' && quizState !== 'review') return;

        const currentQIndex = interactionQueue[currentIndex];
        const currentQ = questions[currentQIndex];
        if (!currentQ) return;

        const isCorrect = selectedOption === currentQ.correct_answer;

        // Auto-tagging system
        const existingTag = tags[currentQ.id];
        if (isCorrect) {
            // If correct and no tag, set to "Good"
            if (!existingTag) {
                handleAddTag(currentQ.id, "Good");
            }
        } else {
            // If wrong, set to "Hard" ONLY if no tag exists
            if (!existingTag) {
                handleAddTag(currentQ.id, "Hard");
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
    }, [currentIndex, interactionQueue, questions, quizState, tags, handleAddTag]);

    const nextQuestion = useCallback(() => {
        if (currentIndex < interactionQueue.length - 1) {
            setCurrentIndex(prev => prev + 1);
        } else {
            // Auto-redirect to dashboard on completion with 3s delay
            setCompletionMessage("Session complete! Returning to Dashboard...");
            setTimeout(() => {
                setCompletionMessage(null);
                setQuizState('dashboard');
            }, 3000);
        }
    }, [currentIndex, interactionQueue.length, quizState]);

    const resetQuiz = useCallback(() => {
        setQuizState('upload');
        setQuestions([]);
        setInteractionQueue([]);
        setCurrentIndex(0);
        setUserAnswers({});
        setTags({});
        setNotes({});
        setSubMode(null);
        localStorage.removeItem('cisa_quiz_tags');
        localStorage.removeItem('cisa_quiz_notes');
    }, []);

    // --- Tagging Logic ---
    // Moved to top state

    // const [tags, setTags] = ... moved up
    // useEffect ... moved up



    // Fix Continue Quiz Logic
    // Store the "Active" state index/queue before going to review?
    // Actually, "Active" state is derived from ALL questions + linear queue [0...N].
    // If we just switch back to 'active', we need to decide WHERE to resume.
    // Ideally resume at the first unanswered question.

    const resumeQuiz = useCallback(() => {
        // Switch to active mode
        setQuizState('active');
        setSubMode(null);
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

    const startFreshQuiz = useCallback(() => {
        if (!window.confirm("Are you sure you want to start a fresh quiz? All progress for the current file will be cleared.")) return;

        setUserAnswers({});
        setStats({ correct: 0, wrong: 0, total: 0 });
        setWrongQuestionIds([]);
        setQuizState('active');
        setSubMode(null);
        setCurrentIndex(0);
        setIsShuffle(false);
        const fullQueue = questions.map((_, i) => i);
        setInteractionQueue(fullQueue);
    }, [questions]);

    const exitToDashboard = useCallback(() => {
        if (questions.length > 0) {
            setQuizState('dashboard');
        } else {
            setQuizState('upload');
        }
    }, [questions.length]);


    const updateNote = useCallback((questionId, noteContent) => {
        setNotes(prev => ({
            ...prev,
            [questionId]: noteContent
        }));
    }, []);

    return {
        questions,
        currentIndex,
        currentQuestion: questions[interactionQueue[currentIndex]],
        totalQuestions: interactionQueue.length,
        userAnswers,
        quizState,
        stats,
        wrongQuestionIds,
        wrongQuestionIds,
        subMode, // Export subMode
        tags,
        notes, // Export notes
        isShuffle,

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
        updateNote, // Export updateNote
        resumeQuiz, // Export new resume action
        reviewTag, // Export reviewTag action
        startFreshQuiz, // Export startFreshQuiz
        completionMessage // Export completion message state
    };
};
