import React, { useMemo } from 'react';
import { Play, RotateCcw, AlertCircle, Shuffle, Tags } from 'lucide-react';
import { TagBucket } from '../components/TagBucket';

export const DashboardPage = ({
    stats,
    wrongCount,
    onResume,
    onStartFresh,
    onReview,
    onShuffle,
    isShuffle,
    onReset,
    tags, // { questionId: tagName }
    onReviewTag // (tagName, mode, shuffle) => void
}) => {
    const accuracy = stats.total > 0
        ? Math.round((stats.correct / stats.total) * 100)
        : 0;

    // Calculate tag counts for the dashboard
    const tagCounts = useMemo(() => {
        const counts = {
            "Good": 0,
            "Medium": 0,
            "Hard": 0,
            "Doubt": 0,
            "Required learning": 0
        };
        if (tags) {
            Object.values(tags).forEach(tag => {
                if (counts[tag] !== undefined) counts[tag]++;
            });
        }
        return counts;
    }, [tags]);

    const tagColors = {
        "Good": "green",
        "Medium": "yellow",
        "Hard": "red",
        "Doubt": "orange",
        "Required learning": "blue"
    };

    // --- Keyboard Shortcuts ---
    const tagList = useMemo(() => [
        "Good",
        "Medium",
        "Hard",
        "Doubt",
        "Required learning"
    ], []);

    React.useEffect(() => {
        const handleKeyDown = (e) => {
            if (e.key >= '1' && e.key <= '5') {
                const index = parseInt(e.key) - 1;
                const tagName = tagList[index];
                if (tagName) {
                    onReviewTag(tagName);
                }
            }
            if (e.code === 'Enter') {
                onResume();
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [onReviewTag, onResume, tagList]);

    return (
        <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden bg-gray-50/30">
            <div className="bg-white/95 backdrop-blur-2xl rounded-3xl shadow-2xl p-8 max-w-2xl w-full border border-white/60 animate-in zoom-in-95 duration-700 z-10">
                <div className="text-center mb-8">
                    <h2 className="text-4xl font-black text-gray-800 tracking-tight">CISA Dashboard</h2>
                    <p className="text-gray-500 font-medium mt-1">Review your performance and master the concepts.</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
                    <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 text-center hover:shadow-md transition-shadow">
                        <div className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">Total Answered</div>
                        <div className="text-4xl font-black text-gray-900">{stats.total}</div>
                    </div>
                    <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 text-center hover:shadow-md transition-shadow">
                        <div className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">Accuracy</div>
                        <div className={`text-4xl font-black ${accuracy >= 70 ? 'text-green-600' : 'text-orange-500'}`}>
                            {accuracy}%
                        </div>
                    </div>
                    <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 text-center hover:shadow-md transition-shadow">
                        <div className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">Wrong Answers</div>
                        <div className="text-4xl font-black text-red-600">{wrongCount}</div>
                    </div>
                </div>

                {/* --- Tag Buckets Section --- */}
                <div className="mb-10">
                    <div className="flex items-center gap-2 mb-4 px-2">
                        <Tags size={18} className="text-blue-600" />
                        <h3 className="text-sm font-bold text-gray-500 uppercase tracking-widest">Review by Category</h3>
                    </div>
                    <div className="flex flex-wrap justify-between gap-4 bg-gray-50/50 p-6 rounded-3xl border border-gray-100/50">
                        {Object.entries(tagCounts).map(([tag, count], idx) => (
                            <TagBucket
                                key={tag}
                                tag={tag}
                                count={count}
                                color={tagColors[tag]}
                                onClick={onReviewTag}
                                shortcut={idx + 1}
                                hasMenu={true}
                            />
                        ))}
                    </div>
                </div>

                <div className="space-y-4">
                    <div className="flex flex-col sm:flex-row gap-4">
                        <button
                            onClick={onResume}
                            className="flex-1 flex items-center justify-center gap-3 bg-gray-900 hover:bg-black text-white p-5 rounded-2xl font-bold transition-all shadow-xl hover:shadow-2xl hover:-translate-y-1 active:scale-95"
                        >
                            <Play size={20} />
                            Continue Quiz Session
                        </button>
                        <button
                            onClick={onStartFresh}
                            className="flex-1 flex items-center justify-center gap-3 bg-white border-2 border-gray-900 text-gray-900 hover:bg-gray-50 p-5 rounded-2xl font-bold transition-all shadow-sm hover:shadow-md hover:-translate-y-1 active:scale-95"
                        >
                            <RotateCcw size={20} />
                            Start Quiz Fresh
                        </button>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <button
                            onClick={onReview}
                            disabled={wrongCount === 0}
                            className={`flex items-center justify-center gap-2 p-4 rounded-2xl font-bold border-2 transition-all
                  ${wrongCount > 0
                                    ? 'border-red-100 bg-red-50 text-red-700 hover:bg-red-100 hover:border-red-200 active:scale-95'
                                    : 'border-gray-100 bg-gray-50 text-gray-400 cursor-not-allowed opacity-50'}`}
                        >
                            <AlertCircle size={20} />
                            Review Wrong ({wrongCount})
                        </button>

                        <button
                            onClick={onShuffle}
                            className={`flex items-center justify-center gap-2 p-4 rounded-2xl font-bold border-2 transition-all active:scale-95
                  ${isShuffle
                                    ? 'border-blue-200 bg-blue-50 text-blue-700'
                                    : 'border-gray-200 bg-white text-gray-600 hover:border-gray-300'}`}
                        >
                            <Shuffle size={20} />
                            {isShuffle ? 'Shuffle: ON' : 'Shuffle: OFF'}
                        </button>
                    </div>

                    <button
                        onClick={onReset}
                        className="w-full flex items-center justify-center gap-2 text-gray-400 hover:text-red-500 p-2 text-xs font-bold uppercase tracking-widest transition-colors mt-4"
                    >
                        <RotateCcw size={14} />
                        New File / Reset Progress
                    </button>
                </div>
            </div>
        </div>
    );
};
