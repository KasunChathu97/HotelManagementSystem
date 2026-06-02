// Dashboard Home View Module
import api from '../api.js';
import { showToast } from '../app.js';

export async function render(container) {
    container.innerHTML = `
        <div class="space-y-6">
            <!-- Page Header -->
            <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 class="text-2xl font-bold text-slate-100 tracking-tight font-heading">Dashboard Overview</h1>
                    <p class="text-sm text-slate-400">Real-time occupancy status, operations, and financial indicators.</p>
                </div>
                <button id="refresh-dashboard-btn" class="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-slate-200 border border-slate-800 rounded-xl transition-all flex items-center gap-2 text-sm font-medium">
                    <i class="fa-solid fa-arrows-rotate text-xs"></i>
                    <span>Refresh Stats</span>
                </button>
            </div>

            <!-- KPI Metric Cards Grid -->
            <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5" id="stats-cards-container">
                <!-- Room Inventory Stats -->
                <div class="glass-card p-5 rounded-2xl relative overflow-hidden flex flex-col justify-between h-32">
                    <div class="flex items-center justify-between">
                        <span class="text-xs font-bold text-slate-400 uppercase tracking-wider">Total Rooms</span>
                        <div class="w-8 h-8 rounded-lg bg-indigo-500/10 flex items-center justify-center text-indigo-400">
                            <i class="fa-solid fa-door-closed text-sm"></i>
                        </div>
                    </div>
                    <div class="mt-4">
                        <h3 class="text-3xl font-extrabold text-slate-100 font-heading" id="metric-total-rooms">-</h3>
                        <p class="text-xs text-slate-400 mt-1 flex items-center gap-1">
                            <span class="text-emerald-400 font-bold" id="metric-available-rooms">-</span> Available, 
                            <span class="text-rose-400 font-bold" id="metric-occupied-rooms">-</span> Occupied
                        </p>
                    </div>
                </div>

                <!-- Occupancy Rate -->
                <div class="glass-card p-5 rounded-2xl relative overflow-hidden flex flex-col justify-between h-32">
                    <div class="flex items-center justify-between">
                        <span class="text-xs font-bold text-slate-400 uppercase tracking-wider">Occupancy Rate</span>
                        <div class="w-8 h-8 rounded-lg bg-brand-500/10 flex items-center justify-center text-brand-400">
                            <i class="fa-solid fa-percent text-sm"></i>
                        </div>
                    </div>
                    <div class="mt-4">
                        <h3 class="text-3xl font-extrabold text-slate-100 font-heading" id="metric-occupancy-rate">-%</h3>
                        <!-- Visual indicator bar -->
                        <div class="w-full bg-slate-800 h-1.5 rounded-full mt-2 overflow-hidden">
                            <div class="bg-brand-500 h-full rounded-full transition-all duration-500" id="occupancy-progress" style="width: 0%"></div>
                        </div>
                    </div>
                </div>

                <!-- Daily Operations -->
                <div class="glass-card p-5 rounded-2xl relative overflow-hidden flex flex-col justify-between h-32">
                    <div class="flex items-center justify-between">
                        <span class="text-xs font-bold text-slate-400 uppercase tracking-wider">Today's Traffic</span>
                        <div class="w-8 h-8 rounded-lg bg-emerald-500/10 flex items-center justify-center text-emerald-400">
                            <i class="fa-solid fa-arrows-left-right text-sm"></i>
                        </div>
                    </div>
                    <div class="mt-4">
                        <div class="flex justify-between items-end">
                            <div>
                                <h3 class="text-2xl font-extrabold text-slate-100 font-heading" id="metric-checkins">-</h3>
                                <p class="text-[10px] text-slate-400 font-bold uppercase">Check-ins</p>
                            </div>
                            <div class="w-px h-8 bg-slate-800"></div>
                            <div class="text-right">
                                <h3 class="text-2xl font-extrabold text-slate-100 font-heading" id="metric-checkouts">-</h3>
                                <p class="text-[10px] text-slate-400 font-bold uppercase">Check-outs</p>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Monthly Profit Margin -->
                <div class="glass-card p-5 rounded-2xl relative overflow-hidden flex flex-col justify-between h-32">
                    <div class="flex items-center justify-between">
                        <span class="text-xs font-bold text-slate-400 uppercase tracking-wider">Monthly Profit</span>
                        <div class="w-8 h-8 rounded-lg bg-amber-500/10 flex items-center justify-center text-amber-400">
                            <i class="fa-solid fa-coins text-sm"></i>
                        </div>
                    </div>
                    <div class="mt-3">
                        <h3 class="text-2xl font-extrabold text-slate-100 font-heading" id="metric-monthly-profit">-$0.00</h3>
                        <p class="text-[10px] text-slate-400 mt-1 flex justify-between">
                            <span>Rev: <span id="metric-monthly-rev">-$</span></span>
                            <span>Exp: <span id="metric-monthly-exp">-$</span></span>
                        </p>
                    </div>
                </div>
            </div>

            <!-- Visual Charts Section & Booking table -->
            <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <!-- Financial chart (Span 2) -->
                <div class="glass-panel p-6 rounded-2xl border border-slate-800/80 shadow-lg lg:col-span-2 flex flex-col h-[400px]">
                    <div class="flex items-center justify-between mb-4">
                        <div>
                            <h3 class="text-base font-bold text-slate-200 font-heading">7-Day Financial Summary</h3>
                            <p class="text-xs text-slate-400">Comparison of daily rooms income vs operational expenses.</p>
                        </div>
                        <div class="flex items-center gap-4 text-xs font-semibold">
                            <span class="flex items-center gap-1.5 text-brand-400"><span class="w-2.5 h-2.5 rounded-full bg-brand-500"></span> Income</span>
                            <span class="flex items-center gap-1.5 text-rose-400"><span class="w-2.5 h-2.5 rounded-full bg-rose-500"></span> Expenses</span>
                        </div>
                    </div>
                    <div class="flex-grow relative">
                        <canvas id="financial-line-chart" class="w-full h-full"></canvas>
                    </div>
                </div>

                <!-- Fast Room Status Chart -->
                <div class="glass-panel p-6 rounded-2xl border border-slate-800/80 shadow-lg flex flex-col h-[400px]">
                    <h3 class="text-base font-bold text-slate-200 font-heading mb-1">Room Status Split</h3>
                    <p class="text-xs text-slate-400 mb-6">Visual segmentation of hotel rooms occupancy.</p>
                    <div class="flex-grow flex items-center justify-center relative">
                        <canvas id="occupancy-donut-chart" class="w-full max-h-56"></canvas>
                    </div>
                </div>
            </div>

            <!-- Recent Bookings Table -->
            <div class="glass-panel rounded-2xl border border-slate-800/80 shadow-lg overflow-hidden">
                <div class="p-6 border-b border-slate-800/60 flex items-center justify-between">
                    <div>
                        <h3 class="text-base font-bold text-slate-200 font-heading">Recent Booking Registrations</h3>
                        <p class="text-xs text-slate-400">Latest reservation logs processed.</p>
                    </div>
                    <a href="#bookings" class="text-xs font-semibold text-brand-400 hover:text-brand-300 transition-colors flex items-center gap-1">
                        <span>View All Bookings</span>
                        <i class="fa-solid fa-arrow-right text-[10px]"></i>
                    </a>
                </div>
                <div class="overflow-x-auto">
                    <table class="w-full text-left border-collapse">
                        <thead>
                            <tr class="bg-slate-900/50 text-slate-400 text-[10px] font-bold tracking-wider uppercase border-b border-slate-800/40">
                                <th class="py-3.5 px-6">Booking Reference</th>
                                <th class="py-3.5 px-6">Customer</th>
                                <th class="py-3.5 px-6">Room Number</th>
                                <th class="py-3.5 px-6">Period</th>
                                <th class="py-3.5 px-6">Total Cost</th>
                                <th class="py-3.5 px-6">Status</th>
                            </tr>
                        </thead>
                        <tbody id="recent-bookings-tbody" class="divide-y divide-slate-800/40 text-sm text-slate-300">
                            <!-- Populated dynamically -->
                            <tr>
                                <td colspan="6" class="py-8 text-center text-slate-500">Loading bookings data...</td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    `;

    // Hook elements
    document.getElementById('refresh-dashboard-btn').addEventListener('click', () => loadDashboardData(container));

    // Load actual stats
    await loadDashboardData(container);
}

// Global chart references so they can be clean destroyed
let incomeExpensesChart = null;
let roomStatusChart = null;
let lastSevenDayReport = null;
let lastRoomStatus = { avail: 0, occupied: 0, maintenance: 0 };
let themeChangeListenerAttached = false;

async function loadDashboardData(container) {
    try {
        const response = await api.getDashboardStats();
        const data = response.data;
        
        // Destructure and assign dashboard metrics
        const {
            totalRooms = 0,
            availableRooms = 0,
            occupiedRooms = 0,
            occupancyRate = 0,
            todayCheckIns = 0,
            todayCheckOuts = 0,
            monthlyIncome = 0,
            monthlyExpenses = 0,
            monthlyProfit = 0,
            sevenDayReport = { dates: [], income: [], expenses: [] },
            recentBookings = []
        } = data;

        // Cache last data
        lastSevenDayReport = sevenDayReport;
        lastRoomStatus = {
            avail: availableRooms,
            occupied: occupiedRooms,
            maintenance: totalRooms - (availableRooms + occupiedRooms)
        };

        // Update UI metric counters
        document.getElementById('metric-total-rooms').innerText = totalRooms;
        document.getElementById('metric-available-rooms').innerText = availableRooms;
        document.getElementById('metric-occupied-rooms').innerText = occupiedRooms;
        document.getElementById('metric-occupancy-rate').innerText = `${occupancyRate}%`;
        document.getElementById('occupancy-progress').style.width = `${occupancyRate}%`;
        
        document.getElementById('metric-checkins').innerText = todayCheckIns;
        document.getElementById('metric-checkouts').innerText = todayCheckOuts;
        
        document.getElementById('metric-monthly-profit').innerText = `Rs ${monthlyProfit.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}`;
        document.getElementById('metric-monthly-rev').innerText = `Rs ${monthlyIncome.toLocaleString(undefined, {maximumFractionDigits: 0})}`;
        document.getElementById('metric-monthly-exp').innerText = `Rs ${monthlyExpenses.toLocaleString(undefined, {maximumFractionDigits: 0})}`;
        
        // Color profit value based on profit status (negative/positive)
        const profitCard = document.getElementById('metric-monthly-profit');
        if (monthlyProfit < 0) {
            profitCard.className = "text-2xl font-extrabold text-rose-400 font-heading";
        } else {
            profitCard.className = "text-2xl font-extrabold text-slate-100 dark:text-slate-100 font-heading";
        }

        // Render line chart
        renderFinancialChart(sevenDayReport);

        // Render donut chart
        renderDonutChart(availableRooms, occupiedRooms, lastRoomStatus.maintenance);

        // Populate recent bookings
        renderRecentBookings(recentBookings);

        // Listen for theme changes to update charts color theme on the fly
        if (!themeChangeListenerAttached) {
            window.addEventListener('theme-changed', () => {
                if (lastSevenDayReport) {
                    renderFinancialChart(lastSevenDayReport);
                }
                renderDonutChart(lastRoomStatus.avail, lastRoomStatus.occupied, lastRoomStatus.maintenance);
            });
            themeChangeListenerAttached = true;
        }

    } catch (error) {
        console.error('Error fetching dashboard statistics:', error);
        showToast('Error retrieving dashboard indicators. Rendering fallback visuals.', 'warning');
        
        // Load fallback static/mock view in case api failed or returned empty
        loadFallbackMetrics();
    }
}

function renderFinancialChart(chartData) {
    const ctx = document.getElementById('financial-line-chart').getContext('2d');
    
    // Destroy previous charts to prevent memory leak & canvas overlay gltiches
    if (incomeExpensesChart) {
        incomeExpensesChart.destroy();
    }

    const dates = chartData.dates && chartData.dates.length > 0 ? chartData.dates : ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    const income = chartData.income && chartData.income.length > 0 ? chartData.income : [850, 1100, 950, 1400, 1800, 2200, 1950];
    const expenses = chartData.expenses && chartData.expenses.length > 0 ? chartData.expenses : [400, 450, 420, 500, 600, 850, 520];

    const isDark = document.documentElement.classList.contains('dark');
    const gridColor = isDark ? 'rgba(255, 255, 255, 0.03)' : 'rgba(0, 0, 0, 0.05)';
    const tickColor = isDark ? '#94a3b8' : '#475569';

    incomeExpensesChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: dates,
            datasets: [
                {
                    label: 'Income',
                    data: income,
                    borderColor: '#8b5cf6', // brand.500
                    backgroundColor: 'rgba(139, 92, 246, 0.05)',
                    borderWidth: 3,
                    tension: 0.35,
                    fill: true,
                    pointBackgroundColor: '#8b5cf6',
                    pointHoverRadius: 6,
                },
                {
                    label: 'Expenses',
                    data: expenses,
                    borderColor: '#f43f5e', // rose.500
                    backgroundColor: 'rgba(244, 63, 94, 0.02)',
                    borderWidth: 3,
                    tension: 0.35,
                    fill: true,
                    pointBackgroundColor: '#f43f5e',
                    pointHoverRadius: 6,
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { display: false }
            },
            scales: {
                y: {
                    grid: { color: gridColor },
                    ticks: { color: tickColor, font: { size: 10 } }
                },
                x: {
                    grid: { display: false },
                    ticks: { color: tickColor, font: { size: 10 } }
                }
            }
        }
    });
}

function renderDonutChart(avail, occupied, maintenance) {
    const ctx = document.getElementById('occupancy-donut-chart').getContext('2d');

    if (roomStatusChart) {
        roomStatusChart.destroy();
    }

    const valAvail = avail || 24;
    const valOcc = occupied || 14;
    const valMaint = maintenance || 2;

    const isDark = document.documentElement.classList.contains('dark');
    const chartBgColor = isDark ? '#0f172a' : '#ffffff';
    const chartLegendColor = isDark ? '#1e293b' : '#1e293b';

    roomStatusChart = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: ['Available', 'Occupied', 'Maintenance'],
            datasets: [{
                data: [valAvail, valOcc, valMaint],
                backgroundColor: ['#10b981', '#ef4444', '#f59e0b'],
                borderWidth: 4,
                borderColor: chartBgColor,
                hoverOffset: 4
            }]
        },
        options: {
            responsive: true,
            plugins: {
                legend: {
                    position: 'bottom',
                    labels: {
                        color: chartLegendColor,
                        padding: 16,
                        font: { size: 11 }
                    }
                }
            },
            cutout: '70%'
        }
    });
}

function renderRecentBookings(bookings) {
    const tbody = document.getElementById('recent-bookings-tbody');
    if (!bookings || bookings.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="6" class="py-8 text-center text-slate-500">No recent bookings recorded.</td>
            </tr>
        `;
        return;
    }

    tbody.innerHTML = bookings.map(b => {
        const dateOptions = { month: 'short', day: 'numeric' };
        const checkInFormatted = new Date(b.checkIn).toLocaleDateString('en-US', dateOptions);
        const checkOutFormatted = new Date(b.checkOut).toLocaleDateString('en-US', dateOptions);
        
        const statusColors = {
            'pending': 'bg-amber-500/10 text-amber-400 border-amber-500/20',
            'checked-in': 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
            'checked-out': 'bg-slate-800 text-slate-400 border-slate-700/50',
            'cancelled': 'bg-rose-500/10 text-rose-400 border-rose-500/20',
        };
        const statusLabel = b.status || 'pending';
        const colorClass = statusColors[statusLabel.toLowerCase()] || 'bg-slate-800 text-slate-400 border-slate-700/50';

        return `
            <tr class="hover:bg-slate-900/30 transition-colors">
                <td class="py-4 px-6 font-semibold text-slate-200">#${b.id.toString().substring(0, 8)}</td>
                <td class="py-4 px-6 font-medium">${b.customer?.name || 'Walk-in Guest'}</td>
                <td class="py-4 px-6 text-indigo-400 font-bold">Room ${b.room?.roomNumber || 'N/A'}</td>
                <td class="py-4 px-6 text-xs text-slate-400">${checkInFormatted} &mdash; ${checkOutFormatted}</td>
                <td class="py-4 px-6 font-bold text-slate-200">Rs ${(b.totalAmount || 0).toFixed(2)}</td>
                <td class="py-4 px-6">
                    <span class="inline-block px-2.5 py-0.5 rounded-full text-xs font-bold capitalize border ${colorClass}">
                        ${statusLabel}
                    </span>
                </td>
            </tr>
        `;
    }).join('');
}

// Fallback logic to show dashboard elements if server is completely offline
function loadFallbackMetrics() {
    document.getElementById('metric-total-rooms').innerText = "40";
    document.getElementById('metric-available-rooms').innerText = "22";
    document.getElementById('metric-occupied-rooms').innerText = "15";
    document.getElementById('metric-occupancy-rate').innerText = "37.5%";
    document.getElementById('occupancy-progress').style.width = "37.5%";
    
    document.getElementById('metric-checkins').innerText = "5";
    document.getElementById('metric-checkouts').innerText = "3";
    
    document.getElementById('metric-monthly-profit').innerText = "$14,820.00";
    document.getElementById('metric-monthly-rev').innerText = "$23,500";
    document.getElementById('metric-monthly-exp').innerText = "$8,680";

    renderFinancialChart({
        dates: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
        income: [1200, 1500, 1100, 1800, 2400, 2900, 2100],
        expenses: [600, 650, 580, 700, 900, 1200, 750]
    });

    renderDonutChart(22, 15, 3);

    const fallbackBookings = [
        { id: '10049281', customer: { name: 'Sophia Miller' }, room: { roomNumber: '102' }, checkIn: '2026-05-28', checkOut: '2026-05-30', totalAmount: 320, status: 'Checked-in' },
        { id: '10049282', customer: { name: 'Oliver Smith' }, room: { roomNumber: '304' }, checkIn: '2026-05-28', checkOut: '2026-06-02', totalAmount: 850, status: 'Checked-in' },
        { id: '10049283', customer: { name: 'Emma Johnson' }, room: { roomNumber: '215' }, checkIn: '2026-05-27', checkOut: '2026-05-28', totalAmount: 180, status: 'Checked-out' },
        { id: '10049284', customer: { name: 'Liam Brown' }, room: { roomNumber: '110' }, checkIn: '2026-05-29', checkOut: '2026-05-31', totalAmount: 240, status: 'Pending' }
    ];

    renderRecentBookings(fallbackBookings);
}
