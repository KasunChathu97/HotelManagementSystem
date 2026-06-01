// Customer Management View Module
import api from '../api.js';
import { showToast, setGlobalLoading } from '../app.js';

let customersList = [];

export async function render(container) {
    container.innerHTML = `
        <div class="space-y-6">
            <!-- Header Section -->
            <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 class="text-2xl font-bold text-slate-100 tracking-tight font-heading">Guest Management</h1>
                    <p class="text-sm text-slate-400">View and update registered guest profiles and histories.</p>
                </div>
                <button id="add-customer-btn" class="px-4 py-2 bg-brand-600 hover:bg-brand-500 text-white rounded-xl shadow-md shadow-brand-500/10 hover:shadow-brand-500/20 font-semibold transition-all flex items-center gap-2 text-sm">
                    <i class="fa-solid fa-user-plus text-xs"></i>
                    <span>Register New Guest</span>
                </button>
            </div>

            <!-- Search Filter Bar -->
            <div class="glass-panel p-4 rounded-xl border border-slate-800/80 flex items-center justify-between">
                <div class="relative w-full max-w-md">
                    <span class="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                        <i class="fa-solid fa-magnifying-glass text-sm"></i>
                    </span>
                    <input type="text" id="customer-search-input" placeholder="Search guests by name, email, or phone number..."
                        class="w-full pl-10 pr-4 py-2.5 bg-slate-900 border border-slate-800 rounded-xl text-slate-200 placeholder-slate-500 focus:border-brand-500 transition-all text-sm">
                </div>
            </div>

            <!-- Customers List -->
            <div class="glass-panel rounded-2xl border border-slate-800/80 shadow-lg overflow-hidden">
                <div class="overflow-x-auto">
                    <table class="w-full text-left border-collapse">
                        <thead>
                            <tr class="bg-slate-900/50 text-slate-400 text-[10px] font-bold tracking-wider uppercase border-b border-slate-800/40">
                                <th class="py-3.5 px-6">Guest Name</th>
                                <th class="py-3.5 px-6">Email Address</th>
                                <th class="py-3.5 px-6">Phone Number</th>
                                <th class="py-3.5 px-6">Identity Document</th>
                                <th class="py-3.5 px-6 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody id="customers-tbody" class="divide-y divide-slate-800/40 text-sm text-slate-300">
                            <tr>
                                <td colspan="5" class="py-8 text-center text-slate-500">Fetching customer register...</td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            </div>
        </div>

        <!-- Add/Edit Customer Modal Backdrop -->
        <div id="customer-modal" class="fixed inset-0 z-50 bg-slate-950/75 flex items-center justify-center hidden p-4">
            <div class="glass-panel w-full max-w-md rounded-2xl border border-slate-800/80 shadow-2xl relative overflow-hidden animate-fade-in">
                <div class="absolute top-0 left-0 w-full h-[3px] bg-gradient-to-r from-brand-500 to-indigo-500"></div>

                <div class="p-6 border-b border-slate-800/50 flex justify-between items-center">
                    <h3 id="customer-modal-title" class="text-base font-bold text-slate-100 font-heading">Register Guest</h3>
                    <button id="close-customer-modal-btn" class="text-slate-400 hover:text-slate-200 transition-colors">
                        <i class="fa-solid fa-xmark text-lg"></i>
                    </button>
                </div>

                <form id="customer-form" class="p-6 space-y-4">
                    <input type="hidden" id="customer-id">

                    <div>
                        <label for="customer-name" class="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1.5">Guest Full Name</label>
                        <input type="text" id="customer-name" required placeholder="e.g. John Doe"
                            class="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-800 rounded-xl text-slate-200 focus:border-brand-500 transition-all text-sm">
                    </div>

                    <div>
                        <label for="customer-email" class="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1.5">Email Address</label>
                        <input type="email" id="customer-email" required placeholder="john@example.com"
                            class="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-800 rounded-xl text-slate-200 focus:border-brand-500 transition-all text-sm">
                    </div>

                    <div>
                        <label for="customer-phone" class="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1.5">Phone Number</label>
                        <input type="text" id="customer-phone" required placeholder="+1 555-0199"
                            class="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-800 rounded-xl text-slate-200 focus:border-brand-500 transition-all text-sm">
                    </div>

                    <div>
                        <label for="customer-identity" class="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1.5">Identity ID / Passport</label>
                        <input type="text" id="customer-identity" required placeholder="e.g. Passport, Drivers License ID"
                            class="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-800 rounded-xl text-slate-200 focus:border-brand-500 transition-all text-sm">
                    </div>

                    <div class="pt-4 border-t border-slate-800/50 flex justify-end gap-3">
                        <button type="button" id="cancel-customer-btn" class="px-4 py-2 border border-slate-800 hover:bg-slate-900 text-slate-300 font-semibold rounded-xl text-sm transition-all">
                            Cancel
                        </button>
                        <button type="submit" class="px-4 py-2 bg-brand-600 hover:bg-brand-500 text-white font-semibold rounded-xl text-sm transition-all">
                            Save Info
                        </button>
                    </div>
                </form>
            </div>
        </div>
    `;

    // Hook events
    document.getElementById('add-customer-btn').addEventListener('click', () => openCustomerModal());
    document.getElementById('close-customer-modal-btn').addEventListener('click', closeCustomerModal);
    document.getElementById('cancel-customer-btn').addEventListener('click', closeCustomerModal);
    document.getElementById('customer-form').addEventListener('submit', handleCustomerFormSubmit);
    
    // Live Search Filter
    document.getElementById('customer-search-input').addEventListener('input', (e) => {
        const query = e.target.value.toLowerCase().trim();
        const filtered = customersList.filter(c => 
            c.name.toLowerCase().includes(query) ||
            (c.email || '').toLowerCase().includes(query) ||
            (c.phone || '').toLowerCase().includes(query)
        );
        renderCustomersTable(filtered);
    });

    // Initial load
    await fetchCustomers();
}

async function fetchCustomers() {
    try {
        const response = await api.getCustomers();
        customersList = response.data;
        renderCustomersTable(customersList);
    } catch (error) {
        console.error('Error fetching customers:', error);
        showToast('Error syncing guests data. Rendering mock records.', 'warning');
        loadFallbackCustomers();
    }
}

function renderCustomersTable(customers) {
    const tbody = document.getElementById('customers-tbody');
    if (!customers || customers.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="5" class="py-8 text-center text-slate-500">No guests match the search query.</td>
            </tr>
        `;
        return;
    }

    tbody.innerHTML = customers.map(c => `
        <tr class="hover:bg-slate-900/30 transition-colors">
            <td class="py-4 px-6 font-semibold text-slate-200">
                <div class="flex items-center gap-3">
                    <div class="w-8 h-8 rounded-full bg-slate-800 border border-slate-700/50 flex items-center justify-center text-xs font-bold text-slate-300">
                        ${c.name.charAt(0)}
                    </div>
                    <span>${c.name}</span>
                </div>
            </td>
            <td class="py-4 px-6">${c.email || 'N/A'}</td>
            <td class="py-4 px-6 font-mono">${c.phone || 'N/A'}</td>
            <td class="py-4 px-6 text-slate-400 font-semibold text-xs">${c.identityCard || c.identity || 'N/A'}</td>
            <td class="py-4 px-6 text-right">
                <div class="flex items-center justify-end gap-2">
                    <button class="edit-cust-btn p-2 text-slate-400 hover:text-brand-400 hover:bg-slate-800/80 rounded-lg transition-all" data-id="${c.id || c._id}">
                        <i class="fa-solid fa-pen-to-square text-sm"></i>
                    </button>
                    <button class="delete-cust-btn p-2 text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition-all" data-id="${c.id || c._id}">
                        <i class="fa-solid fa-trash-can text-sm"></i>
                    </button>
                </div>
            </td>
        </tr>
    `).join('');

    // Hook buttons
    document.querySelectorAll('.edit-cust-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const id = btn.getAttribute('data-id');
            const customer = customersList.find(c => (c.id || c._id) == id);
            if (customer) openCustomerModal(customer);
        });
    });

    document.querySelectorAll('.delete-cust-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const id = btn.getAttribute('data-id');
            confirmDeleteCustomer(id);
        });
    });
}

function openCustomerModal(customer = null) {
    const modal = document.getElementById('customer-modal');
    const form = document.getElementById('customer-form');
    const title = document.getElementById('customer-modal-title');
    
    form.reset();

    if (customer) {
        title.innerText = 'Modify Guest Profile';
        document.getElementById('customer-id').value = customer.id || customer._id;
        document.getElementById('customer-name').value = customer.name;
        document.getElementById('customer-email').value = customer.email;
        document.getElementById('customer-phone').value = customer.phone;
        document.getElementById('customer-identity').value = customer.identityCard || customer.identity || '';
    } else {
        title.innerText = 'Register Guest';
        document.getElementById('customer-id').value = '';
    }

    modal.classList.remove('hidden');
}

function closeCustomerModal() {
    document.getElementById('customer-modal').classList.add('hidden');
}

async function handleCustomerFormSubmit(e) {
    e.preventDefault();

    const id = document.getElementById('customer-id').value;
    const customerData = {
        name: document.getElementById('customer-name').value.trim(),
        email: document.getElementById('customer-email').value.trim(),
        phone: document.getElementById('customer-phone').value.trim(),
        identityCard: document.getElementById('customer-identity').value.trim(),
    };

    setGlobalLoading(true);
    try {
        if (id) {
            await api.updateCustomer(id, customerData);
            showToast(`Guest profile for ${customerData.name} updated.`, 'success');
        } else {
            await api.createCustomer(customerData);
            showToast(`Guest ${customerData.name} successfully registered.`, 'success');
        }
        closeCustomerModal();
        await fetchCustomers();
    } catch (error) {
        console.error('Error saving customer:', error);
        showToast(error.response?.data?.message || 'Error processing request.', 'error');
    } finally {
        setGlobalLoading(false);
    }
}

async function confirmDeleteCustomer(id) {
    const customer = customersList.find(c => (c.id || c._id) == id);
    if (!customer) return;

    if (confirm(`Delete registration for guest "${customer.name}"? This removes all active profile logs.`)) {
        setGlobalLoading(true);
        try {
            await api.deleteCustomer(id);
            showToast(`Guest ${customer.name} deleted successfully.`, 'success');
            await fetchCustomers();
        } catch (error) {
            console.error('Error deleting guest:', error);
            showToast(error.response?.data?.message || 'Failed to remove customer profile.', 'error');
        } finally {
            setGlobalLoading(false);
        }
    }
}

function loadFallbackCustomers() {
    customersList = [
        { id: 1, name: 'Alice Watson', email: 'alice@watson.com', phone: '+123456789', identityCard: 'ID-992019' },
        { id: 2, name: 'Bob Henderson', email: 'bob@henderson.com', phone: '+987654321', identityCard: 'ID-588102' },
        { id: 3, name: 'Clara Oswald', email: 'clara@tardis.org', phone: '+447810239', identityCard: 'PP-882910' }
    ];
    renderCustomersTable(customersList);
}
