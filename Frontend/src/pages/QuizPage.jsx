import React, { useEffect, useState, useMemo } from 'react';
import { ArrowRight, CheckCircle, XCircle, FileQuestion, Menu, Tags, Eye, EyeOff, NotebookPen, Maximize2, Minimize2, X, FileSearch, Bold, Italic, List, Heading, Underline, Palette, Type } from 'lucide-react';
import clsx from 'clsx';
import { twMerge } from 'tailwind-merge';
import confetti from 'canvas-confetti';
import { TagBucket } from '../components/TagBucket';
// ReactQuill temporarily removed due to React 19 compatibility
// import ReactQuill from 'react-quill';
// import 'react-quill/dist/quill.snow.css'; 

export const QuizPage = ({
    question,
    currentIndex,
    totalQuestions,
    onAnswer,
    onNext,
    userAnswer,
    tags,
    onAddTag,
    onExit,
    subMode,
    completionMessage,
    notes,
    onUpdateNote
}) => {
    // --- Animations & Effects ---
    const [shake, setShake] = useState(false);
    const [areTagsVisible, setAreTagsVisible] = useState(false);

    // Tags list for shortcut mapping
    const tagList = useMemo(() => [
        "Good",
        "Medium",
        "Hard",
        "Doubt",
        "Required learning"
    ], []);

    // Calculate tag counts dynamically
    const tagCounts = useMemo(() => {
        const counts = {};
        tagList.forEach(t => counts[t] = 0);

        if (tags) {
            Object.values(tags).forEach(tag => {
                if (counts[tag] !== undefined) {
                    counts[tag]++;
                }
            });
        }
        return counts;
    }, [tags, tagList]);

    // Tag Color Mapping
    const tagColors = {
        "Good": "green",
        "Medium": "yellow",
        "Hard": "red",
        "Doubt": "orange",
        "Required learning": "blue"
    };

    const isAnswered = !!userAnswer || subMode === 'present';
    const isCorrect = userAnswer === question.correct_answer;
    const isPresentMode = subMode === 'present';

    // --- Research Notes State ---
    const [isNoteOpen, setIsNoteOpen] = useState(false);
    const [currentNote, setCurrentNote] = useState('');
    const [isNoteFullScreen, setIsNoteFullScreen] = useState(false);

    useEffect(() => {
        // Reset/Sync note when question changes
        setCurrentNote(notes?.[question.id] || '');
        setIsNoteOpen(false);
        setIsNoteFullScreen(false);
    }, [question.id, notes]);

    const handleSaveNote = () => {
        onUpdateNote(question.id, currentNote);
        setIsNoteOpen(false);
        setIsNoteFullScreen(false);
    };

    // --- ContentEditable Ref ---
    const editorRef = React.useRef(null);
    const editorRefFs = React.useRef(null);

    // Sync Ref content when question/note changes (initial load or nav)
    useEffect(() => {
        if (editorRef.current) {
            if (editorRef.current.innerHTML !== currentNote) {
                editorRef.current.innerHTML = currentNote || '';
            }
        }
        if (editorRefFs.current) {
            if (editorRefFs.current.innerHTML !== currentNote) {
                editorRefFs.current.innerHTML = currentNote || '';
            }
        }
    }, [question.id, isNoteOpen, isNoteFullScreen]);
    // minimal deps to ensure data is there when it opens

    // --- ContentEditable Helper ---
    const execCmd = (command, value = null) => {
        document.execCommand(command, false, value);
        syncContent();
        // Ensure focus remains on the active editor
        const activeEditor = isNoteFullScreen ? editorRefFs.current : editorRef.current;
        if (activeEditor) activeEditor.focus();
    };

    const syncContent = () => {
        const activeEditor = isNoteFullScreen ? editorRefFs.current : editorRef.current;
        if (activeEditor) {
            setCurrentNote(activeEditor.innerHTML);
        }
    };

    // Prevent losing focus when clicking toolbar buttons
    const handleToolbarAction = (e, command, value = null) => {
        e.preventDefault();
        execCmd(command, value);
    };

    // --- Keyboard Shortcuts ---
    useEffect(() => {
        const handleKeyDown = (e) => {
            const key = e.key.toUpperCase();

            // Ignore shortcuts if typing in note, except Escape to close
            const activeTag = document.activeElement.tagName;
            const isEditor = activeTag === 'TEXTAREA' || activeTag === 'INPUT' || (activeTag === 'DIV' && document.activeElement.isContentEditable);

            if (isEditor) {
                if (key === 'ESCAPE') {
                    setIsNoteOpen(false);
                    setIsNoteFullScreen(false);
                    // Quill editor might keep focus, need to blur explicitly if possible, 
                    // but often just closing state is enough.
                    if (document.activeElement && document.activeElement.blur) {
                        document.activeElement.blur();
                    }
                }
                return;
            }

            // 'R' to toggle Note
            if (key === 'R') {
                e.preventDefault();
                setIsNoteOpen(prev => !prev);
                return;
            }

            // Numbers 1-5 for tagging
            if (e.key >= '1' && e.key <= '5') {
                const index = parseInt(e.key) - 1;
                const tagName = tagList[index];
                if (tagName) {
                    onAddTag(question.id, tagName);
                }
            }

            // Letters A-D for answer selection (only if not answered)
            if (!isAnswered && ['A', 'B', 'C', 'D'].includes(key)) {
                onAnswer(key);
            }

            // Space for Next Question (only if answered)
            if (e.code === 'Space' && isAnswered) {
                e.preventDefault(); // Prevent page jump
                onNext();
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [question.id, onAddTag, onNext, onAnswer, isAnswered, tagList]);

    if (!question) return <div>Loading...</div>;

    const hasNote = !!notes?.[question.id];

    return (
        <div className="flex flex-col h-screen overflow-hidden relative bg-gray-50/50">

            {/* --- Completion Overlay --- */}
            {completionMessage && (
                <div className="absolute inset-0 z-[100] bg-black/60 backdrop-blur-sm flex items-center justify-center animate-in fade-in duration-300">
                    <div className="bg-white p-8 rounded-3xl shadow-2xl max-w-md w-full text-center border border-white/20 transform scale-100 animate-in zoom-in-95 duration-300">
                        <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6 text-green-600 animate-bounce">
                            <CheckCircle size={32} strokeWidth={3} />
                        </div>
                        <h2 className="text-2xl font-black text-gray-800 mb-2">{completionMessage}</h2>
                        <p className="text-gray-500 font-medium">Please wait...</p>
                    </div>
                </div>
            )}

            {/* --- Consolidated Header --- */}
            <div className="flex-none bg-white border-b border-gray-200 shadow-sm z-30 relative">
                <div className="w-full px-6 py-3 flex items-center justify-between">

                    {/* Left: Branding & Main Menu */}
                    <div className="flex items-center gap-6">
                        <div className="flex items-center gap-2 text-blue-700 font-bold text-xl select-none">
                            <div className="bg-blue-100 p-1.5 rounded-lg">
                                <FileQuestion size={20} />
                            </div>
                            <span className="tracking-tight">CISA Master</span>
                        </div>
                        <div className="h-6 w-px bg-gray-200"></div>
                        <button
                            onClick={onExit}
                            className="flex items-center gap-2 text-sm font-semibold text-gray-500 hover:text-blue-600 transition-colors uppercase tracking-wide"
                        >
                            <Menu size={16} /> Main Menu
                        </button>
                    </div>

                    {/* Center: Progress Bar & Counter */}
                    <div className="flex-1 max-w-2xl mx-12 flex flex-col gap-1">
                        <div className="flex justify-between text-xs font-bold text-gray-400 uppercase tracking-widest">
                            <span>Progress</span>
                            <span>{currentIndex + 1} / {totalQuestions}</span>
                        </div>
                        <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                            <div
                                className="h-full bg-blue-600 rounded-full transition-all duration-500 ease-out shadow-[0_0_10px_rgba(37,99,235,0.3)]"
                                style={{ width: `${((currentIndex + 1) / totalQuestions) * 100}%` }}
                            ></div>
                        </div>
                    </div>

                    {/* Right Space & Tag Toggle */}
                    <div className="min-w-[140px] flex justify-end">
                        <div className="relative">
                            <button
                                onClick={() => setAreTagsVisible(prev => !prev)}
                                className={clsx(
                                    "flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-bold transition-all border w-36 justify-center",
                                    areTagsVisible
                                        ? "bg-blue-50 text-blue-600 border-blue-200"
                                        : "bg-gray-50 text-gray-500 border-gray-200 hover:bg-gray-100"
                                )}
                            >
                                {areTagsVisible ? <EyeOff size={16} /> : <Eye size={16} />}
                                {areTagsVisible ? "Hide Tags" : "Show Tags"}
                            </button>

                            {/* --- Vertical Tag Buckets (Centered Under Button) --- */}
                            {areTagsVisible && (
                                <div className="absolute top-full mt-4 left-1/2 -translate-x-1/2 flex flex-col gap-3 z-50 animate-in slide-in-from-top-2 fade-in duration-300 p-2 bg-white/50 backdrop-blur-sm rounded-2xl border border-gray-200 shadow-lg">
                                    {tagList.map((tag, idx) => (
                                        <TagBucket
                                            key={tag}
                                            tag={tag}
                                            count={tagCounts[tag]}
                                            color={tagColors[tag] || 'gray'}
                                            onClick={(t) => onAddTag(question.id, t)}
                                            isSelected={tags?.[question.id] === tag}
                                            shortcut={idx + 1}
                                        />
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* --- Main Content Area --- */}
            <div className="flex-1 flex items-stretch gap-6 overflow-hidden w-full relative px-6 py-4 min-h-0">

                {/* LEFT COLUMN: Why Incorrect */}
                <div className={clsx(
                    "w-[18%] flex flex-col p-6 bg-red-50/40 rounded-3xl shadow-sm border border-red-100/50 transition-all duration-500 ease-in-out self-center max-h-[85vh] overflow-hidden",
                    (isAnswered && !isCorrect) || isPresentMode ? "opacity-100 translate-x-0" : "opacity-0 -translate-x-full absolute left-0 h-full pointer-events-none"
                )}>
                    {((isAnswered && !isCorrect) || isPresentMode) && (
                        <div className="flex flex-col h-full animate-in slide-in-from-left-4 fade-in duration-500">
                            <h3 className="text-red-700 font-extrabold flex-none flex items-center gap-2 text-xl uppercase tracking-widest mb-6">
                                <XCircle className="w-4 h-4" /> Why others are wrong
                            </h3>
                            <div className="flex-1 overflow-y-auto no-scrollbar space-y-6">
                                {Object.entries(question.options).map(([key]) => {
                                    if (key === question.correct_answer) return null;
                                    return (
                                        <div key={key} className="text-xl">
                                            <span className="font-bold text-red-600 block mb-1">Option {key}</span>
                                            <span className="text-slate-600 leading-snug">{question.explanations?.[key]}</span>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    )}
                </div>

                {/* CENTER COLUMN: Question & Options */}
                <div className="flex-1 flex flex-col min-w-0 bg-white/20 backdrop-blur-sm rounded-3xl p-4 h-full relative">
                    <div className="flex-1 flex flex-col min-h-0 max-w-5xl mx-auto w-full">

                        {/* Fixed Question Text with Note Button */}
                        <div className={clsx(
                            "flex-none bg-white rounded-3xl shadow-sm border border-gray-100 p-8 pr-6 mb-6 transition-all duration-300 relative group/question overflow-hidden",
                            shake ? "animate-shake ring-4 ring-red-100" : ""
                        )}>
                            {/* Vertical Research Tab */}
                            <button
                                onClick={() => setIsNoteOpen(prev => !prev)}
                                className={clsx(
                                    "absolute right-0 top-0 bottom-0 w-4 transition-all group/tab cursor-pointer border-l",
                                    hasNote
                                        ? "bg-gradient-to-b from-indigo-500 to-purple-600 border-white/10 hover:w-5 shadow-sm"
                                        : "bg-slate-300 border-slate-400/30 hover:bg-slate-400/40 hover:w-5"
                                )}
                                title="Research Notes (R)"
                            >
                            </button>

                            <div className="flex justify-between items-start gap-4">
                                <h2 className="text-xl md:text-xl font-bold text-slate-700 leading-normal tracking-tight flex-1">
                                    {question.question}
                                </h2>
                            </div>

                            {/* Inline Note Editor (Textarea) */}
                            {isNoteOpen && !isNoteFullScreen && (
                                <div className="mt-6 p-1 bg-white rounded-2xl border-2 border-indigo-100/50 shadow-xl animate-in slide-in-from-top-4 fade-in duration-300 relative ring-4 ring-indigo-50/50">
                                    <div className="flex justify-between items-center px-4 py-2 border-b border-gray-100 bg-gray-50/50 rounded-t-xl">
                                        <h4 className="text-xs font-extra-bold text-gray-500 uppercase tracking-widest flex items-center gap-2">
                                            <FileSearch size={14} className="text-indigo-500" /> Research Notes
                                        </h4>
                                        <button
                                            onClick={() => setIsNoteFullScreen(true)}
                                            className="p-1.5 hover:bg-indigo-100 rounded-lg text-indigo-600 transition-colors"
                                            title="Full Screen Preview"
                                        >
                                            <Maximize2 size={16} />
                                        </button>
                                    </div>

                                    <div className="bg-white p-2">
                                        {/* Toolbar */}
                                        <div className="flex flex-wrap items-center gap-1 mb-2 border-b border-gray-100 pb-2">
                                            <button onMouseDown={(e) => handleToolbarAction(e, 'bold')} className="p-1.5 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors" title="Bold (Ctrl+B)"><Bold size={16} /></button>
                                            <button onMouseDown={(e) => handleToolbarAction(e, 'italic')} className="p-1.5 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors" title="Italic (Ctrl+I)"><Italic size={16} /></button>
                                            <button onMouseDown={(e) => handleToolbarAction(e, 'underline')} className="p-1.5 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors" title="Underline (Ctrl+U)"><Underline size={16} /></button>
                                            <div className="w-px h-4 bg-gray-200 mx-1"></div>
                                            <button onMouseDown={(e) => handleToolbarAction(e, 'insertUnorderedList')} className="p-1.5 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors" title="List"><List size={16} /></button>
                                            <div className="w-px h-4 bg-gray-200 mx-1"></div>

                                            {/* Font Size */}
                                            <div className="flex items-center gap-1 mr-2">
                                                <Type size={14} className="text-gray-400" />
                                                <select
                                                    onChange={(e) => execCmd('fontSize', e.target.value)}
                                                    className="w-12 text-xs border border-gray-200 rounded p-0.5 text-gray-600 focus:outline-none focus:border-indigo-300"
                                                    defaultValue="3"
                                                >
                                                    <option value="1">XS</option>
                                                    <option value="2">S</option>
                                                    <option value="3">N</option>
                                                    <option value="4">L</option>
                                                    <option value="5">XL</option>
                                                    <option value="6">2XL</option>
                                                    <option value="7">3XL</option>
                                                </select>
                                            </div>

                                            {/* Color Picker */}
                                            <div className="relative flex items-center group">
                                                <label htmlFor="color-picker" className="p-1.5 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors cursor-pointer flex items-center gap-1">
                                                    <Palette size={16} />
                                                    <input
                                                        id="color-picker"
                                                        type="color"
                                                        onChange={(e) => execCmd('foreColor', e.target.value)}
                                                        className="w-4 h-4 p-0 border-0 overflow-hidden rounded-full cursor-pointer bg-transparent"
                                                        title="Text Color"
                                                    />
                                                </label>
                                            </div>
                                        </div>

                                        <div
                                            ref={editorRef}
                                            id="note-editor" // Keep ID for potential CSS reference or legacy
                                            contentEditable
                                            onInput={syncContent}
                                            className="w-full min-h-[150px] p-2 text-base text-gray-700 bg-transparent outline-none overflow-y-auto max-h-[300px] empty:before:content-[attr(placeholder)] empty:before:text-gray-300"
                                            placeholder="Write your research notes here..."
                                            onKeyDown={(e) => {
                                                if (e.key === ' ' && e.stopPropagation) e.stopPropagation();
                                            }}
                                        />
                                    </div>

                                    <div className="flex justify-end gap-3 p-3 border-t border-gray-100 bg-gray-50/30 rounded-b-xl">
                                        <button
                                            onClick={() => setIsNoteOpen(false)}
                                            className="px-4 py-2 text-xs font-bold text-gray-500 hover:text-gray-700 hover:bg-gray-200/50 rounded-xl transition-colors"
                                        >
                                            Close
                                        </button>
                                        <button
                                            onClick={handleSaveNote}
                                            className="px-6 py-2 text-xs font-bold text-white bg-indigo-500 hover:bg-indigo-600 rounded-xl shadow-lg shadow-indigo-200/50 hover:shadow-xl hover:-translate-y-0.5 transition-all flex items-center gap-2"
                                        >
                                            Save Research
                                        </button>
                                    </div>
                                </div>
                            )}

                            {/* Full Screen Note Modal (Textarea) */}
                            {isNoteFullScreen && (
                                <div className="fixed inset-0 z-[110] bg-slate-900/40 backdrop-blur-md flex items-center justify-center p-4 md:p-8 animate-in fade-in duration-300">
                                    <div className="bg-white w-full max-w-5xl h-[85vh] rounded-[2rem] shadow-2xl flex flex-col overflow-hidden animate-in zoom-in-95 duration-300 border border-white/20 ring-1 ring-black/5">
                                        <div className="flex-none px-8 py-5 border-b border-gray-100 flex items-center justify-between bg-gradient-to-r from-gray-50 to-white">
                                            <div className="flex items-center gap-4">
                                                <div className="p-3 bg-amber-100 rounded-2xl text-amber-600 shadow-inner">
                                                    <FileSearch size={24} />
                                                </div>
                                                <div>
                                                    <h3 className="text-xl font-black text-gray-800 tracking-tight">Research Notes</h3>
                                                    <p className="text-xs font-medium text-gray-400 uppercase tracking-widest">Full Screen Editor</p>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <button
                                                    onClick={() => setIsNoteFullScreen(false)}
                                                    className="p-3 hover:bg-gray-100 rounded-full text-gray-500 transition-colors"
                                                    title="Exit Full Screen"
                                                >
                                                    <Minimize2 size={20} />
                                                </button>
                                                <button
                                                    onClick={() => { setIsNoteFullScreen(false); setIsNoteOpen(false); }}
                                                    className="p-3 hover:bg-red-50 hover:text-red-500 rounded-full text-gray-400 transition-colors"
                                                    title="Close"
                                                >
                                                    <X size={20} />
                                                </button>
                                            </div>
                                        </div>

                                        <div className="flex-1 p-0 overflow-hidden relative bg-white flex flex-col">
                                            {/* Full Screen Toolbar */}
                                            <div className="flex-none px-8 py-3 border-b border-gray-100 flex items-center gap-2 bg-gray-50/30">
                                                <button onMouseDown={(e) => handleToolbarAction(e, 'bold')} className="p-2 text-gray-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors" title="Bold"><Bold size={20} /></button>
                                                <button onMouseDown={(e) => handleToolbarAction(e, 'italic')} className="p-2 text-gray-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors" title="Italic"><Italic size={20} /></button>
                                                <button onMouseDown={(e) => handleToolbarAction(e, 'underline')} className="p-2 text-gray-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors" title="Underline"><Underline size={20} /></button>
                                                <div className="w-px h-6 bg-gray-200 mx-2"></div>
                                                <button onMouseDown={(e) => handleToolbarAction(e, 'insertUnorderedList')} className="p-2 text-gray-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors" title="List"><List size={20} /></button>
                                                <div className="w-px h-6 bg-gray-200 mx-2"></div>

                                                {/* Font Size */}
                                                <div className="flex items-center gap-2 mr-2 border-r border-gray-200 pr-4">
                                                    <Type size={18} className="text-gray-400" />
                                                    <select
                                                        onChange={(e) => execCmd('fontSize', e.target.value)}
                                                        className="w-16 border border-gray-200 rounded p-1 text-gray-600 focus:outline-none focus:border-indigo-300"
                                                        defaultValue="3"
                                                    >
                                                        <option value="1">Small</option>
                                                        <option value="2">Normal</option>
                                                        <option value="3">Medium</option>
                                                        <option value="4">Large</option>
                                                        <option value="5">X-Large</option>
                                                        <option value="6">2X-Large</option>
                                                        <option value="7">3X-Large</option>
                                                    </select>
                                                </div>

                                                {/* Color Picker */}
                                                <div className="relative flex items-center">
                                                    <label className="flex items-center gap-2 p-2 hover:bg-gray-100 rounded-lg cursor-pointer">
                                                        <Palette size={20} className="text-gray-500" />
                                                        <span className="text-sm font-medium text-gray-600">Color</span>
                                                        <input
                                                            type="color"
                                                            onChange={(e) => execCmd('foreColor', e.target.value)}
                                                            className="w-6 h-6 p-0 border-0 rounded overflow-hidden cursor-pointer"
                                                        />
                                                    </label>
                                                </div>
                                            </div>

                                            <div
                                                ref={editorRefFs}
                                                id="note-editor-fs"
                                                contentEditable
                                                onInput={syncContent}
                                                className="w-full h-full p-8 text-lg leading-relaxed text-gray-700 bg-transparent outline-none overflow-y-auto empty:before:content-[attr(placeholder)] empty:before:text-gray-300"
                                                placeholder="Document your findings..."
                                                onKeyDown={(e) => {
                                                    if (e.key === ' ' && e.stopPropagation) e.stopPropagation();
                                                }}
                                            />
                                        </div>

                                        <div className="flex-none px-8 py-5 border-t border-gray-100 bg-gray-50/50 flex justify-end gap-4">
                                            <button
                                                onClick={() => setIsNoteFullScreen(false)}
                                                className="px-6 py-3 text-sm font-bold text-gray-500 hover:text-gray-700 hover:bg-gray-200/50 rounded-2xl transition-all"
                                            >
                                                Exit Full Screen
                                            </button>
                                            <button
                                                onClick={handleSaveNote}
                                                className="px-10 py-3 text-sm font-bold text-white bg-gray-900 hover:bg-black rounded-2xl shadow-xl hover:shadow-2xl hover:-translate-y-1 transition-all flex items-center gap-3"
                                            >
                                                <FileSearch size={18} /> Save & Close
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            )}

                        </div>

                        {/* Scrollable Options List */}
                        <div className="flex-1 overflow-y-auto no-scrollbar space-y-4 px-6 py-4">
                            {Object.entries(question.options).map(([key, text]) => {
                                const isSelected = userAnswer === key;
                                const isCorrectTarget = question.correct_answer === key;

                                let styleClass = "bg-white border-gray-200 hover:border-blue-400 hover:bg-blue-50/30 hover:shadow-md";
                                let iconClass = "bg-gray-100 text-gray-500 group-hover:bg-blue-100 group-hover:text-blue-600";
                                let textClass = "text-gray-700";

                                if (isAnswered) {
                                    if (isCorrectTarget) {
                                        styleClass = "bg-green-50 border-green-500 ring-1 ring-green-500 shadow-lg z-10 scale-[1.02]";
                                        iconClass = "bg-green-600 text-white";
                                        textClass = "text-green-900 font-semibold";
                                    } else if (isSelected || (isPresentMode && userAnswer === key)) {
                                        styleClass = "bg-red-50 border-red-400 opacity-90";
                                        iconClass = "bg-red-100 text-red-600";
                                        textClass = "text-red-900";
                                    } else {
                                        styleClass = "opacity-50 grayscale border-gray-100";
                                    }
                                }

                                return (
                                    <button
                                        key={key}
                                        onClick={() => !isAnswered && onAnswer(key)}
                                        disabled={isAnswered}
                                        className={twMerge(
                                            "relative text-left p-5 rounded-xl border-2 transition-all duration-200 flex items-center gap-5 group outline-none w-full",
                                            styleClass
                                        )}
                                    >
                                        <div className={clsx(
                                            "flex-shrink-0 w-12 h-12 flex items-center justify-center rounded-lg font-bold text-xl transition-colors relative",
                                            iconClass
                                        )}>
                                            {key}
                                            {!isAnswered && (
                                                <span className="absolute -top-2 -left-2 text-[10px] bg-gray-100 text-gray-400 px-1 rounded border border-gray-200">
                                                    {key}
                                                </span>
                                            )}
                                        </div>
                                        <span className={clsx("font-medium text-xl leading-relaxed", textClass)}>
                                            {text}
                                        </span>
                                    </button>
                                );
                            })}
                        </div>

                        {/* Centered Next Button Container */}
                        <div className="flex-none h-20 flex items-center justify-center mt-4">
                            {isAnswered && (
                                <button
                                    onClick={onNext}
                                    className="bg-gray-900 hover:bg-black text-white px-12 py-4 rounded-full font-bold text-lg shadow-xl hover:shadow-2xl hover:-translate-y-1 transition-all flex items-center gap-3 animate-in fade-in slide-in-from-bottom-4 duration-500"
                                >
                                    Next Question <ArrowRight size={20} /> <span className="text-xs opacity-50 ml-2">[Space]</span>
                                </button>
                            )}
                        </div>
                    </div>
                </div>

                {/* RIGHT COLUMN: Correct Analysis */}
                <div className={clsx(
                    "w-[18%] flex flex-col p-6 bg-green-50/40 rounded-3xl shadow-sm border border-green-100/50 transition-all duration-500 ease-in-out self-center max-h-[85vh] overflow-hidden",
                    (isAnswered && !isCorrect) || isPresentMode ? "opacity-100 translate-x-0" : "opacity-0 translate-x-full absolute right-0 h-full pointer-events-none"
                )}>
                    {((isAnswered && !isCorrect) || isPresentMode) && (
                        <div className="flex flex-col h-full animate-in slide-in-from-right-4 fade-in duration-500">
                            <h3 className="text-green-700 font-extrabold flex-none flex items-center gap-2 text-xl uppercase tracking-widest mb-6">
                                <CheckCircle className="w-4 h-4" /> Correct Analysis
                            </h3>
                            <div className="flex-1 overflow-y-auto no-scrollbar mb-6">
                                <p className="text-slate-700 leading-relaxed font-medium text-xl">
                                    {question.explanations[question.correct_answer]}
                                </p>
                            </div>
                            <div className="flex-none p-4 bg-green-100/50 rounded-2xl text-xs text-green-800 font-bold text-center border border-green-200 uppercase tracking-widest">
                                Key Takeaway
                            </div>
                        </div>
                    )}
                </div>

            </div>
        </div>
    );
};
