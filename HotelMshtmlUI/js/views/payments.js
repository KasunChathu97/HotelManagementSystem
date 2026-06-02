// Payment Management View Module
import api from '../api.js';
import { showToast, setGlobalLoading } from '../app.js';

let paymentsList = [];
let bookingsList = [];

export async function render(container) {
    container.innerHTML = `
        <div class="space-y-6">
            <!-- Header -->
            <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 class="text-2xl font-bold text-slate-100 tracking-tight font-heading">Payment Ledger</h1>
                    <p class="text-sm text-slate-400">Track guest invoicing, transactions, and payment statuses.</p>
                </div>
                <button id="add-payment-btn" class="px-4 py-2 bg-brand-600 hover:bg-brand-500 text-white rounded-xl shadow-md shadow-brand-500/10 hover:shadow-brand-500/20 font-semibold transition-all flex items-center gap-2 text-sm">
                    <i class="fa-solid fa-file-invoice text-xs"></i>
                    <span>Record Payment</span>
                </button>
            </div>

            <!-- Filter Panel -->
            <div class="glass-panel p-4 rounded-xl border border-slate-800/80 flex flex-wrap gap-4 items-center justify-between">
                <div class="flex flex-wrap gap-3 items-center">
                    <span class="text-xs font-bold text-slate-400 uppercase tracking-wider">Filter Method:</span>
                    <button class="filter-method-btn px-3.5 py-1.5 rounded-lg text-xs font-semibold bg-slate-900 border border-slate-800 text-slate-300 hover:text-slate-100 transition-all active-filter" data-method="all">All Methods</button>
                    <button class="filter-method-btn px-3.5 py-1.5 rounded-lg text-xs font-semibold bg-slate-900 border border-slate-800 text-slate-300 hover:text-slate-100 transition-all" data-method="Cash">Cash</button>
                    <button class="filter-method-btn px-3.5 py-1.5 rounded-lg text-xs font-semibold bg-slate-900 border border-slate-800 text-slate-300 hover:text-slate-100 transition-all" data-method="Card">Card</button>
                    <button class="filter-method-btn px-3.5 py-1.5 rounded-lg text-xs font-semibold bg-slate-900 border border-slate-800 text-slate-300 hover:text-slate-100 transition-all" data-method="Bank Transfer">Bank Transfer</button>
                </div>
            </div>

            <!-- Payments List -->
            <div class="glass-panel rounded-2xl border border-slate-800/80 shadow-lg overflow-hidden">
                <div class="overflow-x-auto">
                    <table class="w-full text-left border-collapse">
                        <thead>
                            <tr class="bg-slate-900/50 text-slate-400 text-[10px] font-bold tracking-wider uppercase border-b border-slate-800/40">
                                <th class="py-3.5 px-6">Transaction ID</th>
                                <th class="py-3.5 px-6">Booking Reference</th>
                                <th class="py-3.5 px-6">Customer</th>
                                <th class="py-3.5 px-6">Amount Received</th>
                                <th class="py-3.5 px-6">Method</th>
                                <th class="py-3.5 px-6">Date Recorded</th>
                                <th class="py-3.5 px-6">Status</th>
                            </tr>
                        </thead>
                        <tbody id="payments-tbody" class="divide-y divide-slate-800/40 text-sm text-slate-300">
                            <tr>
                                <td colspan="7" class="py-8 text-center text-slate-500">Loading ledger data...</td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            </div>
        </div>

        <!-- Record Payment Modal Backdrop -->
        <div id="payment-modal" class="fixed inset-0 z-50 bg-slate-950/75 flex items-center justify-center hidden p-4">
            <div class="glass-panel w-full max-w-md rounded-2xl border border-slate-800/80 shadow-2xl relative overflow-hidden animate-fade-in">
                <div class="absolute top-0 left-0 w-full h-[3px] bg-gradient-to-r from-brand-500 to-indigo-500"></div>

                <div class="p-6 border-b border-slate-800/50 flex justify-between items-center">
                    <h3 class="text-base font-bold text-slate-100 font-heading">Record Invoice Payment</h3>
                    <button id="close-payment-modal-btn" class="text-slate-400 hover:text-slate-200 transition-colors">
                        <i class="fa-solid fa-xmark text-lg"></i>
                    </button>
                </div>

                <form id="payment-form" class="p-6 space-y-4">
                    <div>
                        <label for="payment-booking-id" class="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1.5">Select Active Booking</label>
                        <select id="payment-booking-id" required
                            class="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-800 rounded-xl text-slate-200 focus:border-brand-500 transition-all text-sm">
                            <option value="">-- Choose active stay booking --</option>
                        </select>
                    </div>

                    <div>
                        <label for="payment-amount" class="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1.5">Payment Amount (Rs)</label>
                        <input type="number" id="payment-amount" required min="0.01" step="0.01" placeholder="0.00"
                            class="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-800 rounded-xl text-slate-200 focus:border-brand-500 transition-all text-sm">
                    </div>

                    <div class="grid grid-cols-2 gap-4">
                        <div>
                            <label for="payment-method" class="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1.5">Payment Method</label>
                            <select id="payment-method" required
                                class="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-800 rounded-xl text-slate-200 focus:border-brand-500 transition-all text-sm">
                                <option value="Cash">Cash</option>
                                <option value="Card">Credit/Debit Card</option>
                                <option value="Bank Transfer">Bank Transfer</option>
                            </select>
                        </div>
                        <div>
                            <label for="payment-status" class="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1.5">Transaction Status</label>
                            <select id="payment-status" required
                                class="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-800 rounded-xl text-slate-200 focus:border-brand-500 transition-all text-sm">
                                <option value="Paid">Paid</option>
                                <option value="Pending">Pending</option>
                                <option value="Refunded">Refunded</option>
                            </select>
                        </div>
                    </div>

                    <div class="pt-4 border-t border-slate-800/50 flex justify-end gap-3">
                        <button type="button" id="cancel-payment-btn" class="px-4 py-2 border border-slate-800 hover:bg-slate-900 text-slate-300 font-semibold rounded-xl text-sm transition-all">
                            Cancel
                        </button>
                        <button type="submit" class="px-4 py-2 bg-brand-600 hover:bg-brand-500 text-white font-semibold rounded-xl text-sm transition-all">
                            Record Transaction
                        </button>
                    </div>
                </form>
            </div>
        </div>
    `;

    // Hook events
    document.getElementById('add-payment-btn').addEventListener('click', openPaymentModal);
    document.getElementById('close-payment-modal-btn').addEventListener('click', closePaymentModal);
    document.getElementById('cancel-payment-btn').addEventListener('click', closePaymentModal);
    document.getElementById('payment-form').addEventListener('submit', handlePaymentSubmit);

    // Filters event listener
    document.querySelectorAll('.filter-method-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('.filter-method-btn').forEach(b => b.classList.remove('active-filter', 'bg-brand-600', 'text-white'));
            btn.classList.add('active-filter');
            if (btn.getAttribute('data-method') !== 'all') {
                btn.classList.add('bg-brand-600', 'text-white');
            }
            filterPayments(btn.getAttribute('data-method'));
        });
    });

    // Populate dropdown & fetch
    await fetchPaymentsData();
}

async function fetchPaymentsData() {
    try {
        const [paymentsRes, bookingsRes] = await Promise.all([
            api.getPayments(),
            api.getBookings()
        ]);

        paymentsList = paymentsRes.data;
        bookingsList = bookingsRes.data;

        renderPaymentsTable(paymentsList);
        populateBookingsDropdown();
    } catch (error) {
        console.error('Error fetching payments:', error);
        showToast('Error retrieving transaction ledger. Showing demo logs.', 'warning');
        loadFallbackPayments();
    }
}

function populateBookingsDropdown() {
    const dropdown = document.getElementById('payment-booking-id');
    dropdown.innerHTML = '<option value="">-- Choose active stay booking --</option>' + 
        bookingsList.map(b => `<option value="${b.id || b._id}">Booking #${(b.id || b._id).toString().substring(0, 8)} - Guest: ${b.customer?.name || 'Walk-in'} (Owed: Rs ${(b.totalAmount || 0).toFixed(2)})</option>`).join('');
}

function renderPaymentsTable(payments) {
    const tbody = document.getElementById('payments-tbody');
    if (!payments || payments.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="7" class="py-8 text-center text-slate-500">No payment transactions recorded.</td>
            </tr>
        `;
        return;
    }

    const statusColors = {
        'paid': 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
        'pending': 'bg-amber-500/10 text-amber-400 border-amber-500/20',
        'refunded': 'bg-slate-800 text-slate-400 border-slate-700/50'
    };

    tbody.innerHTML = payments.map(p => {
        const status = p.status || 'Paid';
        const colorClass = statusColors[status.toLowerCase()] || 'bg-slate-800 text-slate-400 border-slate-700/50';
        const dateFmt = new Date(p.createdAt || p.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
        
        return `
            <tr class="hover:bg-slate-900/30 transition-colors">
                <td class="py-4 px-6 font-mono text-slate-400">TXN-${(p.id || p._id || '').toString().substring(0, 8).toUpperCase()}</td>
                <td class="py-4 px-6 font-semibold">#${(p.bookingId || p.booking?.id || p.booking?._id || '').toString().substring(0, 8)}</td>
                <td class="py-4 px-6 font-medium">${p.booking?.customer?.name || 'Guest'}</td>
                <td class="py-4 px-6 font-bold text-slate-100">Rs ${(p.amount || 0).toFixed(2)}</td>
                <td class="py-4 px-6">
                    <span class="inline-flex items-center gap-1.5 text-xs text-slate-300">
                        <i class="fa-solid ${p.method === 'Cash' ? 'fa-wallet text-amber-500' : p.method === 'Card' ? 'fa-credit-card text-brand-400' : 'fa-building-columns text-sky-400'}"></i>
                        ${p.method}
                    </span>
                </td>
                <td class="py-4 px-6 text-slate-400 text-xs">${dateFmt}</td>
                <td class="py-4 px-6">
                    <span class="inline-block px-2.5 py-0.5 rounded-full text-xs font-bold border capitalize ${colorClass}">
                        ${status}
                    </span>
                </td>
            </tr>
        `;
    }).join('');
}

function filterPayments(method) {
    if (method === 'all') {
        renderPaymentsTable(paymentsList);
    } else {
        const filtered = paymentsList.filter(p => (p.method || '').toLowerCase() === method.toLowerCase());
        renderPaymentsTable(filtered);
    }
}

function openPaymentModal() {
    document.getElementById('payment-modal').classList.remove('hidden');
    document.getElementById('payment-form').reset();
}

function closePaymentModal() {
    document.getElementById('payment-modal').classList.add('hidden');
}

async function handlePaymentSubmit(e) {
    e.preventDefault();

    const paymentData = {
        bookingId: document.getElementById('payment-booking-id').value,
        amount: parseFloat(document.getElementById('payment-amount').value),
        method: document.getElementById('payment-method').value,
        status: document.getElementById('payment-status').value
    };

    setGlobalLoading(true);
    try {
        await api.createPayment(paymentData);
        showToast('Payment transaction captured successfully.', 'success');
        closePaymentModal();
        await fetchPaymentsData();
    } catch (error) {
        console.error('Error registering payment:', error);
        showToast(error.response?.data?.message || 'Failed to complete transaction registration.', 'error');
    } finally {
        setGlobalLoading(false);
    }
}

function loadFallbackPayments() {
    bookingsList = [
        { id: '1004', totalAmount: 130, customer: { name: 'Alice Watson' } },
        { id: '1005', totalAmount: 315, customer: { name: 'Bob Henderson' } }
    ];
    paymentsList = [
        { id: 'txn01', booking: bookingsList[0], amount: 130, method: 'Card', status: 'Paid', createdAt: '2026-05-28' },
        { id: 'txn02', booking: bookingsList[1], amount: 150, method: 'Cash', status: 'Pending', createdAt: '2026-05-28' }
    ];
    renderPaymentsTable(paymentsList);
    populateBookingsDropdown();
}
