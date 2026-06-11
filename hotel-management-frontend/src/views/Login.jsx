import React, { useState } from 'react';
import { useApp } from '../context/AppContext';

export default function Login() {
    const { login } = useApp();
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        const success = await login(username, password);
        if (!success) {
            setLoading(false);
        }
    };

    return (
        <div className="flex items-center justify-center min-h-screen bg-slate-50 dark:bg-slate-950 px-4 transition-colors duration-200 w-full">
            <div className="w-full max-w-md animate-fade-in">
                {/* Brand Logo Header */}
                <div className="flex flex-col items-center mb-8">
                    <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-brand-600 to-indigo-500 flex items-center justify-center text-white shadow-xl shadow-brand-500/20 mb-4 animate-bounce-slow">
                        <i className="fa-solid fa-hotel text-2xl"></i>
                    </div>
                    <h1 className="text-3xl font-extrabold text-slate-100 font-heading">Brookside Hotel</h1>
                    <p className="text-slate-400 mt-2 font-medium">Hotel Management Admin Portal</p>
                </div>

                {/* Login Form Card */}
                <div className="glass-panel p-8 rounded-2xl border border-slate-800/80 shadow-2xl relative overflow-hidden">
                    <div className="absolute top-0 left-0 w-full h-[3px] bg-gradient-to-r from-brand-500 to-indigo-500"></div>

                    <h2 className="text-xl font-bold text-slate-200 mb-6 font-heading">Sign In</h2>
                    
                    <form onSubmit={handleSubmit} className="space-y-5">
                        <div>
                            <label htmlFor="username" className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">Username</label>
                            <div className="relative">
                                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                                    <i className="fa-solid fa-user text-sm"></i>
                                </div>
                                <input 
                                    type="text" 
                                    id="username" 
                                    name="username" 
                                    required 
                                    value={username}
                                    onChange={(e) => setUsername(e.target.value)}
                                    className="w-full pl-10 pr-4 py-3 bg-slate-900/60 border border-slate-800 rounded-xl text-slate-200 placeholder-slate-500 focus:border-brand-500 focus:bg-slate-900 transition-all text-sm"
                                    placeholder="Enter admin username"
                                />
                            </div>
                        </div>

                        <div>
                            <label htmlFor="password" className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">Password</label>
                            <div className="relative">
                                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                                    <i className="fa-solid fa-lock text-sm"></i>
                                </div>
                                <input 
                                    type={showPassword ? 'text' : 'password'} 
                                    id="password" 
                                    name="password" 
                                    required 
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    className="w-full pl-10 pr-10 py-3 bg-slate-900/60 border border-slate-800 rounded-xl text-slate-200 placeholder-slate-500 focus:border-brand-500 focus:bg-slate-900 transition-all text-sm"
                                    placeholder="••••••••"
                                />
                                <button 
                                    type="button" 
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-500 hover:text-slate-300"
                                >
                                    <i className={`fa-solid ${showPassword ? 'fa-eye-slash' : 'fa-eye'} text-sm`}></i>
                                </button>
                            </div>
                        </div>

                        <button 
                            type="submit" 
                            disabled={loading}
                            className="w-full py-3 bg-brand-600 hover:bg-brand-500 active:bg-brand-700 text-white rounded-xl font-semibold shadow-lg shadow-brand-600/20 transition-all flex items-center justify-center gap-2 mt-4 hover:shadow-brand-500/30 disabled:opacity-70 disabled:cursor-not-allowed"
                        >
                            {loading ? (
                                <>
                                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                    <span>Verifying credentials...</span>
                                </>
                            ) : (
                                <>
                                    <span>Authenticate</span>
                                    <i className="fa-solid fa-arrow-right text-xs"></i>
                                </>
                            )}
                        </button>
                    </form>
                </div>
                
                <p className="text-center text-xs text-slate-500 mt-8 font-heading">
                    &copy; 2026 Grand Horizon Luxury Resorts. All rights reserved.
                </p>
            </div>
        </div>
    );
}
