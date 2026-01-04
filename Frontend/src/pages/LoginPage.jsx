import React, { useState } from 'react';
import { signInWithGoogle } from '../firebase';
import { LogIn, ShieldCheck, Zap, Globe, Sparkles } from 'lucide-react';
import BackgroundParticles from '../components/BackgroundParticles';

export const LoginPage = () => {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const handleLogin = async () => {
        setLoading(true);
        setError(null);
        try {
            await signInWithGoogle();
        } catch (err) {
            setError("Failed to sign in. Please try again.");
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center relative overflow-hidden bg-[#0f172a]">
            {/* Background Effects */}
            <BackgroundParticles />
            <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-blue-600/10 via-transparent to-purple-600/10 pointer-events-none"></div>

            {/* Glassmorphism Card */}
            <div className="relative z-10 w-full max-w-md mx-4">
                <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-[2.5rem] p-10 shadow-2xl overflow-hidden group">
                    {/* Decorative Top Glow */}
                    <div className="absolute -top-24 -left-24 w-48 h-48 bg-blue-500/20 blur-[80px] rounded-full group-hover:bg-blue-500/30 transition-all duration-700"></div>
                    <div className="absolute -bottom-24 -right-24 w-48 h-48 bg-purple-500/20 blur-[80px] rounded-full group-hover:bg-purple-500/30 transition-all duration-700"></div>

                    {/* Logo & Branding */}
                    <div className="text-center mb-10">
                        <div className="inline-flex items-center justify-center p-4 bg-gradient-to-tr from-blue-600 to-indigo-600 rounded-3xl mb-6 shadow-xl shadow-blue-500/20 transform group-hover:scale-110 group-hover:rotate-3 transition-all duration-500">
                            <ShieldCheck size={40} className="text-white" strokeWidth={2.5} />
                        </div>
                        <h1 className="text-4xl font-black text-white tracking-tight mb-2">
                            CISA <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-400">Master</span>
                        </h1>
                        <p className="text-slate-400 font-medium">Elevate Your Cybersecurity Expertise</p>
                    </div>

                    {/* Features Grid */}
                    <div className="grid grid-cols-2 gap-4 mb-10">
                        <div className="p-4 rounded-2xl bg-white/5 border border-white/5 flex flex-col items-center text-center gap-2 group/item hover:bg-white/10 transition-colors">
                            <Zap size={20} className="text-yellow-400" />
                            <span className="text-xs font-bold text-slate-300 uppercase tracking-widest">Active Learning</span>
                        </div>
                        <div className="p-4 rounded-2xl bg-white/5 border border-white/5 flex flex-col items-center text-center gap-2 group/item hover:bg-white/10 transition-colors">
                            <Globe size={20} className="text-blue-400" />
                            <span className="text-xs font-bold text-slate-300 uppercase tracking-widest">Global Standards</span>
                        </div>
                    </div>

                    {/* Login Button */}
                    <div className="space-y-4">
                        <button
                            onClick={handleLogin}
                            disabled={loading}
                            className="w-full relative group/btn overflow-hidden px-8 py-5 bg-white rounded-2xl font-black text-slate-900 flex items-center justify-center gap-3 shadow-xl hover:shadow-white/10 hover:-translate-y-1 active:translate-y-0 transition-all disabled:opacity-50 disabled:pointer-events-none"
                        >
                            {loading ? (
                                <div className="w-6 h-6 border-4 border-slate-200 border-t-slate-900 rounded-full animate-spin"></div>
                            ) : (
                                <>
                                    <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" alt="Google" className="w-6 h-6" />
                                    <span>Continue with Google</span>
                                </>
                            )}

                            {/* Hover Shine Effect */}
                            <div className="absolute top-0 -inset-full h-full w-1/2 z-5 block transform -skew-x-12 bg-gradient-to-r from-transparent to-white/40 opacity-40 group-hover/btn:animate-shine"></div>
                        </button>

                        {error && (
                            <p className="text-red-400 text-sm font-bold text-center animate-in fade-in slide-in-from-top-2">
                                {error}
                            </p>
                        )}
                    </div>

                    {/* Footer Info */}
                    <div className="mt-10 pt-6 border-t border-white/5 flex items-center justify-center gap-2">
                        <Sparkles size={14} className="text-blue-400" />
                        <span className="text-[10px] font-bold text-slate-500 uppercase tracking-[0.2em]">Secure Authentication Powered by Firebase</span>
                    </div>
                </div>

                {/* Decorative Bottom Text */}
                <p className="mt-8 text-center text-slate-500 text-xs font-medium">
                    By continuing, you agree to our <span className="text-slate-400 underline cursor-pointer hover:text-blue-400 transition-colors">Terms of Service</span>
                </p>
            </div>

            <style jsx="true font-family: 'Inter', sans-serif;">{`
                @keyframes shine {
                    from { left: -100%; }
                    to { left: 100%; }
                }
                .animate-shine {
                    animation: shine 0.8s ease-in-out;
                }
            `}</style>
        </div>
    );
};
