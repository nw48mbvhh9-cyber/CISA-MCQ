import React, { useState, useEffect, useRef } from 'react';
import { clsx } from 'clsx';

export const TagBucket = ({ tag, count, color, onClick, isSelected, shortcut, hasMenu = false }) => {
    const [animate, setAnimate] = useState(false);
    const bucketId = useRef(`tagbucket-${Math.random()}`);

    useEffect(() => {
        if (count > 0) {
            setTimeout(() => setAnimate(true), 0);
            const timer = setTimeout(() => setAnimate(false), 600);
            return () => clearTimeout(timer);
        }
    }, [count]);

    // Close this bucket's menu when another bucket opens
    useEffect(() => {
        const handler = (e) => {
            if (e.detail !== bucketId.current) {
                setShowOptions(false);
            }
        };
        window.addEventListener('tagbucket-open', handler);
        return () => window.removeEventListener('tagbucket-open', handler);
    }, []);

    // Explicit color mapping for Tailwind to pick up classes correctly
    const colorStyles = {
        red: {
            border: "border-red-200",
            borderActive: "border-red-500",
            ring: "ring-red-200",
            text: "text-red-600",
            bgLight: "bg-red-50",
            bgAccent: "bg-red-400/30"
        },
        green: {
            border: "border-green-200",
            borderActive: "border-green-500",
            ring: "ring-green-200",
            text: "text-green-600",
            bgLight: "bg-green-50",
            bgAccent: "bg-green-400/30"
        },
        orange: {
            border: "border-orange-200",
            borderActive: "border-orange-500",
            ring: "ring-orange-200",
            text: "text-orange-600",
            bgLight: "bg-orange-50",
            bgAccent: "bg-orange-400/30"
        },
        yellow: {
            border: "border-yellow-200",
            borderActive: "border-yellow-500",
            ring: "ring-yellow-200",
            text: "text-yellow-600",
            bgLight: "bg-yellow-50",
            bgAccent: "bg-yellow-400/30"
        },
        blue: {
            border: "border-blue-200",
            borderActive: "border-blue-500",
            ring: "ring-blue-200",
            text: "text-blue-600",
            bgLight: "bg-blue-50",
            bgAccent: "bg-blue-400/30"
        },
        gray: {
            border: "border-gray-200",
            borderActive: "border-gray-500",
            ring: "ring-gray-200",
            text: "text-gray-600",
            bgLight: "bg-gray-50",
            bgAccent: "bg-gray-400/30"
        }
    };

    const style = colorStyles[color] || colorStyles.gray;

    const [showOptions, setShowOptions] = useState(false);
    const [shuffle, setShuffle] = useState(false);

    const handleModeSelect = (mode) => {
        onClick(tag, mode, shuffle);
        setShowOptions(false);
    };

    return (
        <div className="relative group">
            <button
                onClick={() => {
                    if (!hasMenu) { onClick(tag); return; }
                    const next = !showOptions;
                    if (next) window.dispatchEvent(new CustomEvent('tagbucket-open', { detail: bucketId.current }));
                    setShowOptions(next);
                }}
                className={clsx(
                    "flex flex-col items-center transition-all duration-300 transform",
                    isSelected ? "scale-110 -translate-y-2" : "hover:-translate-y-1"
                )}
            >
                <div className="h-4 w-[2px] bg-gray-300 group-hover:bg-gray-400 transition-colors"></div>

                <div className={clsx(
                    "relative bg-white border-2 rounded-lg p-2 min-w-[72px] max-w-[90px] shadow-sm transition-all overflow-visible flex flex-col items-center justify-center min-h-[85px]",
                    isSelected ? `${style.borderActive} shadow-xl ring-2 ${style.ring}` : `${style.border} shadow-md`,
                    animate && "animate-page-turn"
                )}>
                    {/* Count Badge */}
                    <div className={clsx(
                        "font-bold text-2xl text-center leading-none transition-all",
                        style.text,
                        animate && "animate-count-pop"
                    )}>
                        {count}
                    </div>

                    {/* Shortcut Indicator */}
                    <div className="text-[9px] font-black text-gray-300 mb-1 group-hover:text-blue-400 transition-colors">
                        [{shortcut}]
                    </div>

                    {/* Label - Wrapped and Centered */}
                    <div className="text-[10px] uppercase tracking-wider font-extrabold text-gray-500 text-center leading-tight whitespace-normal break-words w-full">
                        {tag}
                    </div>

                    {/* Hanging Effect Overlay */}
                    <div className={clsx(
                        "absolute bottom-0 left-0 right-0 h-1 rounded-b-lg",
                        style.bgAccent
                    )}></div>
                </div>
            </button>

            {showOptions && (
                <div className="absolute top-full left-1/2 -translate-x-1/2 mt-2 bg-white rounded-2xl shadow-2xl border border-gray-100 p-4 z-[100] w-[200px] animate-in slide-in-from-top-2 fade-in duration-200">
                    <h4 className="text-xs font-black text-gray-400 uppercase tracking-widest mb-3 px-1">Quiz Mode: {tag}</h4>
                    <div className="space-y-2">
                        <button
                            onClick={() => handleModeSelect('present')}
                            className="w-full text-left px-4 py-3 rounded-xl hover:bg-blue-50 text-gray-700 hover:text-blue-700 transition-colors flex flex-col"
                        >
                            <span className="font-bold text-sm">Present Mode</span>
                            <span className="text-[10px] opacity-70">Review with answers & justifications</span>
                        </button>
                        <button
                            onClick={() => handleModeSelect('new')}
                            className="w-full text-left px-4 py-3 rounded-xl hover:bg-green-50 text-gray-700 hover:text-green-700 transition-colors flex flex-col"
                        >
                            <span className="font-bold text-sm">New Mode</span>
                            <span className="text-[10px] opacity-70">Start fresh for this category</span>
                        </button>
                    </div>

                    <div className="mt-4 pt-4 border-t border-gray-100 px-1">
                        <label className="flex items-center gap-3 cursor-pointer group/toggle">
                            <div className="relative">
                                <input
                                    type="checkbox"
                                    className="sr-only peer"
                                    checked={shuffle}
                                    onChange={(e) => setShuffle(e.target.checked)}
                                />
                                <div className="w-10 h-5 bg-gray-200 rounded-full peer peer-checked:bg-blue-600 transition-colors"></div>
                                <div className="absolute left-1 top-1 w-3 h-3 bg-white rounded-full transition-transform peer-checked:translate-x-5"></div>
                            </div>
                            <span className="text-xs font-bold text-gray-500 group-hover/toggle:text-gray-700 select-none">Shuffle Questions</span>
                        </label>
                    </div>
                </div>
            )}
        </div>
    );
};
