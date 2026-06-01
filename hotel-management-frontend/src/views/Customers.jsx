import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { useApp } from '../context/AppContext';

export default function Customers() {
    const { showToast, setGlobalLoading } = useApp();
    const [customers, setCustomers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [modalOpen, setModalOpen] = useState(false);
    
    // Modal Form State
    const [customerId, setCustomerId] = useState('');
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [phone, setPhone] = useState('');
    const [address, setAddress] = useState('');

    const fetchCustomers = async () => {
        setLoading(true);
        try {
            const response = await api.getCustomers();
            const data = response.data.data || response.data || [];
            setCustomers(data);
        } catch (error) {
            console.error('Error fetching customers:', error);
            showToast('Error loading customer list from backend.', 'error');
            setCustomers([]);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchCustomers();
    }, []);

    const openModal = (cust = null) => {
        if (cust) {
            setCustomerId(cust.id || cust._id);
            setName(cust.name || cust.full_name || '');
            setEmail(cust.email || '');
            setPhone(cust.phone || '');
            setAddress(cust.address || '');
        } else {
            setCustomerId('');
            setName('');
            setEmail('');
            setPhone('');
            setAddress('');
        }
        setModalOpen(true);
    };

    const closeModal = () => {
        setModalOpen(false);
    };

    const handleFormSubmit = async (e) => {
        e.preventDefault();
        const customerData = {
            name: name.trim(),
            email: email.trim(),
            phone: phone.trim(),
            address: address.trim()
        };

        setGlobalLoading(true);
        try {
            if (customerId) {
                await api.updateCustomer(customerId, customerData);
                showToast(`Customer "${name}" updated successfully.`, 'success');
            } else {
                await api.createCustomer(customerData);
                showToast(`Customer "${name}" registered successfully.`, 'success');
            }
            closeModal();
            fetchCustomers();
        } catch (error) {
            console.error('Error saving customer:', error);
            showToast(error.response?.data?.message || 'Error processing request.', 'error');
        } finally {
            setGlobalLoading(false);
        }
    };

    const handleDelete = async (id, cName) => {
        if (window.confirm(`Are you sure you want to delete customer ${cName}? This cannot be undone.`)) {
            setGlobalLoading(true);
            try {
                await api.deleteCustomer(id);
                showToast(`Customer ${cName} deleted successfully.`, 'success');
                fetchCustomers();
            } catch (error) {
                console.error('Error deleting customer:', error);
                showToast(error.response?.data?.message || 'Failed to delete customer.', 'error');
            } finally {
                setGlobalLoading(false);
            }
        }
    };

    return (
        <div className="space-y-6 animate-fade-in font-sans">
            {/* Header section */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-slate-100 tracking-tight font-heading">Guest Records</h1>
                    <p className="text-sm text-slate-400 font-sans">Register customers, update contact records, and view profiles.</p>
                </div>
                <button 
                    onClick={() => openModal()}
                    className="px-4 py-2 bg-brand-600 hover:bg-brand-500 text-white rounded-xl shadow-md shadow-brand-500/10 hover:shadow-brand-500/20 font-semibold transition-all flex items-center gap-2 text-sm"
                >
                    <i className="fa-solid fa-plus text-xs"></i>
                    <span>Register Guest</span>
                </button>
            </div>

            {/* Customers list card */}
            <div className="glass-panel rounded-2xl border border-slate-800/80 shadow-lg overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-slate-900/50 text-slate-400 text-[10px] font-bold tracking-wider uppercase border-b border-slate-800/40">
                                <th className="py-3.5 px-6">Guest Name</th>
                                <th className="py-3.5 px-6">Email Address</th>
                                <th className="py-3.5 px-6">Phone Contact</th>
                                <th className="py-3.5 px-6">Residential Address</th>
                                <th className="py-3.5 px-6 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-800/40 text-sm text-slate-300">
                            {loading ? (
                                <tr>
                                    <td colSpan="5" className="py-8 text-center text-slate-500">Retrieving customer listings...</td>
                                </tr>
                            ) : customers.length === 0 ? (
                                <tr>
                                    <td colSpan="5" className="py-8 text-center text-slate-500">No customers registered yet.</td>
                                </tr>
                            ) : (
                                customers.map(cust => {
                                    const id = cust.id || cust._id;
                                    return (
                                        <tr key={id} className="hover:bg-slate-900/30 transition-colors">
                                            <td className="py-4 px-6 font-bold text-slate-200">{cust.name || cust.full_name}</td>
                                            <td className="py-4 px-6 font-medium text-slate-400">{cust.email || 'N/A'}</td>
                                            <td className="py-4 px-6 text-indigo-400 font-bold">{cust.phone || 'N/A'}</td>
                                            <td className="py-4 px-6 text-slate-450">{cust.address || 'N/A'}</td>
                                            <td className="py-4 px-6 text-right">
                                                <div className="flex items-center justify-end gap-2">
                                                    <button 
                                                        onClick={() => openModal(cust)}
                                                        className="p-2 text-slate-400 hover:text-brand-400 hover:bg-slate-800/80 rounded-lg transition-all"
                                                    >
                                                        <i className="fa-solid fa-pen-to-square text-sm"></i>
                                                    </button>
                                                    <button 
                                                        onClick={() => handleDelete(id, cust.name || cust.full_name)}
                                                        className="p-2 text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition-all"
                                                    >
                                                        <i className="fa-solid fa-trash-can text-sm"></i>
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Add/Edit Customer Modal Backdrop */}
            {modalOpen && (
                <div className="fixed inset-0 z-50 bg-slate-950/75 flex items-center justify-center p-4">
                    <div className="glass-panel w-full max-w-lg rounded-2xl border border-slate-800/80 shadow-2xl relative overflow-hidden animate-fade-in">
                        <div className="absolute top-0 left-0 w-full h-[3px] bg-gradient-to-r from-brand-500 to-indigo-500"></div>
                        
                        <div className="p-6 border-b border-slate-800/50 flex justify-between items-center">
                            <h3 className="text-base font-bold text-slate-100 font-heading">
                                {customerId ? `Edit Profile - ${name}` : 'Register Guest'}
                            </h3>
                            <button onClick={closeModal} className="text-slate-400 hover:text-slate-200 transition-colors">
                                <i className="fa-solid fa-xmark text-lg"></i>
                            </button>
                        </div>

                        <form onSubmit={handleFormSubmit} className="p-6 space-y-4">
                            <div>
                                <label htmlFor="cust-name" className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1.5">Guest Name</label>
                                <input 
                                    type="text" 
                                    id="cust-name" 
                                    required 
                                    placeholder="Enter guest full name"
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    className="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-800 rounded-xl text-slate-200 focus:border-brand-500 transition-all text-sm animate-fade-in"
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label htmlFor="cust-email" className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1.5">Email Address</label>
                                    <input 
                                        type="email" 
                                        id="cust-email" 
                                        required 
                                        placeholder="e.g. alice@watson.com"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        className="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-800 rounded-xl text-slate-200 focus:border-brand-500 transition-all text-sm"
                                    />
                                </div>
                                <div>
                                    <label htmlFor="cust-phone" className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1.5">Phone Contact</label>
                                    <input 
                                        type="text" 
                                        id="cust-phone" 
                                        required 
                                        placeholder="e.g. +123456789"
                                        value={phone}
                                        onChange={(e) => setPhone(e.target.value)}
                                        className="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-800 rounded-xl text-slate-200 focus:border-brand-500 transition-all text-sm"
                                    />
                                </div>
                            </div>

                            <div>
                                <label htmlFor="cust-address" className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1.5">Residential Address</label>
                                <textarea 
                                    id="cust-address" 
                                    rows="3" 
                                    placeholder="Enter guest street address"
                                    value={address}
                                    onChange={(e) => setAddress(e.target.value)}
                                    className="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-800 rounded-xl text-slate-200 focus:border-brand-500 transition-all text-sm resize-none"
                                ></textarea>
                            </div>

                            <div className="pt-4 border-t border-slate-800/50 flex justify-end gap-3">
                                <button 
                                    type="button" 
                                    onClick={closeModal}
                                    className="px-4 py-2 border border-slate-800 hover:bg-slate-900 text-slate-300 font-semibold rounded-xl text-sm transition-all"
                                >
                                    Cancel
                                </button>
                                <button 
                                    type="submit" 
                                    className="px-4 py-2 bg-brand-600 hover:bg-brand-500 text-white font-semibold rounded-xl text-sm transition-all shadow-md shadow-brand-500/10 hover:shadow-brand-500/20"
                                >
                                    Save Record
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
