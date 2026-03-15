import { useState, useEffect, useCallback, useMemo } from 'react';
import { doc, setDoc, getDocs, collection, getDoc, query, where } from 'firebase/firestore'; // Added 'query'
import { db } from '../firebase';
import questionIdsData from '../data/question_ids.json';

export const useQuiz = (user) => {
    // --- State ---

    // Domain Management
    const [availableDomains, setAvailableDomains] = useState([]);
    const [selectedDomain, setSelectedDomain] = useState(null);
    const [loadingDomains, setLoadingDomains] = useState(false);
    const [domainError, setDomainError] = useState(null);



    // --- Data Loading: Fetch Domains ---
    const fetchDomains = useCallback(async () => {
        setLoadingDomains(true);
        setDomainError(null);
        try {
            const q = query(collection(db, 'domains'));
            const snapshot = await getDocs(q);
            const domains = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
            setAvailableDomains(domains);

            // Optional: Auto-select if only one domain exists
            if (domains.length === 1) {
                setSelectedDomain(domains[0]);
            }
        } catch (error) {
            console.error("Error fetching domains:", error);
            setDomainError(error.message);
        } finally {
            setLoadingDomains(false);
        }
    }, []);

    useEffect(() => {
        fetchDomains();
    }, [fetchDomains]);

    // Initialize from localStorage if available
    const [questionIds, setQuestionIds] = useState(() => {
        const saved = localStorage.getItem('cisa_question_ids');
        return saved ? JSON.parse(saved) : (questionIdsData || []);
    });

    const [currentQuestion, setCurrentQuestion] = useState(null);
    const [loadingQuestion, setLoadingQuestion] = useState(false);

    const [currentIndex, setCurrentIndex] = useState(() => {
        const saved = localStorage.getItem('cisa_current_index');
        return saved ? parseInt(saved, 10) : 0;
    });

    const [userAnswers, setUserAnswers] = useState(() => {
        const saved = localStorage.getItem('cisa_user_answers');
        return saved ? JSON.parse(saved) : {};
    });

    const [quizState, setQuizState] = useState('dashboard'); // Always start on dashboard

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

    const [isShuffle, setIsShuffle] = useState(() => {
        const saved = localStorage.getItem('cisa_is_shuffle');
        return saved === 'true';
    });

    useEffect(() => {
        localStorage.setItem('cisa_is_shuffle', isShuffle);
    }, [isShuffle]);

    const [interactionQueue, setInteractionQueue] = useState(() => {
        const saved = localStorage.getItem('cisa_interaction_queue');
        if (saved) return JSON.parse(saved);
        return (questionIdsData && questionIdsData.length > 0) ? questionIdsData.map((_, idx) => idx) : [];
    });

    const [tags, setTags] = useState({});

    const [subMode, setSubMode] = useState(() => {
        const saved = localStorage.getItem('cisa_sub_mode');
        // 'null' string checks due to JSON.stringify(null) -> "null"
        if (saved === "null" || !saved) return null;
        // If it was a simple string "present" or "new"
        return saved.replace(/"/g, '');
    });

    const [completionMessage, setCompletionMessage] = useState(null);

    // --- Derived Stats (Context Aware) ---
    // Since 'questionIds' changes based on selected domain, these stats 
    // will automatically reflect the "Global" or "Domain" view.
    const domainStats = useMemo(() => {
        if (!questionIds || questionIds.length === 0) return { total: 0, answered: 0, accuracy: 0, wrong: 0, counts: {} };

        let answered = 0;
        let hard = 0;
        const counts = {
            "Good": 0,
            "Medium": 0,
            "Hard": 0,
            "Doubt": 0,
            "Required learning": 0
        };

        questionIds.forEach(qId => {
            const tag = tags[qId];
            if (tag) {
                answered++;
                if (tag === 'Hard') hard++;
                if (counts[tag] !== undefined) counts[tag]++;
            }
        });

        const accuracy = answered > 0 ? Math.round(((answered - hard) / answered) * 100) : 0;

        return {
            total: questionIds.length,
            answered,
            accuracy,
            wrong: hard,
            counts // Export breakdown
        };
    }, [questionIds, tags]);

    // --- Effects for Persistence ---
    useEffect(() => {
        localStorage.setItem('cisa_question_ids', JSON.stringify(questionIds));
    }, [questionIds]);

    useEffect(() => {
        localStorage.setItem('cisa_current_index', currentIndex.toString());
    }, [currentIndex]);

    useEffect(() => {
        localStorage.setItem('cisa_user_answers', JSON.stringify(userAnswers));
    }, [userAnswers]);

    useEffect(() => {
        localStorage.setItem('cisa_quiz_state', quizState);
    }, [quizState]);

    useEffect(() => {
        localStorage.setItem('cisa_interaction_queue', JSON.stringify(interactionQueue));
    }, [interactionQueue]);

    useEffect(() => {
        localStorage.setItem('cisa_sub_mode', JSON.stringify(subMode));
    }, [subMode]);

    useEffect(() => {
        localStorage.setItem('cisa_stats', JSON.stringify(stats));
    }, [stats]);

    // Firestore Effects
    useEffect(() => {
        if (!user) {
            setTags({});
            setNotes({});
            return;
        }

        const fetchUserStates = async () => {
            try {
                const querySnapshot = await getDocs(collection(db, 'users', user.uid, 'question_states'));
                const newTags = {};
                const newNotes = {};
                querySnapshot.forEach((doc) => {
                    const data = doc.data();
                    if (data.tag) newTags[doc.id] = data.tag;
                    if (data.note) newNotes[doc.id] = data.note;
                });
                setTags(newTags);
                setNotes(newNotes);
            } catch (error) {
                console.error("Error fetching Firestore states:", error);
            }
        };

        fetchUserStates();
    }, [user]);

    const [notes, setNotes] = useState({});

    // --- Actions ---

    // NEW: Function to load questions for a specific domain
    const fetchQuestionsForDomain = useCallback(async (domain) => {
        if (!domain) return [];

        console.log(`Fetching questions for domain: ${domain.name}`);
        try {
            const q = query(
                collection(db, 'questions'),
                where('domain', '==', domain.name)
            );

            const snapshot = await getDocs(q);

            // Map to objects with original_id for sorting
            const data = snapshot.docs.map(d => ({
                id: d.id,
                oid: Number(d.data().original_id) || 0
            }));

            // Sort by original_id ascending
            data.sort((a, b) => a.oid - b.oid);

            const ids = data.map(item => item.id);
            console.log(`Found ${ids.length} questions.`);

            if (ids.length === 0) {
                alert(`No questions found for domain: ${domain.name}`);
                return [];
            }

            // setQuestionIds(ids); // Removed side-effect to avoid race conditions
            return ids;
        } catch (error) {
            console.error("Error fetching questions:", error);
            alert("Error loading questions for this domain.");
            return [];
        }
    }, []);

    const handleSelectDomain = useCallback(async (domain) => {
        if (selectedDomain?.id === domain.id) {
            // Deselect if already selected
            setSelectedDomain(null);
            setQuestionIds(questionIdsData); // Reset to global
            localStorage.removeItem('cisa_last_domain_id');
            // Reset context when returning to global
            setCurrentIndex(0);
            setUserAnswers({});
        } else {
            setSelectedDomain(domain);
            localStorage.setItem('cisa_last_domain_id', domain.id);

            // Clean Wipe of potentially stale session data from previous domain
            setCurrentIndex(0);
            setUserAnswers({});
            setInteractionQueue([]); // Will be rebuilt by 'resume' or 'start fresh'

            // Context Switch: Immediately set the active pool to this domain's questions
            // This enables the "Start Fresh" and "Stats" to work on this subset
            if (domain.questionIds && domain.questionIds.length > 0) {
                setQuestionIds(domain.questionIds);
            } else {
                // Fallback if questionIds weren't synced yet (lazy fetch)
                const ids = await fetchQuestionsForDomain(domain);
                if (ids && ids.length > 0) {
                    setQuestionIds(ids);
                }
            }
        }
    }, [selectedDomain, fetchQuestionsForDomain]);

    const loadQuestions = useCallback((data) => {
        // We use the imported questionIdsData now
        const actualIds = data ? data.map(q => q.id) : questionIdsData;

        // --- FULL RESET ---
        setStats({ correct: 0, wrong: 0, total: 0 });
        setUserAnswers({});
        setTags({});
        setNotes({});
        // Clear persistence
        localStorage.removeItem('cisa_quiz_tags');
        localStorage.removeItem('cisa_quiz_notes');
        // ------------------

        setQuestionIds(actualIds);

        // Default queue: 0 to N-1 (these are indices into questionIds)
        const initialQueue = actualIds.map((_, idx) => idx);
        setInteractionQueue(initialQueue);
        setQuizState('active');
        setCurrentIndex(0);
        setSubMode(null);
    }, []);

    // Effect to fetch current question from cloud when index changes
    useEffect(() => {
        if (quizState === 'upload') return; // Only block if specifically upload. Dashboard needs to load if resuming?
        // actually dashboard shouldn't trigger this unless we are trying to preload.
        // Let's stick to current logic: if dashboard, we usually just show dashboard.
        if (quizState === 'dashboard') return;

        const qIndex = interactionQueue[currentIndex];
        const qId = questionIds[qIndex];

        if (qId === undefined) return;

        const fetchQuestion = async () => {
            setLoadingQuestion(true);
            try {
                const docRef = doc(db, 'questions', String(qId));
                const docSnap = await getDoc(docRef);
                if (docSnap.exists()) {
                    setCurrentQuestion({ id: docSnap.id, ...docSnap.data() });
                } else {
                    console.error("No such question document! ID:", qId);
                    setQuizState('dashboard'); // Automatically go to dashboard if question missing
                }
            } catch (error) {
                console.error("Error fetching question:", error);
                setQuizState('dashboard'); // Fallback on error
            } finally {
                setLoadingQuestion(false);
            }
        };

        fetchQuestion();
    }, [currentIndex, interactionQueue, questionIds, quizState]);

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
        // Find indices where tag is 'Hard'
        const hardIndices = questionIds
            .map((id, idx) => tags[id] === 'Hard' ? idx : -1)
            .filter(idx => idx !== -1);

        if (hardIndices.length === 0) {
            alert("No 'Hard' questions to review!");
            return;
        }

        // --- FRESH REVIEW: Clear answers for these questions ---
        setUserAnswers(prev => {
            const next = { ...prev };
            hardIndices.forEach(idx => delete next[questionIds[idx]]);
            return next;
        });
        // -----------------------------------------------------

        setInteractionQueue(hardIndices);
        setQuizState('review');
        setSubMode(null); // Ensure we are not in 'present' mode from prior interactions
        setCurrentIndex(0);
        setIsShuffle(false);
    }, [questionIds, tags]);

    const reviewTag = useCallback((tagName, mode = 'present', shuffle = false) => {
        let tagIndices = questionIds
            .map((id, idx) => tags[id] === tagName ? idx : -1)
            .filter(idx => idx !== -1);

        if (tagIndices.length === 0) {
            alert(`No questions found with tag: ${tagName} `);
            return;
        }

        if (mode === 'new') {
            // Clear answers for these specific questions
            setUserAnswers(prev => {
                const newAnswers = { ...prev };
                tagIndices.forEach(idx => {
                    delete newAnswers[questionIds[idx]];
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
    }, [questionIds, tags]);

    const handleAddTag = useCallback(async (questionId, tagName) => {
        setTags(prev => ({
            ...prev,
            [questionId]: tagName
        }));

        if (user) {
            try {
                await setDoc(doc(db, 'users', user.uid, 'question_states', String(questionId)), {
                    tag: tagName
                }, { merge: true });
            } catch (error) {
                console.error("Error saving tag to Firestore:", error);
            }
        }
    }, [user]);

    const submitAnswer = useCallback((selectedOption) => {
        if (quizState !== 'active' && quizState !== 'review') return;

        if (!currentQuestion) return;

        const isCorrect = selectedOption === currentQuestion.correct_answer;

        // Auto-tagging system
        const existingTag = tags[currentQuestion.id];
        if (isCorrect) {
            // If correct and no tag, set to "Good"
            if (!existingTag) {
                handleAddTag(currentQuestion.id, "Good");
            }
        } else {
            // If wrong, set to "Hard" ONLY if no tag exists
            if (!existingTag) {
                handleAddTag(currentQuestion.id, "Hard");
            }
        }

        setStats(prev => ({
            ...prev,
            total: prev.total + 1,
            correct: prev.correct + (isCorrect ? 1 : 0),
            wrong: prev.wrong + (isCorrect ? 0 : 1)
        }));

        setUserAnswers(prev => ({
            ...prev,
            [currentQuestion.id]: selectedOption
        }));
    }, [currentQuestion, quizState, tags, handleAddTag]);

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
        setQuizState('dashboard'); // Changed from 'upload'
        // setQuestionIds([]); // Don't clear IDs as we rely on static data now
        // setCurrentQuestion(null);
        setInteractionQueue([]);
        setCurrentIndex(0);
        setUserAnswers({});
        setTags({});
        setNotes({});
        setSubMode(null);

        // Clear all persistence
        localStorage.removeItem('cisa_user_answers');
        localStorage.removeItem('cisa_current_index');
        localStorage.removeItem('cisa_quiz_state');
        localStorage.removeItem('cisa_interaction_queue');
        localStorage.removeItem('cisa_sub_mode');
        // localStorage.removeItem('cisa_question_ids'); // Keep IDs

        // Re-init queue
        const initialQueue = questionIds.map((_, idx) => idx);
        setInteractionQueue(initialQueue);
    }, [questionIds]);

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

        // Always rebuild from the FULL current list (which is already context-switched)
        // This ensures we are working with the Selected Domain's IDs
        let currentQueue = questionIds.map((_, i) => i);

        // Filter queue to ONLY unanswered questions
        // Rely on TAGS as the source of truth for "Answered" (persistent)
        const remainingQueue = currentQueue.filter(qIndex => {
            const qId = questionIds[qIndex];
            const isTagged = tags[qId] !== undefined;
            return !isTagged;
        });

        if (remainingQueue.length === 0) {
            alert("All questions are answered for this section!");
            setQuizState('dashboard');
            return;
        }

        setInteractionQueue(remainingQueue);

        // CRITICAL: Reset index to 0 because we created a NEW queue of remaining items.
        // We are not "resuming index 50 of the huge list", we are "starting at item 0 of the remaining list".
        setCurrentIndex(0);

        // Force reload of question content to ensure UI updates
        setCurrentQuestion(null);

        // Clear "Session" answers. 
        // "Resume" means "Start a New Session for the REMAINING questions".
        // Any previous session answers are either:
        // 1. Saved in 'tags' (and thus excluded from this queue)
        // 2. Abandoned/Stale (so we should wipe them to prevent "Already Answered" glitches)
        setUserAnswers({});
    }, [questionIds, tags]);

    const startFreshQuiz = useCallback(async () => {
        let currentIds = questionIds;

        if (selectedDomain) {
            // Ensure we have specific questions for this domain
            // fetchQuestionsForDomain returns the new array of IDs
            const fetchedIds = await fetchQuestionsForDomain(selectedDomain);
            if (fetchedIds && fetchedIds.length > 0) {
                currentIds = fetchedIds;
                setQuestionIds(currentIds);
            }
        }

        if (!currentIds || currentIds.length === 0) {
            alert("No questions found.");
            return;
        }

        // --- ATOMIC ACTION: START QUIZ ---
        localStorage.removeItem('cisa_user_answers'); // Force clear persistence immediately
        localStorage.removeItem('cisa_sub_mode');     // Force clear submode persistence
        localStorage.removeItem('cisa_current_index'); // Force clear any stale index

        setUserAnswers({});
        setSubMode(null);
        setStats({ correct: 0, wrong: 0, total: 0 });
        setQuizState('active');
        setCurrentIndex(0);
        setQuestionIds(currentIds);

        let fullQueue = currentIds.map((_, i) => i);

        if (isShuffle) {
            // Fisher-Yates shuffle
            for (let i = fullQueue.length - 1; i > 0; i--) {
                const j = Math.floor(Math.random() * (i + 1));
                [fullQueue[i], fullQueue[j]] = [fullQueue[j], fullQueue[i]];
            }
        }

        setInteractionQueue(fullQueue);
    }, [questionIds, selectedDomain, fetchQuestionsForDomain, isShuffle]);

    const exitToDashboard = useCallback(() => {
        setQuizState('dashboard');
    }, []);


    const updateNote = useCallback(async (questionId, noteContent) => {
        setNotes(prev => ({
            ...prev,
            [questionId]: noteContent
        }));

        if (user) {
            try {
                await setDoc(doc(db, 'users', user.uid, 'question_states', String(questionId)), {
                    note: noteContent
                }, { merge: true });
            } catch (error) {
                console.error("Error saving note to Firestore:", error);
            }
        }
    }, [user]);

    const answeredCount = tags ? Object.keys(tags).length : 0;

    return {
        questionIds,
        currentIndex,
        currentQuestion,
        loadingQuestion,
        // In Active mode, we want to show Global Total (questionIds.length) if we want "9 / 164"
        // But interactionQueue.length is the session length.
        // We will let the UI handle the "Progress" display logic using 'answeredCount'.
        // For now, keep totalQuestions as queue length for safety in strict modes.
        totalQuestions: interactionQueue.length,
        globalTotalQuestions: questionIds.length, // Export Global Total
        answeredCount, // Export Global Answered Count

        userAnswers,
        quizState,
        stats,
        // wrongQuestionIds, // Removed
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
        completionMessage, // Export completion message state

        // Domain Exports
        availableDomains,
        selectedDomain,
        selectDomain: handleSelectDomain,
        domainError,
        refreshDomains: fetchDomains,
        domainStats
    };
};
