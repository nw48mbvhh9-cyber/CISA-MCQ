import React, { useMemo, useState } from 'react';
import { Play, RotateCcw, AlertCircle, Shuffle, Tags, Lock, CheckCircle, Clock } from 'lucide-react';
import { UserProfile } from '../components/UserProfile';
import { TagBucket } from '../components/TagBucket';
import { requestDomainAccess } from '../services/userService';

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

    onReviewTag, // (tagName, mode, shuffle) => void
    user,
    onLogout,

    // New Props
    availableDomains,
    selectedDomain,
    onSelectDomain,
    domainError,
    onRefreshDomains,
    domainStats, // { total, answered, accuracy, wrong }
    dbUser
}) => {

    // Use passed context-aware stats
    const { total, answered, accuracy, wrong, counts } = domainStats || { total: 0, answered: 0, accuracy: 0, wrong: 0, counts: {} };

    // Fallback tag counts if not present
    const tagCounts = counts || {
        "Good": 0,
        "Medium": 0,
        "Hard": 0,
        "Doubt": 0,
        "Required learning": 0
    };

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

    const [requestingId, setRequestingId] = useState(null);

    const handleRequestAccess = async (e, domainId) => {
        e.stopPropagation(); // prevent card click
        if (!user || !user.uid) return;
        setRequestingId(domainId);
        try {
            await requestDomainAccess(user.uid, domainId);
            // Optimistically update the local dbUser state so it reflects immediately
            if (!dbUser.requestedModules) dbUser.requestedModules = [];
            dbUser.requestedModules.push(domainId);
        } catch (error) {
            console.error("Error requesting access:", error);
            alert("Failed to request access. Please try again.");
        } finally {
            setRequestingId(null);
        }
    };

    return (
        <div className="flex-1 overflow-y-auto p-4 md:p-8">
            <div className="max-w-4xl mx-auto">
                {/* Profile Header */}
                <div className="flex justify-between items-start md:items-center gap-3 mb-8">
                    <div className="min-w-0 flex-1">
                        <h1 className="text-2xl md:text-4xl font-black text-gray-900 mb-1 md:mb-2 tracking-tight truncate">
                            {selectedDomain ? selectedDomain.name : 'Global Overview'}
                        </h1>
                        <p className="text-sm md:text-base text-gray-500 font-medium">
                            {selectedDomain ? 'Domain Performance Analytics' : 'Review your performance and master the concepts.'}
                        </p>
                    </div>

                    <UserProfile user={user} onLogout={onLogout} />
                </div>

                {/* Stats Grid */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
                    <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 text-center hover:shadow-md transition-shadow">
                        <div className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">Total Answered</div>
                        <div className="text-4xl font-black text-gray-900">{answered} / {total}</div>
                    </div>
                    <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 text-center hover:shadow-md transition-shadow">
                        <div className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">Accuracy</div>
                        <div className={`text-4xl font-black ${accuracy >= 70 ? 'text-green-600' : 'text-orange-500'}`}>
                            {accuracy}%
                        </div>
                    </div>
                    <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 text-center hover:shadow-md transition-shadow">
                        <div className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">Wrong Answers</div>
                        <div className="text-4xl font-black text-red-500">{wrong}</div>
                    </div>
                </div>

                {/* --- Tag Buckets Section --- */}
                <div className="mb-10">
                    <div className="flex items-center gap-2 mb-4 px-2">
                        <Tags size={18} className="text-blue-600" />
                        <h3 className="text-sm font-bold text-gray-500 uppercase tracking-widest">Review by Category</h3>
                    </div>
                    <div className="flex flex-wrap justify-center md:justify-between gap-3 md:gap-4 bg-gray-50/50 p-4 md:p-6 rounded-3xl border border-gray-100/50">
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
                    {/* --- Chapter Selection --- */}
                    <div className="bg-white border-2 border-slate-100 p-6 rounded-3xl mb-6">
                        <div className="flex items-center justify-between mb-4">
                            <div className="flex items-center gap-2">
                                <span className="w-8 h-8 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-bold text-sm">1</span>
                                <h3 className="text-lg font-bold text-gray-800">Select Domain / Chapter</h3>
                            </div>
                            <button onClick={onRefreshDomains} className="text-slate-400 hover:text-blue-500 transition-colors p-2" title="Refresh Chapters">
                                <RotateCcw size={16} />
                            </button>
                        </div>

                        {domainError && (
                            <div className="mb-4 p-4 bg-red-50 text-red-600 rounded-xl text-sm font-bold border border-red-100">
                                Error loading chapters: {domainError}
                            </div>
                        )}

                        {(!availableDomains || availableDomains.length === 0) ? (
                            <div className="text-center p-8 bg-slate-50 rounded-xl border border-slate-100 border-dashed">
                                <p className="text-slate-400 font-medium italic">No chapters available. Please upload data via Admin Portal.</p>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 gap-3">
                                {availableDomains.map((domain) => {
                                    // Calculate progress for this specific domain card
                                    const dTotal = domain.questionIds ? domain.questionIds.length : (domain.totalQuestions || 0);
                                    let dAnswered = 0;
                                    if (selectedDomain?.id === domain.id) {
                                        // Use pre-computed accurate stats for the active domain
                                        dAnswered = domainStats?.answered || 0;
                                    } else if (domain.questionIds && tags) {
                                        dAnswered = domain.questionIds.filter(id => tags[id]).length;
                                    }
                                    const dProgress = dTotal > 0 ? (dAnswered / dTotal) * 100 : 0;

                                    // Access Logic
                                    const isAdmin = dbUser?.role === 'admin' || dbUser?.role === 'superadmin';
                                    const isDemoModule = domain.name.toLowerCase().includes('domain 1') || domain.id === 'domain1';
                                    const isApproved = dbUser?.approvedModules?.includes(domain.id);
                                    const isRequested = dbUser?.requestedModules?.includes(domain.id);
                                    const hasAccess = isAdmin || isDemoModule || isApproved;

                                    return (
                                        <div
                                            key={domain.id}
                                            onClick={() => hasAccess ? onSelectDomain(domain) : null}
                                            className={`w-full relative text-left p-4 rounded-xl border-2 transition-all flex items-center justify-between group
                                                ${hasAccess ? 'cursor-pointer hover:border-blue-200 hover:bg-slate-50' : 'cursor-default opacity-80 bg-slate-50 border-slate-100'}
                                                ${selectedDomain?.id === domain.id && hasAccess
                                                    ? 'border-blue-500 bg-blue-50/50 shadow-md shadow-blue-500/10'
                                                    : 'border-slate-100'}`}
                                        >
                                            <div className={`flex-1 min-w-0 pr-4 ${!hasAccess ? 'opacity-50' : ''}`}>
                                                <div className="flex justify-between items-center mb-1">
                                                    <div className="flex items-center gap-2">
                                                        {!hasAccess && <Lock size={14} className="text-slate-500" />}
                                                        <span className={`block font-bold text-base truncate ${selectedDomain?.id === domain.id ? 'text-blue-700' : 'text-slate-700'}`}>
                                                            {domain.name}
                                                        </span>
                                                    </div>
                                                    <span className="text-xs font-bold text-slate-400 whitespace-nowrap ml-2">
                                                        {dTotal - dAnswered} / {dTotal}
                                                    </span>
                                                </div>

                                                {/* Progress Bar */}
                                                <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                                                    <div
                                                        className={`h-full rounded-full transition-all duration-500 ${selectedDomain?.id === domain.id ? 'bg-blue-500' : 'bg-slate-300'}`}
                                                        style={{ width: `${dProgress}%` }}
                                                    />
                                                </div>
                                            </div>

                                            {hasAccess ? (
                                                <div className={`w-5 h-5 flex-none rounded-full border-2 flex items-center justify-center
                                                    ${selectedDomain?.id === domain.id
                                                        ? 'border-blue-500 bg-blue-500'
                                                        : 'border-slate-300'}`}>
                                                    {selectedDomain?.id === domain.id && <div className="w-2 h-2 rounded-full bg-white" />}
                                                </div>
                                            ) : (
                                                <div className="flex-none ml-4 relative z-10">
                                                    {isRequested ? (
                                                        <div className="flex items-center gap-1.5 px-3 py-1.5 bg-yellow-50 text-yellow-700 border border-yellow-200 rounded-lg text-xs font-bold whitespace-nowrap">
                                                            <Clock size={12} /> Pending Approval
                                                        </div>
                                                    ) : (
                                                        <button
                                                            onClick={(e) => handleRequestAccess(e, domain.id)}
                                                            disabled={requestingId === domain.id}
                                                            className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-white rounded-lg text-xs font-bold transition-colors whitespace-nowrap disabled:opacity-50"
                                                        >
                                                            {requestingId === domain.id ? (
                                                                <div className="w-3 h-3 border-2 border-slate-400 border-t-white rounded-full animate-spin"></div>
                                                            ) : (
                                                                <Lock size={12} />
                                                            )}
                                                            Request Access
                                                        </button>
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>

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

                    {/* Removed New File / Reset Progress Button */}
                </div>
            </div>
        </div>
    );
};
