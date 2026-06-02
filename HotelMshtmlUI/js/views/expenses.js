// Expense Management View Module
import api from '../api.js';
import { showToast, setGlobalLoading } from '../app.js';

let expensesList = [];
let expenseBreakdownChart = null;

export async function render(container) {
    container.innerHTML = `
        <div class="space-y-6">
            <!-- Header -->
            <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 class="text-2xl font-bold text-slate-100 tracking-tight font-heading">Expense & Utility Tracker</h1>
                    <p class="text-sm text-slate-400">Record hotel overheads, salaries, utilities, and vendor charges.</p>
                </div>
                <button id="add-expense-btn" class="px-4 py-2 bg-brand-600 hover:bg-brand-500 text-white rounded-xl shadow-md shadow-brand-500/10 hover:shadow-brand-500/20 font-semibold transition-all flex items-center gap-2 text-sm">
                    <i class="fa-solid fa-plus text-xs"></i>
                    <span>Log Expense</span>
                </button>
            </div>

            <!-- Visualization Charts Section & Input table -->
            <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <!-- Expenses table (Span 2) -->
                <div class="glass-panel rounded-2xl border border-slate-800/80 shadow-lg lg:col-span-2 overflow-hidden flex flex-col justify-between">
                    <div class="p-6 border-b border-slate-800/60">
                        <h3 class="text-base font-bold text-slate-200 font-heading">Overhead Records</h3>
                    </div>
                    <div class="overflow-x-auto flex-grow max-h-[350px]">
                        <table class="w-full text-left border-collapse">
                            <thead>
                                <tr class="bg-slate-900/50 text-slate-400 text-[10px] font-bold tracking-wider uppercase border-b border-slate-800/40 sticky top-0">
                                    <th class="py-3 px-6 bg-slate-900">Title</th>
                                    <th class="py-3 px-6 bg-slate-900">Category</th>
                                    <th class="py-3 px-6 bg-slate-900">Cost</th>
                                    <th class="py-3 px-6 bg-slate-900">Date Logged</th>
                                </tr>
                            </thead>
                            <tbody id="expenses-tbody" class="divide-y divide-slate-800/40 text-sm text-slate-300">
                                <tr>
                                    <td colspan="4" class="py-8 text-center text-slate-500">Retrieving records ledger...</td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                </div>

                <!-- Breakdown Donut Chart -->
                <div class="glass-panel p-6 rounded-2xl border border-slate-800/80 shadow-lg flex flex-col h-[430px]">
                    <h3 class="text-base font-bold text-slate-200 font-heading mb-1">Expense Segmentation</h3>
                    <p class="text-xs text-slate-400 mb-6 font-medium">Categorical distribution breakdown.</p>
                    <div class="flex-grow flex items-center justify-center relative">
                        <canvas id="expense-pie-chart" class="w-full max-h-56"></canvas>
                    </div>
                </div>
            </div>
        </div>

        <!-- Add Expense Modal Backdrop -->
        <div id="expense-modal" class="fixed inset-0 z-50 bg-slate-950/75 flex items-center justify-center hidden p-4">
            <div class="glass-panel w-full max-w-md rounded-2xl border border-slate-800/80 shadow-2xl relative overflow-hidden animate-fade-in">
                <div class="absolute top-0 left-0 w-full h-[3px] bg-gradient-to-r from-brand-500 to-indigo-500"></div>

                <div class="p-6 border-b border-slate-800/50 flex justify-between items-center">
                    <h3 class="text-base font-bold text-slate-100 font-heading">Record Expense</h3>
                    <button id="close-expense-modal-btn" class="text-slate-400 hover:text-slate-200 transition-colors">
                        <i class="fa-solid fa-xmark text-lg"></i>
                    </button>
                </div>

                <form id="expense-form" class="p-6 space-y-4">
                    <div>
                        <label for="expense-title" class="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1.5">Expense Title / Description</label>
                        <input type="text" id="expense-title" required placeholder="e.g. Electric bill, Office Supplies"
                            class="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-800 rounded-xl text-slate-200 focus:border-brand-500 transition-all text-sm">
                    </div>

                    <div class="grid grid-cols-2 gap-4">
                        <div>
                            <label for="expense-category" class="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1.5">Category</label>
                            <select id="expense-category" required
                                class="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-800 rounded-xl text-slate-200 focus:border-brand-500 transition-all text-sm">
                                <option value="Utilities">Utilities</option>
                                <option value="Maintenance">Maintenance</option>
                                <option value="Salaries">Salaries</option>
                                <option value="Supplies">Supplies</option>
                                <option value="Marketing">Marketing</option>
                                <option value="Other">Other</option>
                            </select>
                        </div>
                        <div>
                            <label for="expense-amount" class="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1.5">Amount (Rs)</label>
                            <input type="number" id="expense-amount" required min="0.01" step="0.01" placeholder="0.00"
                                class="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-800 rounded-xl text-slate-200 focus:border-brand-500 transition-all text-sm">
                        </div>
                    </div>

                    <div>
                        <label for="expense-date" class="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1.5">Billing Date</label>
                        <input type="date" id="expense-date" required
                            class="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-800 rounded-xl text-slate-200 focus:border-brand-500 transition-all text-sm">
                    </div>

                    <div class="pt-4 border-t border-slate-800/50 flex justify-end gap-3">
                        <button type="button" id="cancel-expense-btn" class="px-4 py-2 border border-slate-800 hover:bg-slate-900 text-slate-300 font-semibold rounded-xl text-sm transition-all">
                            Cancel
                        </button>
                        <button type="submit" class="px-4 py-2 bg-brand-600 hover:bg-brand-500 text-white font-semibold rounded-xl text-sm transition-all">
                            Record Bill
                        </button>
                    </div>
                </form>
            </div>
        </div>
    `;

    // Hook modal controls
    document.getElementById('add-expense-btn').addEventListener('click', openExpenseModal);
    document.getElementById('close-expense-modal-btn').addEventListener('click', closeExpenseModal);
    document.getElementById('cancel-expense-btn').addEventListener('click', closeExpenseModal);
    document.getElementById('expense-form').addEventListener('submit', handleExpenseSubmit);

    // Initial Load
    await fetchExpenses();
}

async function fetchExpenses() {
    try {
        const response = await api.getExpenses();
        expensesList = response.data;
        renderExpensesList(expensesList);
        renderBreakdownChart();
    } catch (error) {
        console.error('Error fetching expenses:', error);
        showToast('Error retrieving expense data. Showing mock overhead accounts.', 'warning');
        loadFallbackExpenses();
    }
}

function renderExpensesList(expenses) {
    const tbody = document.getElementById('expenses-tbody');
    if (!expenses || expenses.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="4" class="py-8 text-center text-slate-500">No overhead entries recorded.</td>
            </tr>
        `;
        return;
    }

    tbody.innerHTML = expenses.map(e => {
        const dateVal = new Date(e.date || e.createdAt);
        const dateFmt = dateVal.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
        
        return `
            <tr class="hover:bg-slate-900/30 transition-colors">
                <td class="py-3.5 px-6 font-semibold text-slate-200">${e.title}</td>
                <td class="py-3.5 px-6">
                    <span class="inline-block px-2 py-0.5 rounded-lg text-xs font-bold bg-slate-950 text-slate-400 border border-slate-800">
                        ${e.category}
                    </span>
                </td>
                <td class="py-3.5 px-6 font-bold text-rose-400">-Rs ${(e.amount || 0).toFixed(2)}</td>
                <td class="py-3.5 px-6 text-slate-400 text-xs">${dateFmt}</td>
            </tr>
        `;
    }).join('');
}

function renderBreakdownChart() {
    const ctx = document.getElementById('expense-pie-chart').getContext('2d');
    
    if (expenseBreakdownChart) {
        expenseBreakdownChart.destroy();
    }

    // Group expenses by category
    const categoriesMap = {};
    expensesList.forEach(e => {
        const cat = e.category || 'Other';
        categoriesMap[cat] = (categoriesMap[cat] || 0) + (e.amount || 0);
    });

    const labels = Object.keys(categoriesMap).length > 0 ? Object.keys(categoriesMap) : ['Utilities', 'Maintenance', 'Salaries', 'Supplies', 'Marketing'];
    const data = Object.values(categoriesMap).length > 0 ? Object.values(categoriesMap) : [450, 300, 1800, 220, 150];

    const backgroundColors = [
        '#8b5cf6', // brand.500
        '#3b82f6', // blue.500
        '#f43f5e', // rose.500
        '#10b981', // emerald.500
        '#f59e0b', // amber.500
        '#64748b'  // slate.500
    ];

    expenseBreakdownChart = new Chart(ctx, {
        type: 'pie',
        data: {
            labels: labels,
            datasets: [{
                data: data,
                backgroundColor: backgroundColors,
                borderWidth: 4,
                borderColor: '#0f172a', // dark.900 background
                hoverOffset: 4
            }]
        },
        options: {
            responsive: true,
            plugins: {
                legend: {
                    position: 'bottom',
                    labels: {
                        color: '#cbd5e1',
                        padding: 16,
                        font: { size: 11 }
                    }
                }
            }
        }
    });
}

function openExpenseModal() {
    document.getElementById('expense-modal').classList.remove('hidden');
    document.getElementById('expense-form').reset();
    
    // Default current date
    const today = new Date().toISOString().split('T')[0];
    document.getElementById('expense-date').value = today;
}

function closeExpenseModal() {
    document.getElementById('expense-modal').classList.add('hidden');
}

async function handleExpenseSubmit(e) {
    e.preventDefault();

    const expenseData = {
        title: document.getElementById('expense-title').value.trim(),
        category: document.getElementById('expense-category').value,
        amount: parseFloat(document.getElementById('expense-amount').value),
        date: document.getElementById('expense-date').value
    };

    setGlobalLoading(true);
    try {
        await api.createExpense(expenseData);
        showToast('Expense log registered successfully.', 'success');
        closeExpenseModal();
        await fetchExpenses();
    } catch (error) {
        console.error('Error logging expense:', error);
        showToast(error.response?.data?.message || 'Failed to capture expense overhead log.', 'error');
    } finally {
        setGlobalLoading(false);
    }
}

function loadFallbackExpenses() {
    expensesList = [
        { id: 1, title: 'Electricity bill (May)', category: 'Utilities', amount: 480, date: '2026-05-28' },
        { id: 2, title: 'Bathroom supplies purchase', category: 'Supplies', amount: 150, date: '2026-05-25' },
        { id: 3, title: 'AC repair service call', category: 'Maintenance', amount: 320, date: '2026-05-24' },
        { id: 4, title: 'Local Google ads campaign', category: 'Marketing', amount: 200, date: '2026-05-20' },
        { id: 5, title: 'Staff wages (Biweekly)', category: 'Salaries', amount: 2400, date: '2026-05-15' }
    ];
    renderExpensesList(expensesList);
    renderBreakdownChart();
}
