import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { useApp } from '../context/AppContext';

export default function Expenses() {
    const { showToast, setGlobalLoading } = useApp();
    const [expenses, setExpenses] = useState([]);
    const [loading, setLoading] = useState(true);
    const [modalOpen, setModalOpen] = useState(false);

    // Modal state
    const [category, setCategory] = useState('Utilities');
    const [amount, setAmount] = useState('');
    const [remarks, setRemarks] = useState('');
    const [otherReason, setOtherReason] = useState('');

    const fetchExpenses = async () => {
        setLoading(true);
        try {
            const response = await api.getExpenses();
            setExpenses(response.data.data || response.data || []);
        } catch (error) {
            console.error('Error fetching expenses:', error);
            showToast('Error loading expenses from backend.', 'error');
            setExpenses([]);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchExpenses();
    }, []);

    const handleFormSubmit = async (e) => {
        e.preventDefault();
        const finalRemarks = category === 'Other'
            ? [otherReason.trim(), remarks.trim()].filter(Boolean).join(' - ')
            : remarks.trim();

        const expenseData = {
            category,
            amount: parseFloat(amount),
            remarks: finalRemarks
        };

        setGlobalLoading(true);
        try {
            await api.createExpense(expenseData);
            showToast('Expense recorded successfully.', 'success');
            setModalOpen(false);
            fetchExpenses();
        } catch (error) {
            console.error('Error logging expense:', error);
            showToast(error.response?.data?.message || 'Error processing request.', 'error');
        } finally {
            setGlobalLoading(false);
        }
    };

    const getCategoryIcon = (cat) => {
        switch (cat.toLowerCase()) {
            case 'utilities': return 'fa-lightbulb text-amber-400 bg-amber-500/10 border-amber-500/20';
            case 'supplies': return 'fa-boxes-packing text-indigo-400 bg-indigo-500/10 border-indigo-500/20';
            case 'maintenance': return 'fa-screwdriver-wrench text-rose-400 bg-rose-500/10 border-rose-500/20';
            case 'food & beverage': return 'fa-utensils text-emerald-400 bg-emerald-500/10 border-emerald-500/20';
            default: return 'fa-wallet text-slate-400 bg-slate-800 border-slate-700/50';
        }
    };

    return (
        <div className="space-y-6 animate-fade-in font-sans">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-slate-100 tracking-tight font-heading">Expense & Utility Tracker</h1>
                    <p className="text-sm text-slate-400 font-sans">Audit hotel operational costs, utility payments, and supply purchases.</p>
                </div>
                <button 
                    onClick={() => {
                        setCategory('Utilities');
                        setAmount('');
                        setRemarks('');
                        setOtherReason('');
                        setModalOpen(true);
                    }}
                    className="px-4 py-2 bg-brand-600 hover:bg-brand-500 text-white rounded-xl shadow-md shadow-brand-500/10 hover:shadow-brand-500/20 font-semibold transition-all flex items-center gap-2 text-sm"
                >
                    <i className="fa-solid fa-plus text-xs"></i>
                    <span>Log Expense</span>
                </button>
            </div>

            {/* Expenses Grid */}
            <div className="glass-panel rounded-2xl border border-slate-800/80 shadow-lg overflow-hidden animate-fade-in">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-slate-900/50 text-slate-400 text-[10px] font-bold tracking-wider uppercase border-b border-slate-800/40">
                                <th className="py-3.5 px-6">Expense Ref</th>
                                <th className="py-3.5 px-6">Cost Category</th>
                                <th className="py-3.5 px-6">Amount Paid</th>
                                <th className="py-3.5 px-6">Date Registered</th>
                                <th className="py-3.5 px-6">Operational Remarks</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-800/40 text-sm text-slate-300">
                            {loading ? (
                                <tr>
                                    <td colSpan="5" className="py-8 text-center text-slate-500">Retrieving operational expenses...</td>
                                </tr>
                            ) : expenses.length === 0 ? (
                                <tr>
                                    <td colSpan="5" className="py-8 text-center text-slate-500">No operational expenses recorded yet.</td>
                                </tr>
                            ) : (
                                expenses.map(exp => {
                                    const id = exp.id || exp.expense_id || exp._id;
                                    const dateVal = new Date(exp.createdAt || exp.created_at);
                                    const formattedDate = dateVal.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) + ' ' + dateVal.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
                                    const iconStyle = getCategoryIcon(exp.category);

                                    return (
                                        <tr key={id} className="hover:bg-slate-900/30 transition-colors">
                                            <td className="py-4 px-6 font-bold text-slate-450">#EXP{id.toString().substring(0, 6)}</td>
                                            <td className="py-4 px-6">
                                                <div className="flex items-center gap-2.5">
                                                    <div className={`w-8 h-8 rounded-lg border flex items-center justify-center ${iconStyle.split(' ')[1]} ${iconStyle.split(' ')[2]} ${iconStyle.split(' ')[3]}`}>
                                                        <i className={`fa-solid ${iconStyle.split(' ')[0]} text-xs`}></i>
                                                    </div>
                                                    <span className="font-semibold text-slate-200">{exp.category}</span>
                                                </div>
                                            </td>
                                            <td className="py-4 px-6 font-extrabold text-rose-400">Rs {(exp.amount || 0).toFixed(2)}</td>
                                            <td className="py-4 px-6 text-xs text-slate-450">{formattedDate}</td>
                                            <td className="py-4 px-6 text-slate-400 italic text-xs truncate max-w-xs">{exp.remarks || 'No notes added'}</td>
                                        </tr>
                                    );
                                })
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Log Expense Modal Backdrop */}
            {modalOpen && (
                <div className="fixed inset-0 z-50 bg-slate-950/75 flex items-center justify-center p-4">
                    <div className="glass-panel w-full max-w-lg rounded-2xl border border-slate-800/80 shadow-2xl relative overflow-hidden animate-fade-in">
                        <div className="absolute top-0 left-0 w-full h-[3px] bg-gradient-to-r from-brand-500 to-indigo-500"></div>
                        
                        <div className="p-6 border-b border-slate-800/50 flex justify-between items-center">
                            <h3 className="text-base font-bold text-slate-100 font-heading">Log Operational Expense</h3>
                            <button onClick={() => setModalOpen(false)} className="text-slate-400 hover:text-slate-200 transition-colors">
                                <i className="fa-solid fa-xmark text-lg"></i>
                            </button>
                        </div>

                        <form onSubmit={handleFormSubmit} className="p-6 space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label htmlFor="exp-category" className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1.5">Cost Category</label>
                                    <select 
                                        id="exp-category" 
                                        required
                                        value={category}
                                        onChange={(e) => {
                                            setCategory(e.target.value);
                                            if (e.target.value !== 'Other') {
                                                setOtherReason('');
                                            }
                                        }}
                                        className="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-800 rounded-xl text-slate-200 focus:border-brand-500 transition-all text-sm focus:outline-none"
                                    >
                                        <option value="Utilities">Utilities</option>
                                        <option value="Supplies">Supplies</option>
                                        <option value="Maintenance">Maintenance</option>
                                        <option value="Food & Beverage">Food & Beverage</option>
                                        <option value="Marketing">Marketing</option>
                                        <option value="Other">Other</option>
                                    </select>
                                </div>
                                <div>
                                    <label htmlFor="exp-amount" className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1.5">Amount (Rs)</label>
                                    <input 
                                        type="number" 
                                        id="exp-amount" 
                                        required 
                                        min="0" 
                                        step="0.01" 
                                        placeholder="0.00"
                                        value={amount}
                                        onChange={(e) => setAmount(e.target.value)}
                                        className="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-800 rounded-xl text-slate-200 focus:border-brand-500 transition-all text-sm"
                                    />
                                </div>
                            </div>

                            {category === 'Other' && (
                                <div>
                                    <label htmlFor="exp-other-reason" className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1.5">Reason for Other</label>
                                    <input 
                                        type="text" 
                                        id="exp-other-reason" 
                                        required 
                                        placeholder="Describe the expense reason"
                                        value={otherReason}
                                        onChange={(e) => setOtherReason(e.target.value)}
                                        className="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-800 rounded-xl text-slate-200 focus:border-brand-500 transition-all text-sm"
                                    />
                                </div>
                            )}

                            <div>
                                <label htmlFor="exp-remarks" className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1.5">Remarks / Details</label>
                                <textarea 
                                    id="exp-remarks" 
                                    required
                                    rows="3" 
                                    placeholder="e.g. Toiletries restocking invoice or electricity bills reference"
                                    value={remarks}
                                    onChange={(e) => setRemarks(e.target.value)}
                                    className="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-800 rounded-xl text-slate-200 focus:border-brand-500 transition-all text-sm resize-none"
                                ></textarea>
                            </div>

                            <div className="pt-4 border-t border-slate-800/50 flex justify-end gap-3">
                                <button 
                                    type="button" 
                                    onClick={() => setModalOpen(false)}
                                    className="px-4 py-2 border border-slate-800 hover:bg-slate-900 text-slate-300 font-semibold rounded-xl text-sm transition-all"
                                >
                                    Cancel
                                </button>
                                <button 
                                    type="submit" 
                                    className="px-4 py-2 bg-brand-600 hover:bg-brand-500 text-white font-semibold rounded-xl text-sm transition-all shadow-md shadow-brand-500/10 hover:shadow-brand-500/20"
                                >
                                    Save Entry
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
