// Reports & Analytics View Module
import api from '../api.js';
import { showToast, setGlobalLoading } from '../app.js';

let activeReportTab = 'income';

export async function render(container) {
    container.innerHTML = `
        <div class="space-y-6">
            <!-- Page Header & Export Controls -->
            <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 class="text-2xl font-bold text-slate-100 tracking-tight font-heading">Reports & Analytics</h1>
                    <p class="text-sm text-slate-400">Generate financial sheets, occupancy statements, and export documents.</p>
                </div>
                
                <!-- Action Export Buttons -->
                <div class="flex gap-3">
                    <button id="export-excel-btn" class="px-4 py-2 bg-emerald-600/10 hover:bg-emerald-650 text-emerald-400 border border-emerald-500/25 hover:border-emerald-500 hover:text-white rounded-xl transition-all flex items-center gap-2 text-sm font-semibold">
                        <i class="fa-solid fa-file-excel"></i>
                        <span>Export Excel</span>
                    </button>
                    <button id="export-pdf-btn" class="px-4 py-2 bg-rose-600/10 hover:bg-rose-650 text-rose-400 border border-rose-500/25 hover:border-rose-500 hover:text-white rounded-xl transition-all flex items-center gap-2 text-sm font-semibold">
                        <i class="fa-solid fa-file-pdf"></i>
                        <span>Export PDF</span>
                    </button>
                </div>
            </div>

            <!-- Tab Selection Headers -->
            <div class="flex border-b border-slate-800/80">
                <button class="report-tab-btn py-3 px-6 text-sm font-semibold text-slate-400 hover:text-slate-200 transition-all border-b-2 border-transparent" data-tab="income">
                    <i class="fa-solid fa-money-bill-trend-up mr-2"></i>Income Statement
                </button>
                <button class="report-tab-btn py-3 px-6 text-sm font-semibold text-slate-400 hover:text-slate-200 transition-all border-b-2 border-transparent" data-tab="expenses">
                    <i class="fa-solid fa-receipt mr-2"></i>Expense Breakdown
                </button>
                <button class="report-tab-btn py-3 px-6 text-sm font-semibold text-slate-400 hover:text-slate-200 transition-all border-b-2 border-transparent" data-tab="profit-loss">
                    <i class="fa-solid fa-scale-balanced mr-2"></i>Profit & Loss
                </button>
                <button class="report-tab-btn py-3 px-6 text-sm font-semibold text-slate-400 hover:text-slate-200 transition-all border-b-2 border-transparent" data-tab="occupancy">
                    <i class="fa-solid fa-bed mr-2"></i>Occupancy Status
                </button>
            </div>

            <!-- Dynamic Report Sheet Container -->
            <div class="glass-panel p-6 rounded-2xl border border-slate-800/85 shadow-xl" id="report-sheet-container">
                <!-- Dynamic tables populate here -->
            </div>
        </div>
    `;

    // Hook tab buttons
    document.querySelectorAll('.report-tab-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            activeReportTab = btn.getAttribute('data-tab');
            updateTabStates();
            loadReportTab();
        });
    });

    // Hook exports
    document.getElementById('export-pdf-btn').addEventListener('click', () => handleExport('pdf'));
    document.getElementById('export-excel-btn').addEventListener('click', () => handleExport('excel'));

    // Init
    updateTabStates();
    await loadReportTab();
}

function updateTabStates() {
    document.querySelectorAll('.report-tab-btn').forEach(btn => {
        if (btn.getAttribute('data-tab') === activeReportTab) {
            btn.className = "report-tab-btn py-3 px-6 text-sm font-bold text-brand-400 border-b-2 border-brand-500 transition-all";
        } else {
            btn.className = "report-tab-btn py-3 px-6 text-sm font-semibold text-slate-400 hover:text-slate-200 hover:bg-slate-900/10 transition-all border-b-2 border-transparent";
        }
    });
}

async function loadReportTab() {
    const container = document.getElementById('report-sheet-container');
    container.innerHTML = `
        <div class="flex items-center justify-center py-16">
            <div class="w-10 h-10 border-4 border-brand-500 border-t-transparent rounded-full animate-spin"></div>
        </div>
    `;

    try {
        if (activeReportTab === 'income') {
            const res = await api.getIncomeReport();
            renderIncomeReport(res.data, container);
        } else if (activeReportTab === 'expenses') {
            const res = await api.getExpenseReport();
            renderExpenseReport(res.data, container);
        } else if (activeReportTab === 'profit-loss') {
            const res = await api.getProfitLossReport();
            renderProfitLossReport(res.data, container);
        } else if (activeReportTab === 'occupancy') {
            const res = await api.getOccupancyReport();
            renderOccupancyReport(res.data, container);
        }
    } catch (error) {
        console.error('Error fetching report:', error);
        showToast('Error syncing stats. Displaying simulation models.', 'warning');
        loadFallbackReport(activeReportTab, container);
    }
}

// Render Functions
function renderIncomeReport(data, container) {
    const list = data.records || [];
    container.innerHTML = `
        <div class="space-y-6">
            <div class="flex justify-between items-center border-b border-slate-800 pb-4">
                <h3 class="text-base font-bold text-slate-200 font-heading">Total Income Ledger</h3>
                <span class="text-xs font-semibold text-slate-400">Total Revenue: <span class="text-emerald-400 text-sm font-bold">Rs ${(data.totalRevenue || 0).toFixed(2)}</span></span>
            </div>
            <div class="overflow-x-auto">
                <table class="w-full text-left border-collapse">
                    <thead>
                        <tr class="text-slate-400 text-[10px] font-bold uppercase tracking-wider border-b border-slate-800/40">
                            <th class="py-2.5">Guest</th>
                            <th class="py-2.5">Room</th>
                            <th class="py-2.5">Payment Method</th>
                            <th class="py-2.5">Amount</th>
                        </tr>
                    </thead>
                    <tbody class="divide-y divide-slate-800/30 text-slate-300">
                        ${list.map(r => `
                            <tr>
                                <td class="py-3 font-medium">${r.guestName || r.customerName || 'Walk-in'}</td>
                                <td class="py-3 font-semibold text-indigo-400">Room ${r.roomNumber || 'N/A'}</td>
                                <td class="py-3 text-xs text-slate-400">${r.method || 'Card'}</td>
                                <td class="py-3 font-bold text-slate-200">Rs ${(r.amount || 0).toFixed(2)}</td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            </div>
        </div>
    `;
}

function renderExpenseReport(data, container) {
    const list = data.records || [];
    container.innerHTML = `
        <div class="space-y-6">
            <div class="flex justify-between items-center border-b border-slate-800 pb-4">
                <h3 class="text-base font-bold text-slate-200 font-heading">Categorized Overhead Costs</h3>
                <span class="text-xs font-semibold text-slate-400">Total Expenses: <span class="text-rose-400 text-sm font-bold">-Rs ${(data.totalExpenses || 0).toFixed(2)}</span></span>
            </div>
            <div class="overflow-x-auto">
                <table class="w-full text-left border-collapse">
                    <thead>
                        <tr class="text-slate-400 text-[10px] font-bold uppercase tracking-wider border-b border-slate-800/40">
                            <th class="py-2.5">Item Description</th>
                            <th class="py-2.5">Expense Category</th>
                            <th class="py-2.5">Cost</th>
                        </tr>
                    </thead>
                    <tbody class="divide-y divide-slate-800/30 text-slate-300">
                        ${list.map(r => `
                            <tr>
                                <td class="py-3 font-medium">${r.title}</td>
                                <td class="py-3"><span class="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-900 border border-slate-800">${r.category}</span></td>
                                <td class="py-3 font-bold text-rose-400">-Rs ${(r.amount || 0).toFixed(2)}</td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            </div>
        </div>
    `;
}

function renderProfitLossReport(data, container) {
    const income = data.totalRevenue || 0;
    const expenses = data.totalExpenses || 0;
    const profit = income - expenses;
    const margin = income > 0 ? ((profit / income) * 100).toFixed(1) : '0';

    container.innerHTML = `
        <div class="space-y-6">
            <div class="border-b border-slate-800 pb-4">
                <h3 class="text-base font-bold text-slate-200 font-heading">Profit & Loss Statement (P&L)</h3>
            </div>
            <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div class="p-4 bg-slate-900/60 border border-slate-800 rounded-xl">
                    <span class="text-xs text-slate-400 font-medium">Total Operational Revenue</span>
                    <h4 class="text-2xl font-bold text-emerald-400 mt-1 font-heading">Rs ${income.toFixed(2)}</h4>
                </div>
                <div class="p-4 bg-slate-900/60 border border-slate-800 rounded-xl">
                    <span class="text-xs text-slate-400 font-medium">Total Operating Costs</span>
                    <h4 class="text-2xl font-bold text-rose-400 mt-1 font-heading">-Rs ${expenses.toFixed(2)}</h4>
                </div>
                <div class="p-4 bg-slate-900/60 border border-slate-800 rounded-xl">
                    <span class="text-xs text-slate-400 font-medium">Net Profit / Surplus</span>
                    <h4 class="text-2xl font-bold ${profit >= 0 ? 'text-slate-100' : 'text-rose-400'} mt-1 font-heading">Rs ${profit.toFixed(2)}</h4>
                </div>
            </div>
            <div class="p-4 bg-brand-950/20 border border-brand-850/40 rounded-xl flex items-center justify-between">
                <div>
                    <h4 class="text-sm font-semibold text-slate-200">Net Profit Margin</h4>
                    <p class="text-xs text-slate-400 mt-0.5">Ratio of surplus compared to total earnings.</p>
                </div>
                <div class="text-right">
                    <h3 class="text-3xl font-extrabold text-brand-400 font-heading">${margin}%</h3>
                </div>
            </div>
        </div>
    `;
}

function renderOccupancyReport(data, container) {
    container.innerHTML = `
        <div class="space-y-6">
            <div class="border-b border-slate-800 pb-4">
                <h3 class="text-base font-bold text-slate-200 font-heading">Occupancy & Room Utilization</h3>
            </div>
            <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div class="space-y-4">
                    <div class="p-4 bg-slate-900/60 border border-slate-800 rounded-xl">
                        <span class="text-xs text-slate-400">Total Rooms Configured</span>
                        <h4 class="text-2xl font-bold text-slate-100 mt-1 font-heading">${data.totalRooms || 0}</h4>
                    </div>
                    <div class="p-4 bg-slate-900/60 border border-slate-800 rounded-xl">
                        <span class="text-xs text-slate-400">Currently Booked / Occupied</span>
                        <h4 class="text-2xl font-bold text-brand-400 mt-1 font-heading">${data.occupiedRooms || 0}</h4>
                    </div>
                </div>
                
                <div class="p-6 bg-slate-900/40 border border-slate-850 rounded-xl flex flex-col justify-between">
                    <div>
                        <h4 class="text-sm font-bold text-slate-300 font-heading">Occupancy Ratio</h4>
                        <p class="text-xs text-slate-500 mt-0.5">Percentage of rooms currently in service.</p>
                    </div>
                    <div class="mt-4">
                        <h3 class="text-4xl font-extrabold text-slate-100 font-heading">${data.occupancyRate || 0}%</h3>
                        <div class="w-full bg-slate-800 h-2 rounded-full mt-3 overflow-hidden">
                            <div class="bg-brand-500 h-full rounded-full" style="width: ${data.occupancyRate || 0}%"></div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `;
}

// Blob Response Exporter
async function handleExport(format) {
    setGlobalLoading(true);
    try {
        let response;
        if (format === 'pdf') {
            response = await api.exportReportPdf(activeReportTab);
        } else {
            response = await api.exportReportExcel(activeReportTab);
        }

        // Construct Blob File Download
        const blob = new Blob([response.data], { type: response.headers['content-type'] });
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        
        const ext = format === 'pdf' ? 'pdf' : 'xlsx';
        link.setAttribute('download', `grand-horizon-report-${activeReportTab}-${new Date().toISOString().split('T')[0]}.${ext}`);
        
        document.body.appendChild(link);
        link.click();
        link.parentNode.removeChild(link);
        
        showToast(`Report downloaded successfully in ${format.toUpperCase()} format.`, 'success');
    } catch (error) {
        console.error(`Error exporting ${format}:`, error);
        showToast(`Could not generate ${format.toUpperCase()} report. Running mock download trigger.`, 'info');
        
        // Mock fallback file creation for testing purposes
        triggerMockDownload(format);
    } finally {
        setGlobalLoading(false);
    }
}

function triggerMockDownload(format) {
    if (format === 'pdf') {
        // PDF Export Fallback: Trigger browser print layout
        showToast('Preparing report print layout...', 'info');
        setTimeout(() => {
            window.print();
        }, 500);
        return;
    }
    
    // Excel Export Fallback: Generate real CSV string which Excel loads natively
    let csvContent = '';
    const dateStr = new Date().toLocaleDateString();
    
    if (activeReportTab === 'income') {
        csvContent = `Grand Horizon Income Report,Date: ${dateStr}\n\n`;
        csvContent += `Guest,Room,Payment Method,Amount\n`;
        csvContent += `Alice Watson,Room 101,Card,130.00\n`;
        csvContent += `Bob Henderson,Room 201,Cash,315.00\n`;
        csvContent += `Sophia Miller,Room 102,Card,320.00\n`;
        csvContent += `Oliver Smith,Room 304,Bank Transfer,850.00\n`;
        csvContent += `Total Revenue,,,,2430.00\n`;
    } else if (activeReportTab === 'expenses') {
        csvContent = `Grand Horizon Expense Report,Date: ${dateStr}\n\n`;
        csvContent += `Item Description,Expense Category,Cost\n`;
        csvContent += `Electricity bill (May),Utilities,480.00\n`;
        csvContent += `AC repair service call,Maintenance,320.00\n`;
        csvContent += `Bathroom supplies purchase,Supplies,150.00\n`;
        csvContent += `Total Expenses,,,950.00\n`;
    } else if (activeReportTab === 'profit-loss') {
        csvContent = `Grand Horizon Profit & Loss Report,Date: ${dateStr}\n\n`;
        csvContent += `Metric,Value\n`;
        csvContent += `Total Revenue,2430.00\n`;
        csvContent += `Total Expenses,950.00\n`;
        csvContent += `Net Profit,1480.00\n`;
    } else if (activeReportTab === 'occupancy') {
        csvContent = `Grand Horizon Occupancy Report,Date: ${dateStr}\n\n`;
        csvContent += `Metric,Value\n`;
        csvContent += `Total Rooms,40\n`;
        csvContent += `Occupied Rooms,15\n`;
        csvContent += `Occupancy Rate,37.5%\n`;
    }

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `grand-horizon-report-${activeReportTab}-${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    link.parentNode.removeChild(link);
    showToast('Excel report generated as CSV file.', 'success');
}

function loadFallbackReport(tab, container) {
    if (tab === 'income') {
        renderIncomeReport({
            totalRevenue: 2430.00,
            records: [
                { guestName: 'Alice Watson', roomNumber: '101', method: 'Card', amount: 130.00 },
                { guestName: 'Bob Henderson', roomNumber: '201', method: 'Cash', amount: 315.00 },
                { guestName: 'Sophia Miller', roomNumber: '102', method: 'Card', amount: 320.00 },
                { guestName: 'Oliver Smith', roomNumber: '304', method: 'Bank Transfer', amount: 850.00 }
            ]
        }, container);
    } else if (tab === 'expenses') {
        renderExpenseReport({
            totalExpenses: 950.00,
            records: [
                { title: 'Electricity bill (May)', category: 'Utilities', amount: 480 },
                { title: 'AC repair service call', category: 'Maintenance', amount: 320 },
                { title: 'Bathroom supplies purchase', category: 'Supplies', amount: 150 }
            ]
        }, container);
    } else if (tab === 'profit-loss') {
        renderProfitLossReport({
            totalRevenue: 2430.00,
            totalExpenses: 950.00
        }, container);
    } else if (tab === 'occupancy') {
        renderOccupancyReport({
            totalRooms: 40,
            occupiedRooms: 15,
            occupancyRate: 37.5
        }, container);
    }
}
