import React from 'react';
import { LogIn } from 'lucide-react';

export const UserProfile = ({ user, onLogout }) => {
    if (!user) return null;

    return (
        <div className="flex items-center gap-4 bg-white/90 backdrop-blur-md px-4 py-2 rounded-2xl border border-gray-200 shadow-sm">
            <div className="flex flex-col items-end">
                <span className="text-xs font-black text-gray-800 leading-none">{user.displayName || "CISA Student"}</span>
                <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">{user.email}</span>
            </div>
            {user.photoURL ? (
                <img src={user.photoURL} alt="Profile" className="w-8 h-8 rounded-full border border-gray-200" />
            ) : (
                <div className="w-8 h-8 rounded-full bg-blue-100 border border-blue-200 flex items-center justify-center text-blue-700 font-bold text-xs">
                    {(user.displayName || "U").charAt(0).toUpperCase()}
                </div>
            )}
            <button
                onClick={onLogout}
                className="ml-2 p-1.5 hover:bg-red-50 rounded-lg text-gray-400 hover:text-red-500 transition-colors"
                title="Logout"
            >
                <LogIn size={18} className="rotate-180" />
            </button>
        </div>
    );
};
