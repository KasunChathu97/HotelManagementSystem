import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '../services/api';

const AppContext = createContext();

export function AppProvider({ children }) {
    const [theme, setTheme] = useState(localStorage.getItem('theme') || 'dark');
    const [user, setUser] = useState(null);
    const [token, setToken] = useState(null);
    const [activeView, setActiveView] = useState('dashboard');
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [toasts, setToasts] = useState([]);
    const [globalLoading, setGlobalLoading] = useState(false);

    // Apply theme
    useEffect(() => {
        if (theme === 'dark') {
            document.documentElement.classList.add('dark');
        } else {
            document.documentElement.classList.remove('dark');
        }
        localStorage.setItem('theme', theme);
    }, [theme]);

    // Handle hash change routing
    useEffect(() => {
        const handleHashChange = () => {
            const hash = window.location.hash.replace('#', '') || 'dashboard';
            setActiveView(hash);
        };

        window.addEventListener('hashchange', handleHashChange);
        handleHashChange(); // trigger initially

        return () => window.removeEventListener('hashchange', handleHashChange);
    }, []);

    // Check session on load
    useEffect(() => {
        const storedToken = localStorage.getItem('gh_jwt_token');
        const storedUser = localStorage.getItem('gh_user_data');
        if (storedToken && storedUser) {
            setToken(storedToken);
            setUser(JSON.parse(storedUser));
        } else {
            window.location.hash = '#login';
        }

        const handleUnauthorized = () => {
            setToken(null);
            setUser(null);
            localStorage.removeItem('gh_jwt_token');
            localStorage.removeItem('gh_user_data');
            showToast('Session expired. Please log in again.', 'error');
            window.location.hash = '#login';
        };

        window.addEventListener('unauthorized-redirect', handleUnauthorized);
        return () => window.removeEventListener('unauthorized-redirect', handleUnauthorized);
    }, []);

    const toggleTheme = () => {
        setTheme(prev => {
            const next = prev === 'dark' ? 'light' : 'dark';
            showToast(`Switched to ${next === 'dark' ? 'Dark' : 'Light'} Mode.`, 'info');
            return next;
        });
    };

    const showToast = (message, type = 'success') => {
        const id = Date.now();
        setToasts(prev => [...prev, { id, message, type }]);
        setTimeout(() => {
            dismissToast(id);
        }, 4000);
    };

    const dismissToast = (id) => {
        setToasts(prev => prev.filter(toast => toast.id !== id));
    };

    const login = async (username, password) => {
        setGlobalLoading(true);
        try {
            const response = await api.login({ username, password });
            // The backend responds with { success: true, data: { token: '...', user: { id: ..., username: ..., role: ... } } }
            // Wait, let's verify if data is nested as response.data.data or response.data. Let's support both:
            const responseData = response.data.data || response.data;
            const { token, user } = responseData;

            if (token) {
                localStorage.setItem('gh_jwt_token', token);
                localStorage.setItem('gh_user_data', JSON.stringify(user || { name: 'Admin', role: 'admin' }));
                setToken(token);
                setUser(user || { name: 'Admin', role: 'admin' });
                showToast(`Welcome back, ${user?.full_name || user?.name || 'Admin'}!`, 'success');
                window.location.hash = '#dashboard';
                return true;
            } else {
                throw new Error('Invalid token received from server.');
            }
        } catch (error) {
            console.warn('Backend API login failed.', error);
            const errMsg = error.response?.data?.message || 'Authentication failed. Please check your credentials.';
            showToast(errMsg, 'error');
            return false;
        } finally {
            setGlobalLoading(false);
        }
    };

    const logout = () => {
        localStorage.removeItem('gh_jwt_token');
        localStorage.removeItem('gh_user_data');
        setToken(null);
        setUser(null);
        showToast('Logged out successfully', 'success');
        window.location.hash = '#login';
    };

    return (
        <AppContext.Provider value={{
            theme,
            toggleTheme,
            setTheme,
            user,
            token,
            activeView,
            setActiveView: (view) => { window.location.hash = `#${view}` },
            sidebarOpen,
            setSidebarOpen,
            toasts,
            showToast,
            dismissToast,
            globalLoading,
            setGlobalLoading,
            login,
            logout
        }}>
            {children}
            
            {/* Render Toasts dynamically */}
            <div id="toast-container">
                {toasts.map(toast => {
                    const borderCol = toast.type === 'success' ? 'border-emerald-500' : toast.type === 'error' ? 'border-rose-500' : 'border-amber-500';
                    const iconClass = toast.type === 'success' ? 'fa-circle-check text-emerald-400' 
                                    : toast.type === 'error' ? 'fa-triangle-exclamation text-rose-400' 
                                    : 'fa-circle-info text-amber-400';
                    return (
                        <div key={toast.id} className={`toast glass-panel p-4 flex items-start gap-3 text-sm animate-slide-in-right border-l-4 ${borderCol} transform translate-x-0`}>
                            <div className="flex-shrink-0 mt-0.5">
                                <i className={`fa-solid ${iconClass} text-lg`}></i>
                            </div>
                            <div className="flex-grow">
                                <div className="font-semibold text-slate-750 dark:text-slate-200 capitalize">{toast.type}</div>
                                <div className="text-slate-500 dark:text-slate-400 mt-0.5 leading-relaxed">{toast.message}</div>
                            </div>
                            <button onClick={() => dismissToast(toast.id)} className="flex-shrink-0 text-slate-450 hover:text-slate-600 dark:text-slate-550 dark:hover:text-slate-350 ml-1 transition-colors">
                                <i className="fa-solid fa-xmark"></i>
                            </button>
                        </div>
                    );
                })}
            </div>

            {/* Global spinner overlay */}
            {globalLoading && (
                <div id="global-spinner" className="fixed inset-0 bg-slate-950/80 z-[9999] flex items-center justify-center">
                    <div className="flex flex-col items-center">
                        <div className="w-12 h-12 border-4 border-brand-500 border-t-transparent rounded-full animate-spin"></div>
                        <span className="mt-4 text-slate-300 font-medium font-heading">Processing request...</span>
                    </div>
                </div>
            )}
        </AppContext.Provider>
    );
}

export function useApp() {
    return useContext(AppContext);
}
