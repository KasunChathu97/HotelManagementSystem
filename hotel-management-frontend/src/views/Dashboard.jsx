import React, { useEffect, useRef, useState } from 'react';
import { Chart, registerables } from 'chart.js';
import api from '../services/api';
import { useApp } from '../context/AppContext';

// Register Chart.js components
Chart.register(...registerables);

export default function Dashboard() {
    const { showToast, theme, user } = useApp();
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);

    const financialChartRef = useRef(null);
    const occupancyChartRef = useRef(null);
    
    const financialCanvasRef = useRef(null);
    const occupancyCanvasRef = useRef(null);

    const fetchStats = async () => {
        setLoading(true);

        try {
            const response = await api.getDashboardStats();
            const responseData = response.data.data || response.data;
            setStats({
                totalRooms: responseData.rooms?.total || 0,
                availableRooms: responseData.rooms?.available || 0,
                occupiedRooms: responseData.rooms?.occupied || 0,
                occupancyRate: Number(responseData.rooms?.occupancy_rate || 0),
                todayCheckIns: responseData.todays_activity?.checkins || 0,
                todayCheckOuts: responseData.todays_activity?.checkouts || 0,
                monthlyIncome: Number(responseData.monthly_finance?.income || 0),
                monthlyExpenses: Number(responseData.monthly_finance?.expenses || 0),
                monthlyProfit: Number(responseData.monthly_finance?.profit || 0),
                recentBookings: (responseData.recent_bookings || []).map((booking) => ({
                    id: booking.booking_id || booking.id,
                    customer: { name: `${booking.first_name || ''} ${booking.last_name || ''}`.trim() },
                    room: { roomNumber: booking.room_number },
                    checkIn: booking.check_in_date,
                    checkOut: booking.check_out_date,
                    totalAmount: Number(booking.total_amount || 0),
                    status: booking.booking_status === 'checked_in' ? 'Checked-in' : booking.booking_status === 'checked_out' ? 'Checked-out' : 'Pending'
                })),
                sevenDayReport: {
                    dates: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
                    income: [0, 0, 0, 0, 0, 0, 0],
                    expenses: [0, 0, 0, 0, 0, 0, 0]
                }
            });
        } catch (error) {
            console.warn('Error fetching dashboard stats:', error);
            showToast('Unable to load dashboard data from the backend.', 'error');
            setStats(null);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchStats();
    }, []);

    // Render / Update charts when stats or theme change
    useEffect(() => {
        if (!stats) return;

        // Clean up financial chart
        if (financialChartRef.current) {
            financialChartRef.current.destroy();
        }

        // Clean up occupancy chart
        if (occupancyChartRef.current) {
            occupancyChartRef.current.destroy();
        }

        const isDark = theme === 'dark';
        const gridColor = isDark ? 'rgba(255, 255, 255, 0.03)' : 'rgba(0, 0, 0, 0.05)';
        const tickColor = isDark ? '#94a3b8' : '#475569';
        const chartBgColor = isDark ? '#0f172a' : '#ffffff';
        const chartLegendColor = isDark ? '#94a3b8' : '#1e293b';

        // Financial Line Chart
        const dates = stats.sevenDayReport?.dates || ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
        const income = stats.sevenDayReport?.income || [0, 0, 0, 0, 0, 0, 0];
        const expenses = stats.sevenDayReport?.expenses || [0, 0, 0, 0, 0, 0, 0];

        if (financialCanvasRef.current) {
            financialChartRef.current = new Chart(financialCanvasRef.current, {
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

        // Occupancy Doughnut Chart
        const avail = stats.availableRooms || 0;
        const occupied = stats.occupiedRooms || 0;
        const maintenance = stats.totalRooms - (avail + occupied);

        if (occupancyCanvasRef.current) {
            occupancyChartRef.current = new Chart(occupancyCanvasRef.current, {
                type: 'doughnut',
                data: {
                    labels: ['Available', 'Occupied', 'Maintenance'],
                    datasets: [{
                        data: [avail, occupied, maintenance],
                        backgroundColor: ['#10b981', '#ef4444', '#f59e0b'],
                        borderWidth: 4,
                        borderColor: chartBgColor,
                        hoverOffset: 4
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
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

        return () => {
            if (financialChartRef.current) financialChartRef.current.destroy();
            if (occupancyChartRef.current) occupancyChartRef.current.destroy();
        };
    }, [stats, theme]);

    if (loading && !stats) {
        return (
            <div className="space-y-6 animate-pulse">
                <div className="h-8 bg-slate-200 dark:bg-slate-800 w-1/4 rounded-lg"></div>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                    {[1, 2, 3, 4].map(n => (
                        <div key={n} className="h-28 bg-slate-250 dark:bg-slate-800 rounded-2xl"></div>
                    ))}
                </div>
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    <div className="h-80 bg-slate-250 dark:bg-slate-800 rounded-2xl lg:col-span-2"></div>
                    <div className="h-80 bg-slate-250 dark:bg-slate-800 rounded-2xl"></div>
                </div>
            </div>
        );
    }

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
        recentBookings = []
    } = stats || {};

    const statusColors = {
        'pending': 'bg-amber-500/10 text-amber-400 border-amber-500/20',
        'checked-in': 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
        'checked-out': 'bg-slate-850 text-slate-400 border-slate-700/50',
        'cancelled': 'bg-rose-500/10 text-rose-400 border-rose-500/20',
    };

    return (
        <div className="space-y-6 animate-fade-in">
            {/* Page Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-slate-100 tracking-tight font-heading">Dashboard Overview</h1>
                    <p className="text-sm text-slate-400 font-sans">Real-time occupancy status, operations, and financial indicators.</p>
                </div>
                <button 
                    onClick={fetchStats}
                    className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-slate-200 border border-slate-800 rounded-xl transition-all flex items-center gap-2 text-sm font-medium"
                >
                    <i className="fa-solid fa-arrows-rotate text-xs"></i>
                    <span>Refresh Stats</span>
                </button>
            </div>

            {/* KPI Metric Cards Grid */}
            <div className={`grid grid-cols-1 sm:grid-cols-2 ${user?.role?.toLowerCase() === 'admin' ? 'lg:grid-cols-4' : 'lg:grid-cols-3'} gap-5`}>
                {/* Room Inventory Stats */}
                <div className="glass-card p-5 rounded-2xl relative overflow-hidden flex flex-col justify-between h-32">
                    <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Total Rooms</span>
                        <div className="w-8 h-8 rounded-lg bg-indigo-500/10 flex items-center justify-center text-indigo-400">
                            <i className="fa-solid fa-door-closed text-sm"></i>
                        </div>
                    </div>
                    <div className="mt-4">
                        <h3 className="text-3xl font-extrabold text-slate-100 font-heading">{totalRooms}</h3>
                        <p className="text-xs text-slate-455 mt-1 flex items-center gap-1 font-sans">
                            <span className="text-emerald-400 font-bold">{availableRooms}</span> Available, 
                            <span className="text-rose-400 font-bold">{occupiedRooms}</span> Occupied
                        </p>
                    </div>
                </div>

                {/* Occupancy Rate */}
                <div className="glass-card p-5 rounded-2xl relative overflow-hidden flex flex-col justify-between h-32">
                    <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Occupancy Rate</span>
                        <div className="w-8 h-8 rounded-lg bg-brand-500/10 flex items-center justify-center text-brand-400">
                            <i className="fa-solid fa-percent text-sm"></i>
                        </div>
                    </div>
                    <div className="mt-4">
                        <h3 className="text-3xl font-extrabold text-slate-100 font-heading">{occupancyRate}%</h3>
                        <div className="w-full bg-slate-800 h-1.5 rounded-full mt-2 overflow-hidden">
                            <div className="bg-brand-500 h-full rounded-full transition-all duration-500" style={{ width: `${occupancyRate}%` }}></div>
                        </div>
                    </div>
                </div>

                {/* Daily Operations */}
                <div className="glass-card p-5 rounded-2xl relative overflow-hidden flex flex-col justify-between h-32">
                    <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Today's Traffic</span>
                        <div className="w-8 h-8 rounded-lg bg-emerald-500/10 flex items-center justify-center text-emerald-400">
                            <i className="fa-solid fa-arrows-left-right text-sm"></i>
                        </div>
                    </div>
                    <div className="mt-4">
                        <div className="flex justify-between items-end">
                            <div>
                                <h3 className="text-2xl font-extrabold text-slate-100 font-heading">{todayCheckIns}</h3>
                                <p className="text-[10px] text-slate-400 font-bold uppercase">Check-ins</p>
                            </div>
                            <div className="w-px h-8 bg-slate-800"></div>
                            <div className="text-right">
                                <h3 className="text-2xl font-extrabold text-slate-100 font-heading">{todayCheckOuts}</h3>
                                <p className="text-[10px] text-slate-400 font-bold uppercase">Check-outs</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Monthly Profit Margin - Admin only */}
                {user?.role?.toLowerCase() === 'admin' && (
                    <div className="glass-card p-5 rounded-2xl relative overflow-hidden flex flex-col justify-between h-32">
                        <div className="flex items-center justify-between">
                            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Monthly Profit</span>
                            <div className="w-8 h-8 rounded-lg bg-amber-500/10 flex items-center justify-center text-amber-400">
                                <i className="fa-solid fa-coins text-sm"></i>
                            </div>
                        </div>
                        <div className="mt-3">
                            <h3 className={`text-2xl font-extrabold font-heading ${monthlyProfit < 0 ? 'text-rose-400' : 'text-slate-100'}`}>
                                Rs {monthlyProfit.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                            </h3>
                            <p className="text-[10px] text-slate-400 mt-1 flex justify-between font-sans">
                                <span>Rev: <span>Rs {monthlyIncome.toLocaleString(undefined, { maximumFractionDigits: 0 })}</span></span>
                                <span>Exp: <span>Rs {monthlyExpenses.toLocaleString(undefined, { maximumFractionDigits: 0 })}</span></span>
                            </p>
                        </div>
                    </div>
                )}
            </div>

            {/* Visual Charts Section & Booking table */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Financial chart (Span 2) */}
                <div className="glass-panel p-6 rounded-2xl border border-slate-800/80 shadow-lg lg:col-span-2 flex flex-col h-[400px]">
                    <div className="flex items-center justify-between mb-4">
                        <div>
                            <h3 className="text-base font-bold text-slate-200 font-heading">7-Day Financial Summary</h3>
                            <p className="text-xs text-slate-400">Comparison of daily rooms income vs operational expenses.</p>
                        </div>
                        <div className="flex items-center gap-4 text-xs font-semibold">
                            <span className="flex items-center gap-1.5 text-brand-400"><span className="w-2.5 h-2.5 rounded-full bg-brand-500 inline-block"></span> Income</span>
                            <span className="flex items-center gap-1.5 text-rose-400"><span className="w-2.5 h-2.5 rounded-full bg-rose-500 inline-block"></span> Expenses</span>
                        </div>
                    </div>
                    <div className="flex-grow relative h-72">
                        <canvas ref={financialCanvasRef} className="w-full h-full"></canvas>
                    </div>
                </div>

                {/* Fast Room Status Chart */}
                <div className="glass-panel p-6 rounded-2xl border border-slate-800/80 shadow-lg flex flex-col h-[400px]">
                    <h3 className="text-base font-bold text-slate-200 font-heading mb-1">Room Status Split</h3>
                    <p className="text-xs text-slate-400 mb-6">Visual segmentation of hotel rooms occupancy.</p>
                    <div className="flex-grow relative h-56 flex items-center justify-center">
                        <canvas ref={occupancyCanvasRef} className="w-full max-h-56"></canvas>
                    </div>
                </div>
            </div>

            {/* Recent Bookings Table */}
            <div className="glass-panel rounded-2xl border border-slate-800/80 shadow-lg overflow-hidden">
                <div className="p-6 border-b border-slate-800/60 flex items-center justify-between">
                    <div>
                        <h3 className="text-base font-bold text-slate-200 font-heading">Recent Booking Registrations</h3>
                        <p className="text-xs text-slate-400">Latest reservation logs processed.</p>
                    </div>
                    <a href="#bookings" className="text-xs font-semibold text-brand-400 hover:text-brand-300 transition-colors flex items-center gap-1">
                        <span>View All Bookings</span>
                        <i className="fa-solid fa-arrow-right text-[10px]"></i>
                    </a>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-slate-900/50 text-slate-400 text-[10px] font-bold tracking-wider uppercase border-b border-slate-800/40">
                                <th className="py-3.5 px-6">Booking Reference</th>
                                <th className="py-3.5 px-6">Customer</th>
                                <th className="py-3.5 px-6">Room Number</th>
                                <th className="py-3.5 px-6">Period</th>
                                <th className="py-3.5 px-6">Total Cost</th>
                                <th className="py-3.5 px-6">Status</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-800/40 text-sm text-slate-300 font-sans">
                            {recentBookings.length === 0 ? (
                                <tr>
                                    <td colSpan="6" className="py-8 text-center text-slate-500">No recent bookings recorded.</td>
                                </tr>
                            ) : (
                                recentBookings.map(b => {
                                    const dateOptions = { month: 'short', day: 'numeric' };
                                    const checkInFormatted = new Date(b.checkIn || b.check_in).toLocaleDateString('en-US', dateOptions);
                                    const checkOutFormatted = new Date(b.checkOut || b.check_out).toLocaleDateString('en-US', dateOptions);
                                    
                                    const statusLabel = b.status || 'pending';
                                    const colorClass = statusColors[statusLabel.toLowerCase()] || 'bg-slate-800 text-slate-400 border-slate-700/50';

                                    return (
                                        <tr key={b.id || b.booking_id} className="hover:bg-slate-900/30 transition-colors">
                                            <td className="py-4 px-6 font-semibold text-slate-200">#{b.id?.toString().substring(0, 8) || b.booking_id}</td>
                                            <td className="py-4 px-6 font-medium">{b.customer?.name || b.customer?.full_name || 'Walk-in Guest'}</td>
                                            <td className="py-4 px-6 text-indigo-400 font-bold">Room {b.room?.roomNumber || b.room?.room_number || 'N/A'}</td>
                                            <td className="py-4 px-6 text-xs text-slate-400">{checkInFormatted} &mdash; {checkOutFormatted}</td>
                                            <td className="py-4 px-6 font-bold text-slate-200">Rs {(b.totalAmount || b.total_amount || 0).toFixed(2)}</td>
                                            <td className="py-4 px-6">
                                                <span className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-bold capitalize border ${colorClass}`}>
                                                    {statusLabel}
                                                </span>
                                            </td>
                                        </tr>
                                    );
                                })
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
