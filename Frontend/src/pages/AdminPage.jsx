import React, { useState, useEffect } from 'react';
import { ShieldCheck, ArrowLeft, UploadCloud, RotateCcw, Users, Check, X, Clock, MapPin, Globe } from 'lucide-react';
import { Link } from 'react-router-dom';
import BackgroundParticles from '../components/BackgroundParticles';
import { parseAndUploadQuestions, scanDomains } from '../services/adminService';
import { getAllUsers, approveDomainAccess, removeDomainAccess } from '../services/userService';

export const AdminPage = () => {
    const [file, setFile] = useState(null);
    const [domainName, setDomainName] = useState('');
    const [uploading, setUploading] = useState(false);
    const [progress, setProgress] = useState(0);
    const [message, setMessage] = useState('');
    const [users, setUsers] = useState([]);
    const [loadingUsers, setLoadingUsers] = useState(false);
    const [usersError, setUsersError] = useState('');

    const fetchUsers = async () => {
        setLoadingUsers(true);
        setUsersError('');
        try {
            const data = await getAllUsers();
            setUsers(data);
        } catch (error) {
            console.error("Error fetching users:", error);
            setUsersError(error.message || 'Permission denied. Check Firestore rules and admin role.');
        } finally {
            setLoadingUsers(false);
        }
    };

    useEffect(() => {
        fetchUsers();
    }, []);

    const handleApprove = async (userId, domainId) => {
        try {
            await approveDomainAccess(userId, domainId);
            fetchUsers(); // Refresh
        } catch (error) {
            console.error("Error approving:", error);
            alert("Error approving domain access");
        }
    };

    const handleRevoke = async (userId, domainId) => {
        try {
            await removeDomainAccess(userId, domainId);
            fetchUsers();
        } catch (error) {
            console.error("Error revoking:", error);
            alert("Error revoking domain access");
        }
    };

    const handleFileChange = (e) => {
        if (e.target.files && e.target.files[0]) {
            setFile(e.target.files[0]);
            setMessage('');
        }
    };

    const handleUpload = async () => {
        if (!file || !domainName) {
            setMessage("Please select a file and enter a domain name.");
            return;
        }

        setUploading(true);
        setProgress(0);
        setMessage('');

        try {
            const count = await parseAndUploadQuestions(file, domainName, setProgress);
            setMessage(`Success! Uploaded ${count} questions.`);
            setFile(null);
            setDomainName('');
            // Reset file input manually if needed or just let user re-select
        } catch (error) {
            console.error(error);
            setMessage(`Error: ${error.message}`);
        } finally {
            setUploading(false);
        }
    };

    const [syncing, setSyncing] = useState(false);
    const [syncMessage, setSyncMessage] = useState('');

    const handleSync = async () => {
        setSyncing(true);
        setSyncMessage('');
        try {
            const count = await scanDomains();
            setSyncMessage(`Success! Found and registered ${count} domains.`);
        } catch (error) {
            console.error(error);
            setSyncMessage(`Error: ${error.message}`);
        } finally {
            setSyncing(false);
        }
    };

    return (
        <div className="min-h-screen flex flex-col relative overflow-hidden bg-[#0f172a] text-white">
            <BackgroundParticles />

            <div className="container mx-auto px-4 py-8 relative z-10">
                <header className="flex items-center justify-between mb-12">
                    <div className="flex items-center gap-4">
                        <div className="p-3 bg-gradient-to-tr from-blue-600 to-purple-600 rounded-2xl shadow-lg shadow-purple-500/20">
                            <ShieldCheck size={32} className="text-white" />
                        </div>
                        <div>
                            <h1 className="text-3xl font-black tracking-tight">Admin Portal</h1>
                            <p className="text-slate-400 font-medium">Manage users and content</p>
                        </div>
                    </div>
                    <Link to="/" className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors font-bold bg-white/5 hover:bg-white/10 px-4 py-2 rounded-xl">
                        <ArrowLeft size={18} />
                        Back to Dashboard
                    </Link>
                </header>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {/* Data Upload Module */}
                    <div className="bg-white/5 backdrop-blur-xl border border-white/10 p-8 rounded-3xl col-span-1 md:col-span-2 lg:col-span-3">
                        <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                            <UploadCloud size={24} className="text-blue-400" />
                            Data Upload
                        </h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            <div>
                                <label className="block text-slate-400 text-sm font-bold mb-2">Domain Name</label>
                                <input
                                    type="text"
                                    value={domainName}
                                    onChange={(e) => setDomainName(e.target.value)}
                                    placeholder="e.g. Domain 1 - Information Systems Auditing"
                                    className="w-full bg-slate-800/50 border border-slate-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-blue-500 transition-colors"
                                />
                                <p className="text-slate-500 text-xs mt-2">Required. Questions will be tagged with this domain.</p>
                            </div>

                            <div>
                                <label className="block text-slate-400 text-sm font-bold mb-2">JSON File</label>
                                <div className="relative group">
                                    <input
                                        type="file"
                                        accept=".json"
                                        onChange={handleFileChange}
                                        className="w-full bg-slate-800/50 border border-slate-700 border-dashed rounded-xl px-4 py-3 text-slate-300 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-blue-600 file:text-white hover:file:bg-blue-500 transition-all cursor-pointer"
                                    />
                                </div>
                                <p className="text-slate-500 text-xs mt-2">Upload a valid JSON file containing an array of questions.</p>
                            </div>
                        </div>

                        {uploading && (
                            <div className="mt-6">
                                <div className="flex justify-between text-xs text-slate-400 mb-1">
                                    <span>Uploading...</span>
                                    <span>{progress}%</span>
                                </div>
                                <div className="w-full bg-slate-800 rounded-full h-2 overflow-hidden">
                                    <div
                                        className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                                        style={{ width: `${progress}%` }}
                                    ></div>
                                </div>
                            </div>
                        )}

                        <div className="mt-8 flex items-center justify-end gap-4">
                            {message && <span className={`text-sm font-bold ${message.includes('Success') ? 'text-green-400' : 'text-red-400'}`}>{message}</span>}
                            <button
                                onClick={handleUpload}
                                disabled={uploading}
                                className="px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-xl font-bold hover:shadow-lg hover:shadow-blue-500/20 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center gap-2"
                            >
                                {uploading ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div> : <UploadCloud size={18} />}
                                Upload Questions
                            </button>
                        </div>
                    </div>

                    {/* Dynamic User Management */}
                    <div className="bg-white/5 backdrop-blur-xl border border-white/10 p-8 rounded-3xl col-span-1 md:col-span-2 lg:col-span-3">
                        <div className="flex items-center justify-between mb-6">
                            <h2 className="text-xl font-bold flex items-center gap-2">
                                <Users size={24} className="text-purple-400" />
                                User Management
                            </h2>
                            <button onClick={fetchUsers} className="text-slate-400 hover:text-white transition-colors" title="Refresh Users">
                                <RotateCcw size={16} />
                            </button>
                        </div>
                        <p className="text-slate-400 text-sm mb-6">Manage user roles and approve access requests for domains.</p>

                        {usersError && (
                            <div className="mb-4 p-4 bg-red-500/10 border border-red-500/30 rounded-xl text-red-400 text-sm font-bold">
                                Error: {usersError}
                            </div>
                        )}

                        {loadingUsers ? (
                            <div className="flex items-center justify-center p-8">
                                <div className="w-8 h-8 border-4 border-purple-500/30 border-t-purple-500 rounded-full animate-spin"></div>
                            </div>
                        ) : (
                            <div className="overflow-x-auto">
                                <table className="w-full text-left border-collapse">
                                    <thead>
                                        <tr className="border-b border-white/10 text-slate-400 text-sm uppercase tracking-wider">
                                            <th className="pb-4 font-bold">User</th>
                                            <th className="pb-4 font-bold">Location / IP</th>
                                            <th className="pb-4 font-bold">Requests</th>
                                            <th className="pb-4 font-bold">Approved</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-white/5 text-sm">
                                        {users.map(u => (
                                            <tr key={u.id} className="hover:bg-white/5 transition-colors">
                                                <td className="py-4 pr-4">
                                                    <div className="font-bold text-white">{u.displayName || 'Unknown'}</div>
                                                    <div className="text-slate-500 text-xs">{u.email}</div>
                                                    <div className="inline-block mt-1 px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-slate-800 text-slate-400">
                                                        {u.role || 'user'}
                                                    </div>
                                                </td>
                                                <td className="py-4 pr-4 align-top">
                                                    {u.lastLoginInfo ? (
                                                        <div className="text-slate-300 space-y-1">
                                                            <div className="flex items-center gap-1.5 whitespace-nowrap">
                                                                <Globe size={12} className="text-slate-500" />
                                                                {u.lastLoginInfo.ip || 'N/A'}
                                                            </div>
                                                            <div className="flex items-center gap-1.5 text-xs text-slate-500 whitespace-nowrap">
                                                                <MapPin size={12} />
                                                                {u.lastLoginInfo.city ? `${u.lastLoginInfo.city}, ${u.lastLoginInfo.country}` : 'Location Unknown'}
                                                            </div>
                                                        </div>
                                                    ) : (
                                                        <span className="text-slate-500 italic">No data</span>
                                                    )}
                                                </td>
                                                <td className="py-4 pr-4 align-top">
                                                    {(!u.requestedModules || u.requestedModules.length === 0) ? (
                                                        <span className="text-slate-600 italic">None</span>
                                                    ) : (
                                                        <div className="flex flex-col gap-2">
                                                            {u.requestedModules.map(domainId => (
                                                                <div key={domainId} className="flex items-center justify-between bg-yellow-500/10 border border-yellow-500/20 px-3 py-2 rounded-lg gap-3">
                                                                    <div className="flex items-center gap-1.5 text-yellow-500 font-bold whitespace-nowrap">
                                                                        <Clock size={12} /> {domainId}
                                                                    </div>
                                                                    <button
                                                                        onClick={() => handleApprove(u.id, domainId)}
                                                                        className="p-1 hover:bg-yellow-500/20 text-yellow-400 rounded transition-colors"
                                                                        title="Approve"
                                                                    >
                                                                        <Check size={16} />
                                                                    </button>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    )}
                                                </td>
                                                <td className="py-4 align-top">
                                                    {(!u.approvedModules || u.approvedModules.length === 0) ? (
                                                        <span className="text-slate-600 italic">None</span>
                                                    ) : (
                                                        <div className="flex flex-wrap gap-2">
                                                            {u.approvedModules.map(domainId => (
                                                                <div key={domainId} className="flex items-center gap-2 bg-green-500/10 border border-green-500/20 pl-2 pr-1 py-1 rounded-lg text-green-400 text-xs font-bold">
                                                                    {domainId}
                                                                    <button
                                                                        onClick={() => handleRevoke(u.id, domainId)}
                                                                        className="p-0.5 hover:bg-green-500/20 text-green-500 rounded transition-colors"
                                                                        title="Revoke"
                                                                    >
                                                                        <X size={12} />
                                                                    </button>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    )}
                                                </td>
                                            </tr>
                                        ))}
                                        {users.length === 0 && (
                                            <tr>
                                                <td colSpan="4" className="py-8 text-center text-slate-500">No users found.</td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>

                    <div className="bg-white/5 backdrop-blur-xl border border-white/10 p-8 rounded-3xl">
                        <h2 className="text-xl font-bold mb-4">Content Moderation</h2>
                        <p className="text-slate-400 text-sm mb-6">Review submitted questions and educational content.</p>
                        <button className="w-full py-3 bg-purple-600 hover:bg-purple-500 rounded-xl font-bold transition-colors">
                            Review Content
                        </button>
                    </div>
                </div>

                {/* System Maintenance */}
                <div className="mt-8 bg-white/5 backdrop-blur-xl border border-white/10 p-8 rounded-3xl">
                    <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                        <RotateCcw size={24} className="text-orange-400" />
                        System Maintenance
                    </h2>
                    <p className="text-slate-400 text-sm mb-6">
                        Use this to fix issues if chapters are not appearing in the Dashboard.
                        It scans all uploaded questions and rebuilds the chapter list.
                    </p>
                    <div className="flex items-center gap-4">
                        <button
                            onClick={handleSync}
                            disabled={syncing}
                            className="px-6 py-3 bg-orange-600 hover:bg-orange-500 rounded-xl font-bold transition-all flex items-center gap-2 disabled:opacity-50"
                        >
                            {syncing ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div> : <RotateCcw size={18} />}
                            Sync Chapters / Domains
                        </button>
                        {syncMessage && <span className="text-sm font-bold text-green-400">{syncMessage}</span>}
                    </div>
                </div>
            </div>
        </div>
    );
};
