import React, { useState } from 'react';
import { signInWithGoogle, loginWithEmail, registerWithEmail } from '../firebase';
import { ShieldCheck, Sparkles, Mail, Lock, BookOpen, Target, Award } from 'lucide-react';
import BackgroundParticles from '../components/BackgroundParticles';

export const LoginPage = () => {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');

    const handleGoogleLogin = async () => {
        setLoading(true);
        setError(null);
        try {
            await signInWithGoogle();
            // On mobile, signInWithGoogle triggers a redirect — page navigates away,
            // so the code below never runs. On desktop, popup resolves here.
            setLoading(false);
        } catch (err) {
            setError("Failed to sign in with Google.");
            console.error(err);
            setLoading(false);
        }
    };

    const handleEmailLogin = async () => {
        if (!email || !password) {
            setError("Please enter both email and password.");
            return;
        }
        setLoading(true);
        setError(null);
        try {
            await loginWithEmail(email, password);
        } catch (err) {
            setError("Failed to log in with Email. Check your credentials.");
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const handleEmailRegister = async () => {
        if (!email || !password) {
            setError("Please enter both email and password to register.");
            return;
        }
        if (password.length < 6) {
            setError("Password must be at least 6 characters.");
            return;
        }
        setLoading(true);
        setError(null);
        try {
            await registerWithEmail(email, password);
        } catch (err) {
            setError("Failed to register with Email. The email might already be in use.");
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex flex-col items-center justify-center relative overflow-hidden bg-[#080f1e] px-4 py-10">
            {/* Background */}
            <BackgroundParticles />
            <div className="absolute inset-0 bg-gradient-to-br from-blue-900/20 via-transparent to-purple-900/20 pointer-events-none" />
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[300px] bg-blue-600/10 blur-[120px] rounded-full pointer-events-none" />

            <div className="relative z-10 w-full max-w-sm">

                {/* ── Hero ── */}
                <div className="text-center mb-8">
                    <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-tr from-blue-600 to-indigo-500 rounded-2xl mb-5 shadow-2xl shadow-blue-600/30">
                        <ShieldCheck size={32} className="text-white" strokeWidth={2.5} />
                    </div>
                    <h1 className="text-4xl md:text-5xl font-black text-white tracking-tight leading-none mb-2">
                        CISA <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-violet-400">Master</span>
                    </h1>
                    <p className="text-slate-400 text-sm md:text-base font-medium mt-2">
                        Your smartest path to CISA certification.
                    </p>
                </div>

                {/* ── Stats strip ── */}
                <div className="flex items-center justify-center gap-4 mb-8">
                    <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-blue-500/10 border border-blue-500/20">
                        <BookOpen size={12} className="text-blue-400" />
                        <span className="text-[11px] font-bold text-blue-300">800+ Questions</span>
                    </div>
                    <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-violet-500/10 border border-violet-500/20">
                        <Target size={12} className="text-violet-400" />
                        <span className="text-[11px] font-bold text-violet-300">5 Domains</span>
                    </div>
                    <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20">
                        <Award size={12} className="text-emerald-400" />
                        <span className="text-[11px] font-bold text-emerald-300">ISACA Aligned</span>
                    </div>
                </div>

                {/* ── Auth Card ── */}
                <div className="bg-white/[0.04] backdrop-blur-2xl border border-white/[0.08] rounded-3xl p-7 shadow-2xl">

                    {/* Google — primary CTA */}
                    <button
                        onClick={handleGoogleLogin}
                        disabled={loading}
                        className="w-full relative group/btn overflow-hidden flex items-center justify-center gap-3 px-6 py-3.5 bg-white hover:bg-slate-50 rounded-2xl font-bold text-slate-900 text-sm shadow-lg hover:-translate-y-0.5 active:translate-y-0 transition-all disabled:opacity-50 disabled:pointer-events-none mb-5"
                    >
                        {loading ? (
                            <div className="w-4 h-4 border-2 border-slate-300 border-t-slate-800 rounded-full animate-spin" />
                        ) : (
                            <>
                                <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" alt="Google" className="w-4 h-4" />
                                Continue with Google
                            </>
                        )}
                        <div className="absolute top-0 -inset-full h-full w-1/2 block transform -skew-x-12 bg-gradient-to-r from-transparent to-white/30 opacity-40 group-hover/btn:animate-shine" />
                    </button>

                    {/* Divider */}
                    <div className="flex items-center gap-3 mb-5">
                        <div className="flex-grow h-px bg-white/8" />
                        <span className="text-[11px] font-bold text-slate-500 uppercase tracking-widest">or use email</span>
                        <div className="flex-grow h-px bg-white/8" />
                    </div>

                    {/* Email + Password */}
                    <div className="space-y-3">
                        <div className="relative">
                            <Mail size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none" />
                            <input
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                onKeyDown={(e) => e.key === 'Enter' && handleEmailLogin()}
                                placeholder="Email address"
                                className="w-full bg-slate-800/60 border border-slate-700/50 rounded-xl pl-9 pr-4 py-3 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/30 transition-all"
                            />
                        </div>
                        <div className="relative">
                            <Lock size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none" />
                            <input
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                onKeyDown={(e) => e.key === 'Enter' && handleEmailLogin()}
                                placeholder="Password (min 6 characters)"
                                className="w-full bg-slate-800/60 border border-slate-700/50 rounded-xl pl-9 pr-4 py-3 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/30 transition-all"
                            />
                        </div>

                        <div className="flex gap-2 pt-1">
                            <button
                                onClick={handleEmailLogin}
                                disabled={loading}
                                className="flex-1 py-3 bg-blue-600 hover:bg-blue-500 rounded-xl text-sm font-bold text-white transition-colors disabled:opacity-50"
                            >
                                Sign In
                            </button>
                            <button
                                onClick={handleEmailRegister}
                                disabled={loading}
                                className="flex-1 py-3 bg-white/8 hover:bg-white/12 border border-white/10 rounded-xl text-sm font-bold text-slate-300 transition-colors disabled:opacity-50"
                            >
                                Register
                            </button>
                        </div>
                    </div>

                    {error && (
                        <p className="mt-4 text-red-400 text-xs font-semibold text-center animate-in fade-in slide-in-from-top-1">
                            {error}
                        </p>
                    )}
                </div>

                {/* Footer */}
                <div className="mt-6 flex flex-col items-center gap-2">
                    <div className="flex items-center gap-1.5">
                        <Sparkles size={11} className="text-slate-600" />
                        <span className="text-[10px] font-bold text-slate-600 uppercase tracking-widest">Secured by Firebase</span>
                    </div>
                    <p className="text-center text-slate-600 text-[11px]">
                        By continuing you agree to our{' '}
                        <span className="text-slate-400 underline cursor-pointer hover:text-blue-400 transition-colors">Terms of Service</span>
                    </p>
                </div>
            </div>

            <style>{`
                @keyframes shine { from { left: -100%; } to { left: 100%; } }
                .animate-shine { animation: shine 0.8s ease-in-out; }
            `}</style>
        </div>
    );
};
