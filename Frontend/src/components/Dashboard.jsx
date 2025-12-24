import React from 'react';
import { Play, RotateCcw, AlertCircle, Shuffle } from 'lucide-react';

export const Dashboard = ({
    stats,
    wrongCount,
    onResume,
    onReview,
    onShuffle,
    isShuffle,
    onReset
}) => {
    const accuracy = stats.total > 0
        ? Math.round((stats.correct / stats.total) * 100)
        : 0;

    return (
        <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden">
            <div className="bg-white/90 backdrop-blur-xl rounded-2xl shadow-2xl p-8 max-w-md w-full border border-white/50 animate-in zoom-in-95 duration-500 z-10">
                <h2 className="text-3xl font-bold text-gray-800 mb-8 text-center">Your Progress</h2>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
                    <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 text-center">
                        <div className="text-sm text-gray-500 mb-1">Total Answered</div>
                        <div className="text-3xl font-bold text-gray-900">{stats.total}</div>
                    </div>
                    <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 text-center">
                        <div className="text-sm text-gray-500 mb-1">Accuracy</div>
                        <div className={`text-3xl font-bold ${accuracy >= 70 ? 'text-green-600' : 'text-orange-500'}`}>
                            {accuracy}%
                        </div>
                    </div>
                    <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 text-center">
                        <div className="text-sm text-gray-500 mb-1">Wrong Answers</div>
                        <div className="text-3xl font-bold text-red-600">{wrongCount}</div>
                    </div>
                </div>

                <div className="space-y-4">
                    <button
                        onClick={onResume}
                        className="w-full flex items-center justify-center gap-3 bg-blue-600 hover:bg-blue-700 text-white p-4 rounded-xl font-semibold transition-all shadow-md hover:shadow-lg"
                    >
                        <Play size={20} />
                        Continue Quiz
                    </button>

                    <div className="grid grid-cols-2 gap-4">
                        <button
                            onClick={onReview}
                            disabled={wrongCount === 0}
                            className={`flex items-center justify-center gap-2 p-4 rounded-xl font-medium border-2 transition-colors
                  ${wrongCount > 0
                                    ? 'border-red-100 bg-red-50 text-red-700 hover:bg-red-100 hover:border-red-200'
                                    : 'border-gray-100 bg-gray-50 text-gray-400 cursor-not-allowed'}`}
                        >
                            <AlertCircle size={20} />
                            Review Wrong ({wrongCount})
                        </button>

                        <button
                            onClick={onShuffle}
                            className={`flex items-center justify-center gap-2 p-4 rounded-xl font-medium border-2 transition-colors
                  ${isShuffle
                                    ? 'border-purple-200 bg-purple-50 text-purple-700'
                                    : 'border-gray-200 bg-white text-gray-600 hover:border-gray-300'}`}
                        >
                            <Shuffle size={20} />
                            {isShuffle ? 'Shuffle On' : 'Shuffle Off'}
                        </button>
                    </div>

                    <button
                        onClick={onReset}
                        className="w-full flex items-center justify-center gap-2 text-gray-500 hover:text-gray-700 p-2 text-sm mt-4"
                    >
                        <RotateCcw size={16} />
                        Upload New File / Reset
                    </button>
                </div>
            </div>
        </div>
    );
};
