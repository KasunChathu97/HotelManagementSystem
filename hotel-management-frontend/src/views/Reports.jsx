import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { useApp } from '../context/AppContext';

export default function Reports() {
    const { showToast, setGlobalLoading } = useApp();
    const [reportTab, setReportTab] = useState('income');
    const [startDate, setStartDate] = useState('2026-05-01');
    const [endDate, setEndDate] = useState('2026-05-31');
    const [reportData, setReportData] = useState(null);
    const [loading, setLoading] = useState(false);
    const isRefreshing = loading && !!reportData;

    const normalizeIncomeReport = (rows) => {
        const items = (rows || []).map((row, index) => ({
            id: `${row.period}-${row.payment_method || index}`,
            period: row.period,
            paymentMethod: row.payment_method,
            totalIncome: Number(row.total_income || 0),
            transactionCount: Number(row.transaction_count || 0)
        }));

        return {
            totalRevenue: items.reduce((sum, item) => sum + item.totalIncome, 0),
            transactionsCount: items.reduce((sum, item) => sum + item.transactionCount, 0),
            items
        };
    };

    const normalizeExpenseReport = (payload) => {
        const breakdown = payload.breakdown || [];
        return {
            totalExpenses: Number(payload.total || 0),
            transactionsCount: breakdown.reduce((sum, item) => sum + Number(item.expense_count || 0), 0),
            items: breakdown.map((item, index) => ({
                id: `${item.expense_type || 'expense'}-${item.category || index}-${item.month || index}`,
                expenseType: item.expense_type,
                category: item.category || item.expense_type || 'General',
                description: item.month ? `Month ${item.month}` : (item.description || 'Expense entry'),
                amount: Number(item.total_amount || item.amount || 0),
                count: Number(item.expense_count || item.count || 0),
                month: item.month
            }))
        };
    };

    const normalizeProfitLossReport = (payload) => ({
        revenue: Number(payload.total_income || 0),
        expenses: Number(payload.total_expenses || 0),
        netProfit: Number(payload.gross_profit || 0),
        margin: Number(payload.profit_margin || 0)
    });

    const normalizeOccupancyReport = (rows) => {
        const items = rows || [];
        const occupiedNights = items.reduce((sum, item) => sum + Math.max(Number(item.current_occupancy || 0), 0), 0);
        const totalBookings = items.reduce((sum, item) => sum + Math.max(Number(item.total_bookings || 0), 0), 0);
        const availableNights = items.reduce((sum, item) => sum + Math.max(Number(item.total_bookings || 0) - Number(item.current_occupancy || 0), 0), 0);

        return {
            totalRooms: items.length,
            averageOccupancy: totalBookings > 0 ? Number(((occupiedNights / totalBookings) * 100).toFixed(2)) : 0,
            occupiedNights,
            availableNights,
            items
        };
    };

    const generateReport = async () => {
        setLoading(true);
        const params = { start_date: startDate, end_date: endDate };
        try {
            let res;
            if (reportTab === 'income') {
                res = await api.getIncomeReport(params);
                setReportData(normalizeIncomeReport(res.data.data || res.data || []));
            } else if (reportTab === 'expenses') {
                res = await api.getExpenseReport(params);
                const expenseData = normalizeExpenseReport(res.data.data || res.data || {});
                setReportData(expenseData);
            } else if (reportTab === 'profit-loss') {
                res = await api.getProfitLossReport(params);
                setReportData(normalizeProfitLossReport(res.data.data || res.data || {}));
            } else {
                res = await api.getOccupancyReport(params);
                setReportData(normalizeOccupancyReport(res.data.data || res.data || []));
            }
        } catch (error) {
            console.error('Error generating report:', error);
            showToast('Failed to generate report', 'error');
            setReportData(null);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        generateReport();
    }, [reportTab, startDate, endDate]);

    const handleExport = async (format) => {
        setGlobalLoading(true);
        try {
            let res;
            if (format === 'pdf') {
                res = await api.exportReportPdf(reportTab, { start_date: startDate, end_date: endDate });
                const file = new Blob([res.data], { type: 'application/pdf' });
                const fileURL = URL.createObjectURL(file);
                window.open(fileURL);
                showToast('Report generated successfully as PDF!', 'success');
            } else {
                res = await api.exportReportExcel(reportTab, { start_date: startDate, end_date: endDate });
                const file = new Blob([res.data], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
                const fileURL = URL.createObjectURL(file);
                const link = document.createElement('a');
                link.href = fileURL;
                link.setAttribute('download', `GrandHorizon_${reportTab}_Report.xlsx`);
                document.body.appendChild(link);
                link.click();
                link.parentNode.removeChild(link);
                showToast('Report downloaded successfully as Excel!', 'success');
            }
        } catch (error) {
            console.error('Export error:', error);
            showToast('Unable to export report from backend.', 'error');
        } finally {
            setGlobalLoading(false);
        }
    };

    const formatAmount = (amount) => {
        if (amount === undefined || amount === null || isNaN(amount)) {
            return '0.00';
        }
        return amount.toFixed(2);
    };

    return (
        <div className="space-y-6 animate-fade-in font-sans">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-slate-100 tracking-tight font-heading">Reports & Analytics</h1>
                    <p className="text-sm text-slate-400">Generate statements, compute profit margins, and analyze hotel occupancy levels.</p>
                </div>
                <div className="flex gap-2">
                    <button 
                        onClick={() => window.print()}
                        className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-slate-200 border border-slate-800 rounded-xl transition-all flex items-center gap-2 text-sm font-semibold"
                    >
                        <i className="fa-solid fa-print"></i>
                        <span>Print Page</span>
                    </button>
                    <button 
                        onClick={() => handleExport('excel')}
                        className="px-4 py-2 bg-brand-600 hover:bg-brand-500 text-white rounded-xl shadow-md shadow-brand-500/10 hover:shadow-brand-500/20 font-semibold transition-all flex items-center gap-2 text-sm"
                    >
                        <i className="fa-solid fa-file-excel"></i>
                        <span>Export Excel</span>
                    </button>
                </div>
            </div>

            {/* Filter and Tab Panel */}
            <div className="glass-panel p-5 rounded-2xl border border-slate-800/80 space-y-4">
                <div className="flex flex-wrap gap-2.5 border-b border-slate-800 pb-3">
                    <button 
                        onClick={() => setReportTab('income')}
                        className={`px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider border transition-all ${reportTab === 'income' ? 'bg-brand-600 text-white border-brand-500 shadow-md shadow-brand-550/15' : 'bg-slate-900 border-slate-800 text-slate-450 hover:text-slate-200'}`}
                    >
                        Income Report
                    </button>
                    <button 
                        onClick={() => setReportTab('expenses')}
                        className={`px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider border transition-all ${reportTab === 'expenses' ? 'bg-brand-600 text-white border-brand-500 shadow-md shadow-brand-550/15' : 'bg-slate-900 border-slate-800 text-slate-450 hover:text-slate-200'}`}
                    >
                        Expense Report
                    </button>
                    <button 
                        onClick={() => setReportTab('profit-loss')}
                        className={`px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider border transition-all ${reportTab === 'profit-loss' ? 'bg-brand-600 text-white border-brand-500 shadow-md shadow-brand-550/15' : 'bg-slate-900 border-slate-800 text-slate-450 hover:text-slate-200'}`}
                    >
                        Profit & Loss Statement
                    </button>
                    <button 
                        onClick={() => setReportTab('occupancy')}
                        className={`px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider border transition-all ${reportTab === 'occupancy' ? 'bg-brand-600 text-white border-brand-500 shadow-md shadow-brand-550/15' : 'bg-slate-900 border-slate-800 text-slate-450 hover:text-slate-200'}`}
                    >
                        Occupancy Audit
                    </button>
                </div>

                <div className="flex flex-wrap items-center gap-4">
                    <div className="flex items-center gap-2">
                        <label className="text-xs font-bold uppercase tracking-wider text-slate-450">From:</label>
                        <input 
                            type="date" 
                            value={startDate}
                            onChange={(e) => setStartDate(e.target.value)}
                            className="px-3 py-1.5 bg-slate-900 border border-slate-800 rounded-xl text-slate-200 text-xs focus:border-brand-500 focus:outline-none"
                        />
                    </div>
                    <div className="flex items-center gap-2">
                        <label className="text-xs font-bold uppercase tracking-wider text-slate-450">To:</label>
                        <input 
                            type="date" 
                            value={endDate}
                            onChange={(e) => setEndDate(e.target.value)}
                            className="px-3 py-1.5 bg-slate-900 border border-slate-800 rounded-xl text-slate-200 text-xs focus:border-brand-500 focus:outline-none"
                        />
                    </div>
                    <button 
                        onClick={generateReport}
                        className="px-3.5 py-1.5 bg-slate-850 hover:bg-slate-800 text-slate-200 font-semibold rounded-xl text-xs border border-slate-750 transition-all ml-auto flex items-center gap-1.5"
                    >
                        <i className="fa-solid fa-arrows-rotate"></i>
                        Update
                    </button>
                </div>
            </div>

            {/* Render Report Results */}
            <div className="glass-panel p-6 rounded-2xl border border-slate-800/80 shadow-lg min-h-[250px] flex flex-col justify-between relative overflow-hidden">
                {loading && !reportData ? (
                    <div className="flex flex-col items-center justify-center py-20">
                        <div className="w-10 h-10 border-4 border-brand-500 border-t-transparent rounded-full animate-spin"></div>
                        <span className="mt-4 text-slate-400 font-semibold">Computing statement metrics...</span>
                    </div>
                ) : !reportData ? (
                    <div className="text-center py-20 text-slate-500">Choose date ranges and click Update to calculate report summaries.</div>
                ) : (
                    <div className="space-y-6">
                        {/* Tab Content: Income / Expense Tables */}
                        {(reportTab === 'income' || reportTab === 'expenses') && (
                            <div className="space-y-4">
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="glass-card p-4 rounded-xl border border-slate-800/60">
                                        <div className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                                            {reportTab === 'income' ? 'Total Revenue Inflows' : 'Total Operational Outflows'}
                                        </div>
                                        <div className={`text-2xl font-black mt-2 font-heading ${reportTab === 'income' ? 'text-emerald-400' : 'text-rose-400'}`}>
                                            Rs {formatAmount(reportTab === 'income' ? reportData.totalRevenue : reportData.totalExpenses)}
                                        </div>
                                    </div>
                                    <div className="glass-card p-4 rounded-xl border border-slate-800/60">
                                        <div className="text-xs font-bold text-slate-400 uppercase tracking-wider">Transaction Records Count</div>
                                        <div className="text-2xl font-black text-slate-200 mt-2 font-heading">{reportData.transactionsCount || 0} Records</div>
                                    </div>
                                </div>

                                <div className="overflow-x-auto rounded-xl border border-slate-800/40">
                                    <table className="w-full text-left border-collapse">
                                        <thead>
                                            <tr className="bg-slate-900/40 text-slate-450 text-[10px] font-bold tracking-wider uppercase border-b border-slate-800/40">
                                                {reportTab === 'income' ? (
                                                    <>
                                                        <th className="py-3 px-5">Period</th>
                                                        <th className="py-3 px-5">Payment Method</th>
                                                        <th className="py-3 px-5">Transactions</th>
                                                        <th className="py-3 px-5 text-right">Income</th>
                                                    </>
                                                ) : (
                                                    <>
                                                        <th className="py-3 px-5">Ref ID</th>
                                                        <th className="py-3 px-5">Category</th>
                                                        <th className="py-3 px-5">Description</th>
                                                        <th className="py-3 px-5">Count</th>
                                                        <th className="py-3 px-5 text-right">Amount</th>
                                                    </>
                                                )}
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-800/40 text-sm text-slate-350">
                                            {(reportData.items || []).map(item => {
                                                if (reportTab === 'income') {
                                                    return (
                                                        <tr key={item.id} className="hover:bg-slate-900/20">
                                                            <td className="py-3 px-5 font-semibold text-slate-400">{item.period}</td>
                                                            <td className="py-3 px-5 font-bold text-slate-200 capitalize">{item.paymentMethod}</td>
                                                            <td className="py-3 px-5 text-slate-450">{item.transactionCount} records</td>
                                                            <td className="py-3 px-5 text-right font-black text-emerald-400">Rs {formatAmount(item.totalIncome)}</td>
                                                        </tr>
                                                    );
                                                }

                                                return (
                                                    <tr key={item.id} className="hover:bg-slate-900/20">
                                                        <td className="py-3 px-5 font-semibold text-slate-400">#{item.id}</td>
                                                        <td className="py-3 px-5 font-bold text-slate-200 capitalize">{item.category || 'General'}</td>
                                                        <td className="py-3 px-5 text-slate-450 italic">{item.description || 'Expense entry'}</td>
                                                        <td className="py-3 px-5 text-slate-400">{item.count || 0}</td>
                                                        <td className="py-3 px-5 text-right font-black text-rose-400">Rs {formatAmount(item.amount)}</td>
                                                    </tr>
                                                );
                                            })}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        )}

                        {/* Tab Content: Profit and Loss Statement */}
                        {reportTab === 'profit-loss' && (
                            <div className="space-y-6">
                                <div className="border-b border-slate-800 pb-2">
                                    <h3 className="text-base font-bold text-slate-200 font-heading">Profit & Loss Statement (P&L)</h3>
                                    <p className="text-xs text-slate-400">Net revenue margin computed from room collections and general operations.</p>
                                </div>

                                <div className="space-y-3 max-w-md">
                                        <div className="flex justify-between border-b border-slate-800/60 pb-2 text-sm">
                                        <span className="text-slate-400 font-medium">Gross Room Revenue Inflow:</span>
                                        <span className="font-bold text-emerald-400">+Rs {formatAmount(reportData.revenue)}</span>
                                    </div>
                                    <div className="flex justify-between border-b border-slate-800/60 pb-2 text-sm">
                                        <span className="text-slate-400 font-medium">General Operating Expenses:</span>
                                        <span className="font-bold text-rose-400">-Rs {formatAmount(reportData.expenses)}</span>
                                    </div>
                                    <div className="flex justify-between border-b border-slate-850 pb-2 text-base font-black pt-2">
                                        <span className="text-slate-200">Net Operating Revenue (Profit):</span>
                                        <span className={reportData.netProfit < 0 ? 'text-rose-400' : 'text-emerald-400'}>
                                            Rs {formatAmount(reportData.netProfit)}
                                        </span>
                                    </div>
                                    <div className="flex justify-between text-xs text-slate-450">
                                        <span>Operating Profit Margin:</span>
                                        <span className="font-bold text-indigo-400">{reportData.margin || 0}%</span>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Tab Content: Occupancy Audit */}
                        {reportTab === 'occupancy' && (
                            <div className="space-y-4">
                                <div className="border-b border-slate-800 pb-2">
                                    <h3 className="text-base font-bold text-slate-200 font-heading">Occupancy Audit Status</h3>
                                    <p className="text-xs text-slate-400">Comprehensive room bookings ratios analyzed.</p>
                                </div>

                                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                                    <div className="glass-card p-4 rounded-xl border border-slate-800/60">
                                        <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Average Occupancy</div>
                                        <div className="text-2xl font-black text-indigo-400 mt-2 font-heading">{reportData.averageOccupancy || 0}%</div>
                                    </div>
                                    <div className="glass-card p-4 rounded-xl border border-slate-800/60">
                                        <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Occupied Room Nights</div>
                                        <div className="text-2xl font-black text-emerald-400 mt-2 font-heading">{reportData.occupiedNights || 0} Nights</div>
                                    </div>
                                    <div className="glass-card p-4 rounded-xl border border-slate-800/60">
                                        <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Available Room Nights</div>
                                        <div className="text-2xl font-black text-slate-350 mt-2 font-heading">{reportData.availableNights || 0} Nights</div>
                                    </div>
                                    <div className="glass-card p-4 rounded-xl border border-slate-800/60">
                                        <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Total Rooms Inventory</div>
                                        <div className="text-2xl font-black text-slate-200 mt-2 font-heading">{reportData.totalRooms || 0} Rooms</div>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                )}

                {isRefreshing && (
                    <div className="pointer-events-none absolute top-4 right-4 rounded-full border border-slate-700/80 bg-slate-950/90 px-3 py-1.5 text-xs font-semibold text-slate-300 shadow-lg shadow-black/20">
                        Refreshing report...
                    </div>
                )}
            </div>
        </div>
    );
}