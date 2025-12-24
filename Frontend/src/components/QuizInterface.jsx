import React, { useEffect, useState } from 'react';
import { ArrowRight, CheckCircle, XCircle } from 'lucide-react';
import clsx from 'clsx';
import { twMerge } from 'tailwind-merge';
import confetti from 'canvas-confetti';

export const QuizInterface = ({
    question,
    currentIndex,
    totalQuestions,
    onAnswer,
    onNext,
    userAnswer,
    tags,
    onAddTag
}) => {
    // --- Animations & Effects ---
    const [shake, setShake] = useState(false);

    useEffect(() => {
        if (userAnswer) {
            const isCorrect = userAnswer === question.correct_answer;
            if (isCorrect) {
                // Celebration
                confetti({
                    particleCount: 100,
                    spread: 70,
                    origin: { y: 0.6 }
                });
            } else {
                // Shake effect for wrong answer
                setShake(true);
                setTimeout(() => setShake(false), 500);
            }
        }
    }, [userAnswer, question.correct_answer]);

    if (!question) return <div>Loading...</div>;

    const isAnswered = !!userAnswer;
    const isCorrect = userAnswer === question.correct_answer;

    return (
        <div className="flex flex-col h-screen overflow-hidden relative">

            {/* Header / Progress - Fixed Top */}
            <div className="flex-none p-4 pb-2 z-10 bg-white/50 backdrop-blur-sm border-b border-gray-100">
                <div className="max-w-[1920px] mx-auto w-full flex justify-between items-center px-6">
                    <span className="text-sm font-semibold text-gray-600 bg-white/80 px-4 py-1.5 rounded-full shadow-sm border border-gray-100">
                        Question {currentIndex + 1} / {totalQuestions}
                    </span>
                    <div className="w-1/3 h-2.5 bg-gray-200/50 rounded-full overflow-hidden">
                        <div
                            className="h-full bg-blue-600 rounded-full transition-all duration-500 ease-out"
                            style={{ width: `${((currentIndex + 1) / totalQuestions) * 100}%` }}
                        ></div>
                    </div>
                </div>
            </div>

            {/* Main Content - Flex Row - No Scroll if fits */}
            <div className="flex-grow flex items-start overflow-hidden pt-6 pb-4 px-6 gap-8 max-w-[1920px] mx-auto w-full z-10 relative">

                {/* LEFT COLUMN: Wrong Explanations (Allows scrolling if content is huge) */}
                <div className={clsx(
                    "w-[15%] h-full flex flex-col justify-center transition-all duration-500",
                    isAnswered && !isCorrect ? "opacity-100 translate-x-0" : "opacity-0 -translate-x-10 pointer-events-none"
                )}>
                    {isAnswered && !isCorrect && (
                        <div className="bg-red-50/90 backdrop-blur-md border border-red-100 p-4 rounded-2xl shadow-xl max-h-full overflow-y-auto custom-scrollbar">
                            <h3 className="text-red-800 font-bold mb-3 flex items-center gap-2 text-sm uppercase tracking-wide">
                                <XCircle className="w-4 h-4" /> Why others are incorrect
                            </h3>
                            <div className="space-y-3">
                                {Object.entries(question.options).map(([key, text]) => {
                                    if (key === question.correct_answer) return null; // Skip correct
                                    return (
                                        <div key={key} className="text-xs">
                                            <span className="font-bold text-red-700 block mb-1">Option {key}:</span>
                                            <span className="text-gray-700 leading-snug">{question.explanations?.[key]}</span>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    )}
                </div>

                {/* CENTER COLUMN: Question Card & Options (Separate Containers) */}
                <div className="w-[70%] h-full flex flex-col gap-6 overflow-y-auto custom-scrollbar px-2">

                    {/* 1. Question Card Container */}
                    <div className={clsx(
                        "bg-white/95 backdrop-blur-xl rounded-2xl shadow-xl border border-white/60 p-8 flex flex-col gap-6 transition-all duration-300 transform",
                        shake ? "animate-shake ring-4 ring-red-200" : "hover:shadow-2xl"
                    )}>
                        {/* Tagging - Top Row */}
                        <div className="flex flex-wrap gap-2 justify-center pb-2">
                            {["Complex", "Great", "Not understand", "Confusing Options", "Need to learn"].map(tag => (
                                <button
                                    key={tag}
                                    onClick={() => onAddTag(question.id, tag)}
                                    className={clsx(
                                        "px-3 py-1 rounded-full text-xs font-bold transition-all transform hover:scale-105 active:scale-95 border",
                                        tags?.[question.id] === tag
                                            ? "bg-blue-600 text-white border-blue-600 shadow-md shadow-blue-200"
                                            : "bg-white text-gray-500 border-gray-200 hover:bg-gray-50"
                                    )}
                                >
                                    {tag}
                                </button>
                            ))}
                        </div>

                        {/* Question Text */}
                        <h2 className="text-3xl md:text-3xl font-extrabold text-gray-800 leading-tight text-center">
                            {question.question}
                        </h2>
                    </div>

                    {/* 2. Options Grid Container (Separate from Question) */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pb-8">
                        {Object.entries(question.options).map(([key, text]) => {
                            const isSelected = userAnswer === key;
                            const isCorrectTarget = question.correct_answer === key;

                            let styleClass = "bg-white/80 border-white/40 hover:bg-white hover:border-blue-200 hover:shadow-lg";
                            let iconClass = "bg-gray-100 text-gray-500 group-hover:bg-blue-100 group-hover:text-blue-600";
                            let textClass = "text-gray-700";

                            if (isAnswered) {
                                if (isCorrectTarget) {
                                    styleClass = "bg-green-50 border-green-500 ring-2 ring-green-400 shadow-xl transform scale-[1.01] z-10";
                                    iconClass = "bg-green-600 text-white";
                                    textClass = "text-green-900 font-semibold";
                                } else if (isSelected) {
                                    styleClass = "bg-red-50 border-red-300 opacity-90";
                                    iconClass = "bg-red-100 text-red-600";
                                    textClass = "text-red-800";
                                } else {
                                    styleClass = "opacity-40 grayscale";
                                }
                            }

                            return (
                                <button
                                    key={key}
                                    onClick={() => !isAnswered && onAnswer(key)}
                                    disabled={isAnswered}
                                    className={twMerge(
                                        "relative text-left p-6 rounded-2xl border-2 transition-all duration-300 flex items-start gap-4 group shadow-sm backdrop-blur-sm",
                                        styleClass
                                    )}
                                >
                                    <div className={clsx(
                                        "flex-shrink-0 w-10 h-10 flex items-center justify-center rounded-full font-bold text-lg transition-colors shadow-inner",
                                        iconClass
                                    )}>
                                        {key}
                                    </div>
                                    <span className={clsx("font-medium text-lg leading-relaxed", textClass)}>
                                        {text}
                                    </span>
                                </button>
                            );
                        })}
                    </div>

                    {/* Next Button Floating Bottom Center */}
                    {isAnswered && (
                        <div className="sticky bottom-6 flex justify-center z-20 animate-in fade-in slide-in-from-bottom-4">
                            <button
                                onClick={onNext}
                                className="bg-gray-900 hover:bg-black text-white px-12 py-4 rounded-full font-bold text-xl shadow-2xl hover:shadow-gray-400/50 transition-all hover:-translate-y-1 flex items-center gap-3 border-4 border-white/20 backdrop-blur-md"
                            >
                                Next Question <ArrowRight size={24} />
                            </button>
                        </div>
                    )}
                </div>

                {/* RIGHT COLUMN: Correct Explanation */}
                <div className={clsx(
                    "w-[15%] h-full flex flex-col justify-center transition-all duration-500",
                    isAnswered && !isCorrect ? "opacity-100 translate-x-0" : "opacity-0 translate-x-10 pointer-events-none"
                )}>
                    {isAnswered && !isCorrect && (
                        <div className="bg-green-50/90 backdrop-blur-md border border-green-100 p-4 rounded-2xl shadow-xl">
                            <h3 className="text-green-800 font-bold mb-3 flex items-center gap-2 text-sm uppercase tracking-wide">
                                <CheckCircle className="w-4 h-4" /> Correct Analysis
                            </h3>
                            <p className="text-gray-700 leading-relaxed font-medium text-sm">
                                {question.explanations[question.correct_answer]}
                            </p>
                            <div className="mt-4 p-2 bg-green-100/50 rounded-lg text-xs text-green-800 font-semibold text-center border border-green-200 uppercase tracking-wider">
                                Key Takeaway
                            </div>
                        </div>
                    )}
                </div>

            </div>
        </div>
    );
};
