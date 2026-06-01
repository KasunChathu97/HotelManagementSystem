// Main App Entry Point - State, Router, Layout, Toast Notifications
import api from './api.js';

// Apply saved theme early to prevent flash of wrong styling
function applySavedTheme() {
    const savedTheme = localStorage.getItem('theme') || 'dark';
    if (savedTheme === 'dark') {
        document.documentElement.classList.add('dark');
    } else {
        document.documentElement.classList.remove('dark');
    }
}
applySavedTheme();

// Global state
const state = {
    user: null,
    token: null,
    activeView: null,
    sidebarOpen: false
};

// Toast notification helper
export function showToast(message, type = 'success') {
    let container = document.getElementById('toast-container');
    if (!container) {
        container = document.createElement('div');
        container.id = 'toast-container';
        document.body.appendChild(container);
    }

    const toast = document.createElement('div');
    toast.className = `toast glass-panel p-4 flex items-start gap-3 text-sm animate-slide-in-right border-l-4 border-${type === 'success' ? 'emerald' : type === 'error' ? 'rose' : 'amber'}-500`;
    
    const iconClass = type === 'success' ? 'fa-circle-check text-emerald-400' 
                    : type === 'error' ? 'fa-triangle-exclamation text-rose-400' 
                    : 'fa-circle-info text-amber-400';

    toast.innerHTML = `
        <div class="flex-shrink-0 mt-0.5">
            <i class="fa-solid ${iconClass} text-lg"></i>
        </div>
        <div class="flex-grow">
            <div class="font-semibold text-slate-750 dark:text-slate-200 capitalize">${type}</div>
            <div class="text-slate-500 dark:text-slate-400 mt-0.5 leading-relaxed">${message}</div>
        </div>
        <button class="flex-shrink-0 text-slate-450 hover:text-slate-600 dark:text-slate-550 dark:hover:text-slate-350 ml-1 transition-colors">
            <i class="fa-solid fa-xmark"></i>
        </button>
    `;

    // Hook up dismiss button
    toast.querySelector('button').addEventListener('click', () => {
        dismissToast(toast);
    });

    container.appendChild(toast);

    // Auto-remove after 4 seconds
    setTimeout(() => {
        dismissToast(toast);
    }, 4000);
}

function dismissToast(toast) {
    toast.style.transform = 'translateX(105%)';
    toast.style.opacity = '0';
    setTimeout(() => {
        if (toast.parentNode) {
            toast.parentNode.removeChild(toast);
        }
    }, 300);
}

// Check session on load
function initSession() {
    const token = localStorage.getItem('gh_jwt_token');
    const userData = localStorage.getItem('gh_user_data');
    if (token && userData) {
        state.token = token;
        state.user = JSON.parse(userData);
    }
}

// Router map
const routes = {
    'login': { module: './views/login.js', title: 'Login' },
    'dashboard': { module: './views/dashboard.js', title: 'Dashboard Home' },
    'rooms': { module: './views/rooms.js', title: 'Room Management' },
    'bookings': { module: './views/bookings.js', title: 'Booking Management' },
    'customers': { module: './views/customers.js', title: 'Customer Management' },
    'payments': { module: './views/payments.js', title: 'Payment Management' },
    'expenses': { module: './views/expenses.js', title: 'Expense Management' },
    'reports': { module: './views/reports.js', title: 'Reports' },
    'settings': { module: './views/settings.js', title: 'Settings' },
    'users': { module: './views/users.js', title: 'User Management' },
};

// Get current hash route
function getRoute() {
    const hash = window.location.hash.replace('#', '') || 'dashboard';
    return routes[hash] ? hash : 'dashboard';
}

// Global Loading Indicator state
export function setGlobalLoading(isLoading) {
    const spinner = document.getElementById('global-spinner');
    if (spinner) {
        if (isLoading) {
            spinner.classList.remove('hidden');
        } else {
            spinner.classList.add('hidden');
        }
    }
}

// Main render function
async function router() {
    initSession();
    const route = getRoute();

    // Check Authentication Guard
    if (!state.token && route !== 'login') {
        window.location.hash = '#login';
        return;
    }
    if (state.token && route === 'login') {
        window.location.hash = '#dashboard';
        return;
    }

    state.activeView = route;
    document.title = `Grand Horizon | ${routes[route].title}`;

    const appRoot = document.getElementById('app-root');
    
    // Clear and render base shell if route is not login
    if (route === 'login') {
        appRoot.innerHTML = `<div id="login-container" class="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950 px-4 transition-colors duration-200"></div>`;
        const viewModule = await import(routes.login.module);
        viewModule.render(document.getElementById('login-container'));
    } else {
        // If not already in dashboard layout, render it
        if (!document.getElementById('dashboard-layout')) {
            renderDashboardLayout(appRoot);
        }
        
        // Highlight active sidebar navigation link
        updateActiveNavLink(route);

        // Close sidebar on mobile navigation
        state.sidebarOpen = false;
        toggleMobileSidebar(false);

        // Mount the view inside view container
        const viewContent = document.getElementById('view-content');
        
        // Show view loading skeleton
        renderSkeleton(viewContent);
        
        try {
            const viewModule = await import(routes[route].module);
            await viewModule.render(viewContent);
        } catch (error) {
            console.error('Error loading view:', error);
            viewContent.innerHTML = `
                <div class="flex flex-col items-center justify-center py-20 text-center">
                    <div class="w-16 h-16 rounded-full bg-rose-500/10 flex items-center justify-center text-rose-500 mb-4">
                        <i class="fa-solid fa-triangle-exclamation text-2xl"></i>
                    </div>
                    <h3 class="text-xl font-semibold text-slate-800 dark:text-slate-200">Failed to Load Page</h3>
                    <p class="text-slate-500 dark:text-slate-400 mt-2 max-w-md">There was an issue loading the ${routes[route].title} page. Please try refreshing or check your server connection.</p>
                    <button id="retry-load-btn" class="mt-6 px-4 py-2 bg-brand-600 hover:bg-brand-500 text-white rounded-lg transition-colors font-medium">
                        Retry Loading
                    </button>
                </div>
            `;
            document.getElementById('retry-load-btn')?.addEventListener('click', router);
        }
    }
}

// Render the main frame dashboard layout
function renderDashboardLayout(container) {
    const userRole = state.user?.role || 'Staff';
    const userName = state.user?.name || 'Administrator';
    const currentTheme = localStorage.getItem('theme') || 'dark';
    
    container.innerHTML = `
        <div id="dashboard-layout" class="flex h-screen overflow-hidden bg-slate-50 dark:bg-slate-950 transition-colors duration-200">
            <!-- Global spinner overlay -->
            <div id="global-spinner" class="fixed inset-0 bg-slate-950/80 z-[9999] flex items-center justify-center hidden">
                <div class="flex flex-col items-center">
                    <div class="w-12 h-12 border-4 border-brand-500 border-t-transparent rounded-full animate-spin"></div>
                    <span class="mt-4 text-slate-300 font-medium">Processing request...</span>
                </div>
            </div>

            <!-- Sidebar Backdrop for Mobile -->
            <div id="sidebar-backdrop" class="fixed inset-0 bg-slate-950/60 z-40 lg:hidden hidden transition-opacity duration-300"></div>

            <!-- Left Sidebar Navigation -->
            <aside id="sidebar-nav" class="fixed inset-y-0 left-0 z-50 w-64 bg-slate-900 border-r border-slate-800/80 flex flex-col justify-between transform -translate-x-full lg:translate-x-0 lg:static lg:h-full transition-transform duration-300 ease-in-out">
                <div>
                    <!-- Logo / Header -->
                    <div class="h-16 flex items-center gap-3 px-6 border-b border-slate-800/50">
                        <div class="w-9 h-9 rounded-lg bg-gradient-to-tr from-brand-600 to-indigo-500 flex items-center justify-center text-white shadow-lg shadow-brand-500/20">
                            <i class="fa-solid fa-hotel text-sm"></i>
                        </div>
                        <div>
                            <span class="font-bold text-lg text-slate-100 tracking-wide block leading-none font-heading">Grand Horizon</span>
                            <span class="text-[10px] uppercase tracking-widest text-slate-400 font-bold">Admin Portal</span>
                        </div>
                    </div>

                    <!-- Navigation Links -->
                    <nav class="p-4 space-y-1.5 overflow-y-auto max-h-[calc(100vh-12rem)]">
                        <a href="#dashboard" data-route="dashboard" class="flex items-center gap-3.5 px-4 py-3 rounded-xl text-slate-400 hover:text-slate-100 hover:bg-slate-800/40 transition-all font-medium">
                            <i class="fa-solid fa-chart-pie w-5 text-center"></i>
                            <span>Dashboard Home</span>
                        </a>
                        <a href="#rooms" data-route="rooms" class="flex items-center gap-3.5 px-4 py-3 rounded-xl text-slate-400 hover:text-slate-100 hover:bg-slate-800/40 transition-all font-medium">
                            <i class="fa-solid fa-door-open w-5 text-center"></i>
                            <span>Room Management</span>
                        </a>
                        <a href="#bookings" data-route="bookings" class="flex items-center gap-3.5 px-4 py-3 rounded-xl text-slate-400 hover:text-slate-100 hover:bg-slate-800/40 transition-all font-medium">
                            <i class="fa-solid fa-calendar-check w-5 text-center"></i>
                            <span>Booking Management</span>
                        </a>
                        <a href="#customers" data-route="customers" class="flex items-center gap-3.5 px-4 py-3 rounded-xl text-slate-400 hover:text-slate-100 hover:bg-slate-800/40 transition-all font-medium">
                            <i class="fa-solid fa-users w-5 text-center"></i>
                            <span>Customer Management</span>
                        </a>
                        <a href="#payments" data-route="payments" class="flex items-center gap-3.5 px-4 py-3 rounded-xl text-slate-400 hover:text-slate-100 hover:bg-slate-800/40 transition-all font-medium">
                            <i class="fa-solid fa-receipt w-5 text-center"></i>
                            <span>Payment Management</span>
                        </a>
                        <a href="#expenses" data-route="expenses" class="flex items-center gap-3.5 px-4 py-3 rounded-xl text-slate-400 hover:text-slate-100 hover:bg-slate-800/40 transition-all font-medium">
                            <i class="fa-solid fa-wallet w-5 text-center"></i>
                            <span>Expense Management</span>
                        </a>
                        <a href="#reports" data-route="reports" class="flex items-center gap-3.5 px-4 py-3 rounded-xl text-slate-400 hover:text-slate-100 hover:bg-slate-800/40 transition-all font-medium">
                            <i class="fa-solid fa-file-invoice-dollar w-5 text-center"></i>
                            <span>Reports</span>
                        </a>
                        <a href="#settings" data-route="settings" class="flex items-center gap-3.5 px-4 py-3 rounded-xl text-slate-400 hover:text-slate-100 hover:bg-slate-800/40 transition-all font-medium">
                            <i class="fa-solid fa-sliders w-5 text-center"></i>
                            <span>Settings</span>
                        </a>
                        
                        <!-- Admin Specific route -->
                        ${userRole.toLowerCase() === 'admin' ? `
                        <div class="pt-4 pb-1">
                            <p class="px-4 text-[10px] uppercase font-bold text-slate-500 tracking-wider">System Administration</p>
                        </div>
                        <a href="#users" data-route="users" class="flex items-center gap-3.5 px-4 py-3 rounded-xl text-slate-400 hover:text-slate-100 hover:bg-slate-800/40 transition-all font-medium">
                            <i class="fa-solid fa-user-gear w-5 text-center"></i>
                            <span>User Management</span>
                        </a>
                        ` : ''}
                    </nav>
                </div>

                <!-- Footer User details -->
                <div class="p-4 border-t border-slate-800/50 bg-slate-900/50">
                    <div class="flex items-center gap-3 p-2 bg-slate-950/40 rounded-xl border border-slate-800/30">
                        <div class="w-10 h-10 rounded-lg bg-brand-500/10 border border-brand-500/30 flex items-center justify-center text-brand-400 font-bold uppercase">
                            ${userName.charAt(0)}
                        </div>
                        <div class="flex-grow min-w-0">
                            <p class="text-sm font-semibold text-slate-200 truncate leading-tight">${userName}</p>
                            <span class="inline-block text-[10px] px-1.5 py-0.5 rounded-md font-bold mt-1 tracking-wide ${userRole.toLowerCase() === 'admin' ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20' : 'bg-slate-800 text-slate-400'}">${userRole}</span>
                        </div>
                        <button id="logout-btn" class="p-2 text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition-all" title="Logout">
                            <i class="fa-solid fa-power-off text-sm"></i>
                        </button>
                    </div>
                </div>
            </aside>

            <!-- Main Work Content Area -->
            <div class="flex-grow flex flex-col min-w-0 overflow-y-auto">
                <!-- Header / Topbar -->
                <header class="h-16 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800/50 px-6 flex items-center justify-between sticky top-0 z-30 transition-colors duration-200">
                    <div class="flex items-center gap-4">
                        <button id="sidebar-toggle-btn" class="lg:hidden p-2 text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors">
                            <i class="fa-solid fa-bars text-lg"></i>
                        </button>
                        <h2 id="page-title" class="text-lg font-bold text-slate-800 dark:text-slate-100 hidden sm:block font-heading">Dashboard</h2>
                    </div>

                    <!-- Topbar Controls -->
                    <div class="flex items-center gap-3">
                        <!-- Theme Toggle Button -->
                        <button id="theme-toggle-btn" class="p-2 text-slate-500 hover:text-slate-800 dark:text-slate-450 dark:hover:text-slate-250 hover:bg-slate-100 dark:hover:bg-slate-850 rounded-xl transition-all" title="Toggle Theme Mode">
                            <i class="fa-solid ${currentTheme === 'dark' ? 'fa-sun' : 'fa-moon'} text-base" id="theme-icon"></i>
                        </button>
                        
                        <!-- Date Display -->
                        <div class="hidden md:flex items-center gap-2 text-slate-500 dark:text-slate-400 text-sm px-3 py-1.5 bg-slate-100 dark:bg-slate-950/40 border border-slate-200 dark:border-slate-800/50 rounded-xl transition-all">
                            <i class="fa-solid fa-calendar-days text-brand-550 dark:text-brand-400"></i>
                            <span id="header-date">May 28, 2026</span>
                        </div>
                        <!-- Status indicator -->
                        <div class="flex items-center gap-2 text-xs font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-500/10 px-3 py-1.5 border border-emerald-200 dark:border-emerald-500/25 rounded-xl transition-all">
                            <span class="w-1.5 h-1.5 rounded-full bg-emerald-500 dark:bg-emerald-400 animate-pulse"></span>
                            <span>Online</span>
                        </div>
                    </div>
                </header>

                <!-- Page view placeholder -->
                <main id="view-content" class="p-6 max-w-7xl w-full mx-auto animate-fade-in flex-grow">
                    <!-- Loaded dynamic view -->
                </main>
            </div>
        </div>
    `;

    // Hook events
    document.getElementById('logout-btn').addEventListener('click', performLogout);
    
    // Theme toggle click handler
    document.getElementById('theme-toggle-btn').addEventListener('click', toggleTheme);
    
    // Mobile sidebar triggers
    const toggleBtn = document.getElementById('sidebar-toggle-btn');
    const backdrop = document.getElementById('sidebar-backdrop');
    
    toggleBtn.addEventListener('click', () => {
        state.sidebarOpen = !state.sidebarOpen;
        toggleMobileSidebar(state.sidebarOpen);
    });
    
    backdrop.addEventListener('click', () => {
        state.sidebarOpen = false;
        toggleMobileSidebar(false);
    });

    // Setup Header Date
    const dateOptions = { weekday: 'short', year: 'numeric', month: 'short', day: 'numeric' };
    document.getElementById('header-date').innerText = new Date().toLocaleDateString('en-US', dateOptions);
}

function toggleTheme() {
    const isDark = document.documentElement.classList.contains('dark');
    const themeIcon = document.getElementById('theme-icon');
    
    if (isDark) {
        document.documentElement.classList.remove('dark');
        localStorage.setItem('theme', 'light');
        if (themeIcon) {
            themeIcon.classList.remove('fa-sun');
            themeIcon.classList.add('fa-moon');
        }
        showToast('Switched to Light Mode.', 'info');
        window.dispatchEvent(new CustomEvent('theme-changed', { detail: { theme: 'light' } }));
    } else {
        document.documentElement.classList.add('dark');
        localStorage.setItem('theme', 'dark');
        if (themeIcon) {
            themeIcon.classList.remove('fa-moon');
            themeIcon.classList.add('fa-sun');
        }
        showToast('Switched to Dark Mode.', 'info');
        window.dispatchEvent(new CustomEvent('theme-changed', { detail: { theme: 'dark' } }));
    }
}

// Show loading skeletons for better user experience
function renderSkeleton(container) {
    container.innerHTML = `
        <div class="space-y-6 animate-pulse">
            <div class="h-8 bg-slate-200 dark:bg-slate-800 w-1/4 rounded-lg"></div>
            <div class="grid grid-cols-1 md:grid-cols-4 gap-6">
                <div class="h-28 bg-slate-250 dark:bg-slate-800 rounded-2xl"></div>
                <div class="h-28 bg-slate-250 dark:bg-slate-800 rounded-2xl"></div>
                <div class="h-28 bg-slate-250 dark:bg-slate-800 rounded-2xl"></div>
                <div class="h-28 bg-slate-250 dark:bg-slate-800 rounded-2xl"></div>
            </div>
            <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div class="h-80 bg-slate-250 dark:bg-slate-800 rounded-2xl lg:col-span-2"></div>
                <div class="h-80 bg-slate-250 dark:bg-slate-800 rounded-2xl"></div>
            </div>
        </div>
    `;
}

function toggleMobileSidebar(isOpen) {
    const sidebar = document.getElementById('sidebar-nav');
    const backdrop = document.getElementById('sidebar-backdrop');
    
    if (isOpen) {
        sidebar.classList.remove('-translate-x-full');
        backdrop.classList.remove('hidden');
        setTimeout(() => backdrop.classList.add('opacity-100'), 20);
    } else {
        sidebar.classList.add('-translate-x-full');
        backdrop.classList.remove('opacity-100');
        setTimeout(() => backdrop.classList.add('hidden'), 300);
    }
}

function updateActiveNavLink(route) {
    const navLinks = document.querySelectorAll('#sidebar-nav nav a');
    navLinks.forEach(link => {
        if (link.getAttribute('data-route') === route) {
            link.className = 'flex items-center gap-3.5 px-4 py-3 rounded-xl text-slate-100 nav-link-active font-semibold transition-all';
        } else {
            link.className = 'flex items-center gap-3.5 px-4 py-3 rounded-xl text-slate-400 hover:text-slate-100 hover:bg-slate-800/40 transition-all font-medium';
        }
    });

    const pageTitleMap = {
        'dashboard': 'Dashboard Home',
        'rooms': 'Room Management',
        'bookings': 'Booking Management',
        'customers': 'Customer Management',
        'payments': 'Payment Management',
        'expenses': 'Expense & Utility Management',
        'reports': 'Reports & Analytics',
        'users': 'User Account Management',
    };
    
    const pageTitle = document.getElementById('page-title');
    if (pageTitle) {
        pageTitle.innerText = pageTitleMap[route] || 'Grand Horizon';
    }
}

function performLogout() {
    localStorage.removeItem('gh_jwt_token');
    localStorage.removeItem('gh_user_data');
    state.token = null;
    state.user = null;
    showToast('Logged out successfully', 'success');
    window.location.hash = '#login';
}

// Listen for global auth redirect event
window.addEventListener('unauthorized-redirect', () => {
    state.token = null;
    state.user = null;
    showToast('Session expired. Please log in again.', 'error');
    window.location.hash = '#login';
});

// App initialization
window.addEventListener('hashchange', router);
window.addEventListener('DOMContentLoaded', router);
export { state };
