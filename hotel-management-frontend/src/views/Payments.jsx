import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { useApp } from '../context/AppContext';

export default function Payments() {
    const { showToast, setGlobalLoading } = useApp();
    const [payments, setPayments] = useState([]);
    const [bookings, setBookings] = useState([]);
    const [loading, setLoading] = useState(true);
    const [modalOpen, setModalOpen] = useState(false);

    // Modal state
    const [bookingId, setBookingId] = useState('');
    const [amount, setAmount] = useState('');
    const [paymentMethod, setPaymentMethod] = useState('Cash');
    const [remarks, setRemarks] = useState('');

    const fetchPaymentsData = async () => {
        setLoading(true);
        try {
            const [paymentsRes, bookingsRes] = await Promise.all([
                api.getPayments(),
                api.getBookings()
            ]);
            setPayments(paymentsRes.data.data || paymentsRes.data || []);
            setBookings(bookingsRes.data.data || bookingsRes.data || []);
        } catch (error) {
            console.error('Error fetching payments details:', error);
            showToast('Error loading payment transactions from backend.', 'error');
            setPayments([]);
            setBookings([]);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchPaymentsData();
    }, []);

    const handleFormSubmit = async (e) => {
        e.preventDefault();
        const paymentData = {
            bookingId,
            amount: parseFloat(amount),
            paymentMethod,
            remarks: remarks.trim()
        };

        setGlobalLoading(true);
        try {
            await api.createPayment(paymentData);
            showToast('Transaction logged successfully!', 'success');
            setModalOpen(false);
            fetchPaymentsData();
        } catch (error) {
            console.error('Error saving payment:', error);
            showToast(error.response?.data?.message || 'Error processing request.', 'error');
        } finally {
            setGlobalLoading(false);
        }
    };

    const handleBookingChange = (id) => {
        setBookingId(id);
        const booking = bookings.find(b => (b.id || b._id) == id);
        if (booking) {
            setAmount(booking.totalAmount || booking.total_amount || '');
        }
    };

    return (
        <div className="space-y-6 animate-fade-in font-sans">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-slate-100 tracking-tight font-heading">Payment Transactions</h1>
                    <p className="text-sm text-slate-400">Collect rooms income, audit bills, and track revenue inflows.</p>
                </div>
                <button 
                    onClick={() => {
                        setBookingId('');
                        setAmount('');
                        setPaymentMethod('Cash');
                        setRemarks('');
                        setModalOpen(true);
                    }}
                    className="px-4 py-2 bg-brand-600 hover:bg-brand-500 text-white rounded-xl shadow-md shadow-brand-500/10 hover:shadow-brand-500/20 font-semibold transition-all flex items-center gap-2 text-sm"
                >
                    <i className="fa-solid fa-receipt text-xs"></i>
                    <span>Receive Payment</span>
                </button>
            </div>

            {/* Payments list card */}
            <div className="glass-panel rounded-2xl border border-slate-800/80 shadow-lg overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-slate-900/50 text-slate-400 text-[10px] font-bold tracking-wider uppercase border-b border-slate-800/40">
                                <th className="py-3.5 px-6">Transaction Ref</th>
                                <th className="py-3.5 px-6">Booking Ref</th>
                                <th className="py-3.5 px-6">Guest</th>
                                <th className="py-3.5 px-6">Amount Collected</th>
                                <th className="py-3.5 px-6">Method</th>
                                <th className="py-3.5 px-6">Date Registered</th>
                                <th className="py-3.5 px-6">Audit Note</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-800/40 text-sm text-slate-300">
                            {loading ? (
                                <tr>
                                    <td colSpan="7" className="py-8 text-center text-slate-500">Retrieving transactions log...</td>
                                </tr>
                            ) : payments.length === 0 ? (
                                <tr>
                                    <td colSpan="7" className="py-8 text-center text-slate-500">No payment records saved.</td>
                                </tr>
                            ) : (
                                payments.map(pay => {
                                    const id = pay.id || pay.payment_id || pay._id;
                                    const dateVal = new Date(pay.createdAt || pay.created_at);
                                    const formattedDate = dateVal.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) + ' ' + dateVal.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
                                    
                                    return (
                                        <tr key={id} className="hover:bg-slate-900/30 transition-colors">
                                            <td className="py-4 px-6 font-bold text-slate-400">#PAY{id.toString().substring(0, 6)}</td>
                                            <td className="py-4 px-6 font-semibold text-slate-200">#{pay.booking?.id || pay.booking_id || 'N/A'}</td>
                                            <td className="py-4 px-6 font-medium">{pay.customer?.name || pay.customer?.full_name || 'Walk-in Guest'}</td>
                                            <td className="py-4 px-6 font-extrabold text-emerald-400">Rs {(pay.amount || 0).toFixed(2)}</td>
                                            <td className="py-4 px-6">
                                                <span className="inline-block px-2 py-0.5 rounded bg-slate-900 border border-slate-800 text-xs font-bold uppercase text-indigo-400">
                                                    {pay.paymentMethod || pay.payment_method}
                                                </span>
                                            </td>
                                            <td className="py-4 px-6 text-xs text-slate-400">{formattedDate}</td>
                                            <td className="py-4 px-6 text-slate-450 italic text-xs truncate max-w-xs">{pay.remarks || 'No remarks recorded'}</td>
                                        </tr>
                                    );
                                })
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Receive Payment Modal Backdrop */}
            {modalOpen && (
                <div className="fixed inset-0 z-50 bg-slate-950/75 flex items-center justify-center p-4">
                    <div className="glass-panel w-full max-w-lg rounded-2xl border border-slate-800/80 shadow-2xl relative overflow-hidden animate-fade-in">
                        <div className="absolute top-0 left-0 w-full h-[3px] bg-gradient-to-r from-brand-500 to-indigo-500"></div>
                        
                        <div className="p-6 border-b border-slate-800/50 flex justify-between items-center">
                            <h3 className="text-base font-bold text-slate-100 font-heading">Receive Booking Payment</h3>
                            <button onClick={() => setModalOpen(false)} className="text-slate-400 hover:text-slate-200 transition-colors">
                                <i className="fa-solid fa-xmark text-lg"></i>
                            </button>
                        </div>

                        <form onSubmit={handleFormSubmit} className="p-6 space-y-4">
                            <div>
                                <label htmlFor="pay-booking" className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1.5">Select Reservation</label>
                                <select 
                                    id="pay-booking" 
                                    required
                                    value={bookingId}
                                    onChange={(e) => handleBookingChange(e.target.value)}
                                    className="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-800 rounded-xl text-slate-200 focus:border-brand-500 transition-all text-sm focus:outline-none"
                                >
                                    <option value="">-- Choose active booking ID --</option>
                                    {bookings.map(b => (
                                            <option key={b.id || b._id} value={b.id || b._id}>
                                            Ref: #{b.id?.toString().substring(0, 8)} - {b.customer?.name || b.customer?.full_name} (Rs {(b.totalAmount || b.total_amount || 0).toFixed(2)})
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label htmlFor="pay-amount" className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1.5">Amount (Rs)</label>
                                    <input 
                                        type="number" 
                                        id="pay-amount" 
                                        required 
                                        min="0" 
                                        step="0.01" 
                                        placeholder="0.00"
                                        value={amount}
                                        onChange={(e) => setAmount(e.target.value)}
                                        className="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-800 rounded-xl text-slate-200 focus:border-brand-500 transition-all text-sm"
                                    />
                                </div>
                                <div>
                                    <label htmlFor="pay-method" className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1.5">Payment Method</label>
                                    <select 
                                        id="pay-method" 
                                        required
                                        value={paymentMethod}
                                        onChange={(e) => setPaymentMethod(e.target.value)}
                                        className="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-800 rounded-xl text-slate-200 focus:border-brand-500 transition-all text-sm focus:outline-none"
                                    >
                                        <option value="Cash">Cash</option>
                                        <option value="Card">Card</option>
                                        <option value="Bank Transfer">Bank Transfer</option>
                                        <option value="Mobile Money">Mobile Money</option>
                                    </select>
                                </div>
                            </div>

                            <div>
                                <label htmlFor="pay-remarks" className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1.5">Remarks / Audit Note</label>
                                <textarea 
                                    id="pay-remarks" 
                                    rows="2" 
                                    placeholder="Enter deposit terms or transaction comments"
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
                                    Record Receipt
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
