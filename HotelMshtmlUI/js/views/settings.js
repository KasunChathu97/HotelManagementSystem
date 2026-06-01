// Settings View Module
import { showToast, setGlobalLoading } from '../app.js';

export async function render(container) {
    const currentTheme = localStorage.getItem('theme') || 'dark';
    
    // Load simulated hotel settings values
    const hotelName = localStorage.getItem('gh_hotel_name') || 'Grand Horizon Resort';
    const hotelEmail = localStorage.getItem('gh_hotel_email') || 'operations@grandhorizon.com';
    const hotelPhone = localStorage.getItem('gh_hotel_phone') || '+1 (555) 019-2830';
    const checkInPolicy = localStorage.getItem('gh_hotel_checkin') || '14:00';
    const checkOutPolicy = localStorage.getItem('gh_hotel_checkout') || '12:00';

    container.innerHTML = `
        <div class="space-y-6">
            <!-- Page Header -->
            <div>
                <h1 class="text-2xl font-bold text-slate-800 dark:text-slate-100 tracking-tight font-heading">Portal Settings</h1>
                <p class="text-sm text-slate-500 dark:text-slate-400">Manage portal themes, hotel configurations, and parameters.</p>
            </div>

            <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <!-- Left Column: Theme / Appearance Setup (Span 2) -->
                <div class="lg:col-span-2 space-y-6">
                    <!-- Theme Selector Card -->
                    <div class="glass-panel p-6 rounded-2xl border border-slate-200 dark:border-slate-800/80 shadow-lg">
                        <h3 class="text-base font-bold text-slate-800 dark:text-slate-200 font-heading mb-1"><i class="fa-solid fa-palette text-brand-500 mr-2"></i>Appearance & Theme</h3>
                        <p class="text-xs text-slate-500 dark:text-slate-400 mb-6">Choose between light and dark modes for your admin interface.</p>
                        
                        <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <!-- Light Mode option card -->
                            <button id="set-light-theme-btn" class="flex flex-col items-center justify-between p-4 rounded-xl border transition-all text-left ${currentTheme === 'light' ? 'border-brand-500 bg-brand-50/10 shadow-lg shadow-brand-500/5' : 'border-slate-200 dark:border-slate-800 hover:border-slate-350 dark:hover:border-slate-700 bg-slate-100/50 dark:bg-slate-900/30'}">
                                <div class="w-full flex items-center justify-between mb-3">
                                    <span class="text-sm font-bold text-slate-800 dark:text-slate-200">Light Mode</span>
                                    <div class="w-4 h-4 rounded-full border border-slate-355 dark:border-slate-655 flex items-center justify-center p-0.5">
                                        <div class="w-full h-full rounded-full bg-brand-500 ${currentTheme === 'light' ? '' : 'hidden'}" id="light-dot"></div>
                                    </div>
                                </div>
                                <div class="w-full h-24 rounded-lg bg-slate-50 border border-slate-200 flex flex-col justify-between p-2 overflow-hidden shadow-inner">
                                    <!-- Visual preview markup -->
                                    <div class="flex items-center gap-1.5 border-b border-slate-200 pb-1">
                                        <div class="w-3 h-3 rounded-full bg-brand-500"></div>
                                        <div class="h-2 bg-slate-300 w-12 rounded"></div>
                                    </div>
                                    <div class="flex gap-2">
                                        <div class="w-1/3 h-10 rounded bg-white border border-slate-200 shadow-sm"></div>
                                        <div class="w-2/3 h-10 rounded bg-white border border-slate-200 shadow-sm"></div>
                                    </div>
                                </div>
                            </button>

                            <!-- Dark Mode option card -->
                            <button id="set-dark-theme-btn" class="flex flex-col items-center justify-between p-4 rounded-xl border transition-all text-left ${currentTheme === 'dark' ? 'border-brand-500 bg-brand-950/10 shadow-lg shadow-brand-500/10' : 'border-slate-200 dark:border-slate-800 hover:border-slate-350 dark:hover:border-slate-700 bg-slate-100/50 dark:bg-slate-900/30'}">
                                <div class="w-full flex items-center justify-between mb-3">
                                    <span class="text-sm font-bold text-slate-800 dark:text-slate-200">Dark Mode</span>
                                    <div class="w-4 h-4 rounded-full border border-slate-355 dark:border-slate-655 flex items-center justify-center p-0.5">
                                        <div class="w-full h-full rounded-full bg-brand-500 ${currentTheme === 'dark' ? '' : 'hidden'}" id="dark-dot"></div>
                                    </div>
                                </div>
                                <div class="w-full h-24 rounded-lg bg-slate-950 border border-slate-800 flex flex-col justify-between p-2 overflow-hidden shadow-inner">
                                    <!-- Visual preview markup -->
                                    <div class="flex items-center gap-1.5 border-b border-slate-800 pb-1">
                                        <div class="w-3 h-3 rounded-full bg-brand-500"></div>
                                        <div class="h-2 bg-slate-700 w-12 rounded"></div>
                                    </div>
                                    <div class="flex gap-2">
                                        <div class="w-1/3 h-10 rounded bg-slate-900 border border-slate-800"></div>
                                        <div class="w-2/3 h-10 rounded bg-slate-900 border border-slate-800"></div>
                                    </div>
                                </div>
                            </button>
                        </div>
                    </div>

                    <!-- Hotel Configurations Form -->
                    <div class="glass-panel p-6 rounded-2xl border border-slate-200 dark:border-slate-800/80 shadow-lg">
                        <h3 class="text-base font-bold text-slate-800 dark:text-slate-200 font-heading mb-1"><i class="fa-solid fa-hotel text-brand-500 mr-2"></i>Hotel Configurations</h3>
                        <p class="text-xs text-slate-500 dark:text-slate-400 mb-6">Update general resort data and stay policies.</p>
                        
                        <form id="hotel-settings-form" class="space-y-4">
                            <div>
                                <label for="setting-hotel-name" class="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1.5">Resort Name</label>
                                <input type="text" id="setting-hotel-name" required value="${hotelName}"
                                    class="w-full px-3.5 py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-800 dark:text-slate-200 focus:border-brand-500 transition-all text-sm">
                            </div>

                            <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div>
                                    <label for="setting-hotel-email" class="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1.5">Contact Email</label>
                                    <input type="email" id="setting-hotel-email" required value="${hotelEmail}"
                                        class="w-full px-3.5 py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-800 dark:text-slate-200 focus:border-brand-500 transition-all text-sm">
                                </div>
                                <div>
                                    <label for="setting-hotel-phone" class="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1.5">Phone Number</label>
                                    <input type="text" id="setting-hotel-phone" required value="${hotelPhone}"
                                        class="w-full px-3.5 py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-800 dark:text-slate-200 focus:border-brand-500 transition-all text-sm">
                                </div>
                            </div>

                            <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div>
                                    <label for="setting-hotel-checkin" class="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1.5">Check-in Time Policy</label>
                                    <input type="time" id="setting-hotel-checkin" required value="${checkInPolicy}"
                                        class="w-full px-3.5 py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-800 dark:text-slate-200 focus:border-brand-500 transition-all text-sm">
                                </div>
                                <div>
                                    <label for="setting-hotel-checkout" class="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1.5">Check-out Time Policy</label>
                                    <input type="time" id="setting-hotel-checkout" required value="${checkOutPolicy}"
                                        class="w-full px-3.5 py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-800 dark:text-slate-200 focus:border-brand-500 transition-all text-sm">
                                </div>
                            </div>

                            <div class="pt-4 border-t border-slate-200 dark:border-slate-800/50 flex justify-end">
                                <button type="submit" class="px-5 py-2.5 bg-brand-600 hover:bg-brand-500 text-white font-semibold rounded-xl text-sm transition-all shadow-md shadow-brand-500/10 hover:shadow-brand-500/20">
                                    Save Configurations
                                </button>
                            </div>
                        </form>
                    </div>
                </div>

                <!-- Right Column: Portal Info Card -->
                <div class="space-y-6">
                    <div class="glass-panel p-6 rounded-2xl border border-slate-200 dark:border-slate-800/80 shadow-lg">
                        <h3 class="text-base font-bold text-slate-800 dark:text-slate-200 font-heading mb-4">System Information</h3>
                        <div class="space-y-3.5 text-sm">
                            <div class="flex justify-between border-b border-slate-100 dark:border-slate-850 pb-2">
                                <span class="text-slate-500 dark:text-slate-400">Portal Version</span>
                                <span class="font-bold text-slate-800 dark:text-slate-200">v1.2.4</span>
                            </div>
                            <div class="flex justify-between border-b border-slate-100 dark:border-slate-850 pb-2">
                                <span class="text-slate-500 dark:text-slate-400">Server Connection</span>
                                <span class="font-bold text-emerald-500">Connected</span>
                            </div>
                            <div class="flex justify-between border-b border-slate-100 dark:border-slate-850 pb-2">
                                <span class="text-slate-500 dark:text-slate-400">API Host</span>
                                <span class="font-mono text-xs text-slate-800 dark:text-slate-350">localhost:5000</span>
                            </div>
                            <div class="flex justify-between pb-1">
                                <span class="text-slate-500 dark:text-slate-400">Last System Sync</span>
                                <span class="text-xs text-slate-800 dark:text-slate-200" id="setting-sync-time">Just now</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `;

    // Hook themes selectors
    document.getElementById('set-light-theme-btn').addEventListener('click', () => setThemeMode('light'));
    document.getElementById('set-dark-theme-btn').addEventListener('click', () => setThemeMode('dark'));
    document.getElementById('hotel-settings-form').addEventListener('submit', saveHotelSettings);
    
    // Set formatted time
    document.getElementById('setting-sync-time').innerText = new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
}

function setThemeMode(theme) {
    const isDark = document.documentElement.classList.contains('dark');
    const themeIcon = document.getElementById('theme-icon');
    
    if (theme === 'light') {
        if (isDark) {
            document.documentElement.classList.remove('dark');
            localStorage.setItem('theme', 'light');
            if (themeIcon) {
                themeIcon.className = 'fa-solid fa-moon text-base';
            }
            showToast('Switched to Light Mode.', 'info');
            refreshSelectionCards('light');
            window.dispatchEvent(new CustomEvent('theme-changed', { detail: { theme: 'light' } }));
        }
    } else {
        if (!isDark) {
            document.documentElement.classList.add('dark');
            localStorage.setItem('theme', 'dark');
            if (themeIcon) {
                themeIcon.className = 'fa-solid fa-sun text-base';
            }
            showToast('Switched to Dark Mode.', 'info');
            refreshSelectionCards('dark');
            window.dispatchEvent(new CustomEvent('theme-changed', { detail: { theme: 'dark' } }));
        }
    }
}

function refreshSelectionCards(activeTheme) {
    const lightBtn = document.getElementById('set-light-theme-btn');
    const darkBtn = document.getElementById('set-dark-theme-btn');
    const lightDot = document.getElementById('light-dot');
    const darkDot = document.getElementById('dark-dot');

    if (activeTheme === 'light') {
        lightBtn.className = "flex flex-col items-center justify-between p-4 rounded-xl border border-brand-500 bg-brand-50/10 shadow-lg shadow-brand-500/5 text-left transition-all";
        darkBtn.className = "flex flex-col items-center justify-between p-4 rounded-xl border border-slate-200 dark:border-slate-800 hover:border-slate-350 dark:hover:border-slate-700 bg-slate-100/50 dark:bg-slate-900/30 text-left transition-all";
        lightDot.classList.remove('hidden');
        darkDot.classList.add('hidden');
    } else {
        lightBtn.className = "flex flex-col items-center justify-between p-4 rounded-xl border border-slate-200 dark:border-slate-800 hover:border-slate-350 dark:hover:border-slate-700 bg-slate-100/50 dark:bg-slate-900/30 text-left transition-all";
        darkBtn.className = "flex flex-col items-center justify-between p-4 rounded-xl border border-brand-500 bg-brand-950/10 shadow-lg shadow-brand-500/10 text-left transition-all";
        lightDot.classList.add('hidden');
        darkDot.classList.remove('hidden');
    }
}

function saveHotelSettings(e) {
    e.preventDefault();
    
    const hotelName = document.getElementById('setting-hotel-name').value.trim();
    const hotelEmail = document.getElementById('setting-hotel-email').value.trim();
    const hotelPhone = document.getElementById('setting-hotel-phone').value.trim();
    const checkInPolicy = document.getElementById('setting-hotel-checkin').value;
    const checkOutPolicy = document.getElementById('setting-hotel-checkout').value;

    setGlobalLoading(true);

    setTimeout(() => {
        localStorage.setItem('gh_hotel_name', hotelName);
        localStorage.setItem('gh_hotel_email', hotelEmail);
        localStorage.setItem('gh_hotel_phone', hotelPhone);
        localStorage.setItem('gh_hotel_checkin', checkInPolicy);
        localStorage.setItem('gh_hotel_checkout', checkOutPolicy);

        // Update brand headers dynamically if needed
        showToast('Hotel configurations updated successfully.', 'success');
        setGlobalLoading(false);
    }, 800);
}
