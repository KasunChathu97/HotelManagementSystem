// User Management & Audit Logs View Module
import api from '../api.js';
import { state, showToast, setGlobalLoading } from '../app.js';

let usersList = [];
let auditLogs = [];

export async function render(container) {
    // Check Authorization Role Guard
    const userRole = state.user?.role || '';
    if (userRole.toLowerCase() !== 'admin') {
        container.innerHTML = `
            <div class="flex flex-col items-center justify-center py-20 text-center">
                <div class="w-16 h-16 rounded-full bg-amber-500/10 flex items-center justify-center text-amber-500 mb-4 border border-amber-500/20">
                    <i class="fa-solid fa-shield-halved text-2xl"></i>
                </div>
                <h3 class="text-xl font-bold text-slate-200 font-heading">Access Restricted</h3>
                <p class="text-slate-400 mt-2 max-w-md text-sm font-medium">The User Management view is restricted to administrators only. Your account level is currently flagged as ${userRole || 'Unauthorized'}.</p>
                <a href="#dashboard" class="mt-6 px-4 py-2 bg-slate-900 border border-slate-800 hover:bg-slate-800 text-slate-200 font-semibold rounded-xl text-sm transition-colors">
                    Return to Dashboard
                </a>
            </div>
        `;
        return;
    }

    container.innerHTML = `
        <div class="space-y-8">
            <!-- Header -->
            <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 class="text-2xl font-bold text-slate-100 tracking-tight font-heading">User Directory & Audits</h1>
                    <p class="text-sm text-slate-400">Configure administrative access credentials and review database audit traces.</p>
                </div>
                <button id="add-user-btn" class="px-4 py-2 bg-brand-600 hover:bg-brand-500 text-white rounded-xl shadow-md shadow-brand-500/10 hover:shadow-brand-500/20 font-semibold transition-all flex items-center gap-2 text-sm">
                    <i class="fa-solid fa-user-plus text-xs"></i>
                    <span>Create User</span>
                </button>
            </div>

            <div class="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <!-- User Directory Panel (Span 2) -->
                <div class="glass-panel rounded-2xl border border-slate-800/80 shadow-lg lg:col-span-2 overflow-hidden flex flex-col">
                    <div class="p-6 border-b border-slate-800/60">
                        <h3 class="text-base font-bold text-slate-200 font-heading">Active Staff Directory</h3>
                    </div>
                    <div class="overflow-x-auto">
                        <table class="w-full text-left border-collapse">
                            <thead>
                                <tr class="bg-slate-900/50 text-slate-400 text-[10px] font-bold tracking-wider uppercase border-b border-slate-800/40">
                                    <th class="py-3 px-6">Name</th>
                                    <th class="py-3 px-6">Username</th>
                                    <th class="py-3 px-6">Role</th>
                                    <th class="py-3 px-6 text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody id="users-tbody" class="divide-y divide-slate-800/40 text-sm text-slate-300">
                                <tr>
                                    <td colspan="4" class="py-8 text-center text-slate-500">Retrieving system users...</td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                </div>

                <!-- System Audit Logs Panel -->
                <div class="glass-panel rounded-2xl border border-slate-800/80 shadow-lg overflow-hidden flex flex-col h-[400px]">
                    <div class="p-6 border-b border-slate-800/60">
                        <h3 class="text-base font-bold text-slate-200 font-heading">Security Audit Trail</h3>
                    </div>
                    <div class="overflow-y-auto flex-grow p-4 space-y-4" id="audit-logs-container">
                        <p class="text-center text-xs text-slate-500 py-8">Retrieving audit trace...</p>
                    </div>
                </div>
            </div>
        </div>

        <!-- Add/Edit User Modal Backdrop -->
        <div id="user-modal" class="fixed inset-0 z-50 bg-slate-950/75 flex items-center justify-center hidden p-4">
            <div class="glass-panel w-full max-w-md rounded-2xl border border-slate-800/80 shadow-2xl relative overflow-hidden animate-fade-in">
                <div class="absolute top-0 left-0 w-full h-[3px] bg-gradient-to-r from-brand-500 to-indigo-500"></div>

                <div class="p-6 border-b border-slate-800/50 flex justify-between items-center">
                    <h3 id="user-modal-title" class="text-base font-bold text-slate-100 font-heading">Create Portal User</h3>
                    <button id="close-user-modal-btn" class="text-slate-400 hover:text-slate-200 transition-colors">
                        <i class="fa-solid fa-xmark text-lg"></i>
                    </button>
                </div>

                <form id="user-form" class="p-6 space-y-4">
                    <input type="hidden" id="user-id">

                    <div>
                        <label for="user-name" class="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1.5">User Full Name</label>
                        <input type="text" id="user-name" required placeholder="e.g. Liam Smith"
                            class="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-800 rounded-xl text-slate-200 focus:border-brand-500 transition-all text-sm">
                    </div>

                    <div>
                        <label for="user-username" class="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1.5">Username</label>
                        <input type="text" id="user-username" required placeholder="e.g. liam_smith"
                            class="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-800 rounded-xl text-slate-200 focus:border-brand-500 transition-all text-sm">
                    </div>

                    <div class="grid grid-cols-2 gap-4">
                        <div>
                            <label for="user-role" class="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1.5">Role Type</label>
                            <select id="user-role" required
                                class="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-800 rounded-xl text-slate-200 focus:border-brand-500 transition-all text-sm">
                                <option value="Staff">Staff</option>
                                <option value="Admin">Admin</option>
                            </select>
                        </div>
                        <div>
                            <label for="user-password" class="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1.5" id="pwd-label">Password</label>
                            <input type="password" id="user-password" required placeholder="••••••••"
                                class="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-800 rounded-xl text-slate-200 focus:border-brand-500 transition-all text-sm">
                        </div>
                    </div>

                    <div class="pt-4 border-t border-slate-800/50 flex justify-end gap-3">
                        <button type="button" id="cancel-user-btn" class="px-4 py-2 border border-slate-800 hover:bg-slate-900 text-slate-300 font-semibold rounded-xl text-sm transition-all">
                            Cancel
                        </button>
                        <button type="submit" class="px-4 py-2 bg-brand-600 hover:bg-brand-500 text-white font-semibold rounded-xl text-sm transition-all">
                            Save User
                        </button>
                    </div>
                </form>
            </div>
        </div>
    `;

    // Hook listeners
    document.getElementById('add-user-btn').addEventListener('click', () => openUserModal());
    document.getElementById('close-user-modal-btn').addEventListener('click', closeUserModal);
    document.getElementById('cancel-user-btn').addEventListener('click', closeUserModal);
    document.getElementById('user-form').addEventListener('submit', handleUserSubmit);

    // Initial loads
    await fetchUsersData();
}

async function fetchUsersData() {
    try {
        const [usersRes, auditRes] = await Promise.all([
            api.getAdminUsers(),
            api.getAuditLogs()
        ]);

        usersList = usersRes.data;
        auditLogs = auditRes.data;

        renderUsersTable(usersList);
        renderAuditLogs(auditLogs);
    } catch (error) {
        console.error('Error fetching admin directory:', error);
        showToast('Error retrieving administration details. Rendering simulation models.', 'warning');
        loadFallbackUsers();
    }
}

function renderUsersTable(users) {
    const tbody = document.getElementById('users-tbody');
    if (!users || users.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="4" class="py-8 text-center text-slate-500">No portal users configured.</td>
            </tr>
        `;
        return;
    }

    tbody.innerHTML = users.map(u => `
        <tr class="hover:bg-slate-900/30 transition-colors">
            <td class="py-4 px-6 font-semibold text-slate-200">${u.name}</td>
            <td class="py-4 px-6 font-mono text-slate-400">${u.username}</td>
            <td class="py-4 px-6">
                <span class="inline-block px-2.5 py-0.5 rounded-md text-xs font-bold border ${u.role?.toLowerCase() === 'admin' ? 'bg-amber-500/10 text-amber-400 border-amber-500/20' : 'bg-slate-800 text-slate-400 border-slate-700/50'}">
                    ${u.role}
                </span>
            </td>
            <td class="py-4 px-6 text-right">
                <div class="flex items-center justify-end gap-2">
                    <button class="edit-user-btn p-2 text-slate-400 hover:text-brand-400 hover:bg-slate-800/80 rounded-lg transition-all" data-id="${u.id || u._id}">
                        <i class="fa-solid fa-user-pen text-sm"></i>
                    </button>
                    <button class="delete-user-btn p-2 text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition-all" data-id="${u.id || u._id}">
                        <i class="fa-solid fa-trash-can text-sm"></i>
                    </button>
                </div>
            </td>
        </tr>
    `).join('');

    // Attach actions
    document.querySelectorAll('.edit-user-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const id = btn.getAttribute('data-id');
            const user = usersList.find(u => (u.id || u._id) == id);
            if (user) openUserModal(user);
        });
    });

    document.querySelectorAll('.delete-user-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const id = btn.getAttribute('data-id');
            confirmDeleteUser(id);
        });
    });
}

function renderAuditLogs(logs) {
    const container = document.getElementById('audit-logs-container');
    if (!logs || logs.length === 0) {
        container.innerHTML = `<p class="text-center text-xs text-slate-500 py-8">No recent activities logged.</p>`;
        return;
    }

    container.innerHTML = logs.map(l => {
        const timeVal = new Date(l.timestamp || l.createdAt);
        const timeFmt = timeVal.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }) + ' ' + timeVal.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
        
        return `
            <div class="p-3 bg-slate-950/40 border border-slate-900 rounded-xl space-y-1">
                <div class="flex justify-between items-center text-[10px]">
                    <span class="font-bold text-slate-400 uppercase tracking-wider">${l.username || 'System'}</span>
                    <span class="text-slate-500 font-semibold">${timeFmt}</span>
                </div>
                <p class="text-xs text-slate-300 font-medium">${l.action || l.activity}</p>
                <div class="text-[9px] text-slate-500 tracking-wide font-mono truncate">${l.details || ''}</div>
            </div>
        `;
    }).join('');
}

function openUserModal(user = null) {
    const modal = document.getElementById('user-modal');
    const form = document.getElementById('user-form');
    const title = document.getElementById('user-modal-title');
    const pwdInput = document.getElementById('user-password');
    const pwdLabel = document.getElementById('pwd-label');

    form.reset();

    if (user) {
        title.innerText = 'Modify Portal Access';
        document.getElementById('user-id').value = user.id || user._id;
        document.getElementById('user-name').value = user.name;
        document.getElementById('user-username').value = user.username;
        document.getElementById('user-role').value = user.role;
        
        pwdLabel.innerText = 'New Password (Optional)';
        pwdInput.required = false;
    } else {
        title.innerText = 'Create Portal User';
        document.getElementById('user-id').value = '';
        pwdLabel.innerText = 'Password';
        pwdInput.required = true;
    }

    modal.classList.remove('hidden');
}

function closeUserModal() {
    document.getElementById('user-modal').classList.add('hidden');
}

async function handleUserSubmit(e) {
    e.preventDefault();

    const id = document.getElementById('user-id').value;
    const userData = {
        name: document.getElementById('user-name').value.trim(),
        username: document.getElementById('user-username').value.trim(),
        role: document.getElementById('user-role').value,
    };

    const pwdVal = document.getElementById('user-password').value;
    if (pwdVal) {
        userData.password = pwdVal;
    }

    setGlobalLoading(true);
    try {
        if (id) {
            await api.updateAdminUser(id, userData);
            showToast(`User accounts credentials for ${userData.name} updated.`, 'success');
        } else {
            await api.createAdminUser(userData);
            showToast(`User ${userData.name} successfully registered.`, 'success');
        }
        closeUserModal();
        await fetchUsersData();
    } catch (error) {
        console.error('Error saving user profile:', error);
        showToast(error.response?.data?.message || 'Error processing request.', 'error');
    } finally {
        setGlobalLoading(false);
    }
}

async function confirmDeleteUser(id) {
    const user = usersList.find(u => (u.id || u._id) == id);
    if (!user) return;

    if (confirm(`Remove portal access for user "${user.name}"? This closes active sessions.`)) {
        setGlobalLoading(true);
        try {
            await api.deleteAdminUser(id);
            showToast(`User ${user.name} deleted successfully.`, 'success');
            await fetchUsersData();
        } catch (error) {
            console.error('Error removing user:', error);
            showToast(error.response?.data?.message || 'Failed to remove user account.', 'error');
        } finally {
            setGlobalLoading(false);
        }
    }
}

function loadFallbackUsers() {
    usersList = [
        { id: 1, name: 'Grand Horizon Admin', username: 'admin', role: 'Admin' },
        { id: 2, name: 'Jane Miller', username: 'jane_miller', role: 'Staff' }
    ];

    auditLogs = [
        { id: 1, username: 'admin', action: 'Authorized login session', details: 'IP: 192.168.1.5', timestamp: new Date() },
        { id: 2, username: 'admin', action: 'Recorded booking checkout #1004', details: 'Room: 215, Amount: $180.00', timestamp: new Date() },
        { id: 3, username: 'admin', action: 'Created new room 302', details: 'Type: Suite, Night price: $180.00', timestamp: new Date() }
    ];

    renderUsersTable(usersList);
    renderAuditLogs(auditLogs);
}
