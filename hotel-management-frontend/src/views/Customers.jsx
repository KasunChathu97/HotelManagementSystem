import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import api from '../services/api';
import { useApp } from '../context/AppContext';
import API_BASE_URL from '../config';

export default function Customers() {
    const { showToast, setGlobalLoading, user } = useApp();
    const [customers, setCustomers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [modalOpen, setModalOpen] = useState(false);
    
    // Modal Form State
    const [customerId, setCustomerId] = useState('');
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [phone, setPhone] = useState('');
    const [address, setAddress] = useState('');
    const [idType, setIdType] = useState('national_id');
    const [idNumber, setIdNumber] = useState('');
    const [idFrontImage, setIdFrontImage] = useState(null);
    const [idBackImage, setIdBackImage] = useState(null);
    const [idFrontPreview, setIdFrontPreview] = useState('');
    const [idBackPreview, setIdBackPreview] = useState('');

    // Guest Details Modal State
    const [detailModalOpen, setDetailModalOpen] = useState(false);
    const [selectedCustomer, setSelectedCustomer] = useState(null);

    // Lightbox Modal State
    const [lightboxOpen, setLightboxOpen] = useState(false);
    const [lightboxImage, setLightboxImage] = useState('');

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
            setIdType(cust.id_type || 'national_id');
            setIdNumber(cust.id_number || '');
            setIdFrontPreview(cust.id_front_image || '');
            setIdBackPreview(cust.id_back_image || '');
        } else {
            setCustomerId('');
            setName('');
            setEmail('');
            setPhone('');
            setAddress('');
            setIdType('national_id');
            setIdNumber('');
            setIdFrontPreview('');
            setIdBackPreview('');
        }
        setIdFrontImage(null);
        setIdBackImage(null);
        setModalOpen(true);
    };

    const closeModal = () => {
        setModalOpen(false);
        // Clean up temporary object URLs to prevent memory leaks
        if (idFrontPreview && idFrontPreview.startsWith('blob:')) {
            URL.revokeObjectURL(idFrontPreview);
        }
        if (idBackPreview && idBackPreview.startsWith('blob:')) {
            URL.revokeObjectURL(idBackPreview);
        }
        setIdFrontPreview('');
        setIdBackPreview('');
        setIdFrontImage(null);
        setIdBackImage(null);
    };

    const openDetailModal = (cust) => {
        if (user?.role?.toLowerCase() !== 'admin') {
            showToast('Access denied: Guest profile details is admin only', 'error');
            return;
        }
        setSelectedCustomer(cust);
        setDetailModalOpen(true);
    };

    const closeDetailModal = () => {
        setSelectedCustomer(null);
        setDetailModalOpen(false);
    };

    const openLightbox = (imageUrl) => {
        if (!imageUrl) return;
        setLightboxImage(imageUrl);
        setLightboxOpen(true);
    };

    const closeLightbox = () => {
        setLightboxImage('');
        setLightboxOpen(false);
    };

    const getImageUrl = (path) => {
        if (!path) return '';
        if (path.startsWith('blob:') || path.startsWith('data:') || path.startsWith('http://') || path.startsWith('https://')) {
            return path;
        }
        const base = API_BASE_URL.replace(/\/api$/, '').replace(/\/$/, '');
        return `${base}${path}`;
    };

    const handleFileChange = (e, field) => {
        const file = e.target.files[0];
        if (!file) return;

        if (!file.type.startsWith('image/')) {
            showToast('Only image files (JPG, PNG, WEBP) are allowed.', 'error');
            return;
        }

        if (file.size > 5 * 1024 * 1024) {
            showToast('Image size must be smaller than 5MB.', 'error');
            return;
        }

        const previewUrl = URL.createObjectURL(file);
        if (field === 'front') {
            setIdFrontImage(file);
            setIdFrontPreview(previewUrl);
        } else if (field === 'back') {
            setIdBackImage(file);
            setIdBackPreview(previewUrl);
        }
    };

    const handleFormSubmit = async (e) => {
        e.preventDefault();
        
        // Validation: id_number is required for new registration
        if (!customerId && !idNumber.trim()) {
            showToast('ID Number is required for new guest registrations.', 'error');
            return;
        }

        const formData = new FormData();
        formData.append('name', name.trim());
        formData.append('email', email.trim());
        formData.append('phone', phone.trim());
        formData.append('address', address.trim());
        formData.append('id_type', idType);
        formData.append('id_number', idNumber.trim());

        if (idFrontImage) {
            formData.append('id_front_image', idFrontImage);
        }
        if (idBackImage) {
            formData.append('id_back_image', idBackImage);
        }

        setGlobalLoading(true);
        try {
            if (customerId) {
                await api.updateCustomer(customerId, formData);
                showToast(`Customer "${name}" updated successfully.`, 'success');
            } else {
                await api.createCustomer(formData);
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

    const formatIdType = (type) => {
        switch (type) {
            case 'passport': return 'Passport';
            case 'national_id': return 'National ID';
            case 'driving_license': return 'Driving License';
            default: return type;
        }
    };

    const formatDate = (dateString) => {
        if (!dateString) return 'N/A';
        return new Date(dateString).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
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
                                <th className="py-3.5 px-6">ID Number</th>
                                <th className="py-3.5 px-6">Email Address</th>
                                <th className="py-3.5 px-6">Phone Contact</th>
                                <th className="py-3.5 px-6">Residential Address</th>
                                <th className="py-3.5 px-6 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-800/40 text-sm text-slate-300">
                            {loading ? (
                                <tr>
                                    <td colSpan="6" className="py-8 text-center text-slate-500">Retrieving customer listings...</td>
                                </tr>
                            ) : customers.length === 0 ? (
                                <tr>
                                    <td colSpan="6" className="py-8 text-center text-slate-500">No customers registered yet.</td>
                                </tr>
                            ) : (
                                customers.map(cust => {
                                    const id = cust.id || cust._id;
                                    return (
                                        <tr key={id} className="hover:bg-slate-900/30 transition-colors">
                                            <td className="py-4 px-6 font-bold text-slate-200">
                                                {user?.role?.toLowerCase() === 'admin' ? (
                                                    <button 
                                                        onClick={() => openDetailModal(cust)}
                                                        className="hover:text-brand-400 transition-colors text-left font-bold"
                                                    >
                                                        {cust.name || cust.full_name}
                                                    </button>
                                                ) : (
                                                    <span>{cust.name || cust.full_name}</span>
                                                )}
                                            </td>
                                            <td className="py-4 px-6 font-medium text-slate-400">
                                                <span className="bg-slate-800/50 px-2.5 py-1 rounded-md border border-slate-700/30 text-xs">
                                                    {cust.id_number || 'N/A'}
                                                </span>
                                            </td>
                                            <td className="py-4 px-6 font-medium text-slate-400">{cust.email || 'N/A'}</td>
                                            <td className="py-4 px-6 text-indigo-400 font-bold">{cust.phone || 'N/A'}</td>
                                            <td className="py-4 px-6 text-slate-450">{cust.address || 'N/A'}</td>
                                            <td className="py-4 px-6 text-right">
                                                <div className="flex items-center justify-end gap-2">
                                                    {user?.role?.toLowerCase() === 'admin' && (
                                                        <button 
                                                            onClick={() => openDetailModal(cust)}
                                                            title="View Profile"
                                                            className="p-2 text-slate-450 hover:text-emerald-400 hover:bg-slate-800/80 rounded-lg transition-all"
                                                        >
                                                            <i className="fa-solid fa-eye text-sm"></i>
                                                        </button>
                                                    )}
                                                    <button 
                                                        onClick={() => openModal(cust)}
                                                        title="Edit Profile"
                                                        className="p-2 text-slate-450 hover:text-brand-400 hover:bg-slate-800/80 rounded-lg transition-all"
                                                    >
                                                        <i className="fa-solid fa-pen-to-square text-sm"></i>
                                                    </button>
                                                    {user?.role?.toLowerCase() === 'admin' && (
                                                        <button 
                                                            onClick={() => handleDelete(id, cust.name || cust.full_name)}
                                                            title="Delete Guest"
                                                            className="p-2 text-slate-450 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition-all"
                                                        >
                                                            <i className="fa-solid fa-trash-can text-sm"></i>
                                                        </button>
                                                    )}
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
            {modalOpen && createPortal(
                <div className="fixed inset-0 z-50 bg-slate-950/75 overflow-y-auto flex justify-center items-start p-4 sm:p-10">
                    <div className="glass-panel w-full max-w-lg rounded-2xl border border-slate-800/80 shadow-2xl relative my-auto overflow-hidden animate-fade-in">
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
                                    className="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-800 rounded-xl text-slate-200 focus:border-brand-500 transition-all text-sm"
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

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label htmlFor="cust-id-type" className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1.5">ID Type</label>
                                    <select
                                        id="cust-id-type"
                                        value={idType}
                                        onChange={(e) => setIdType(e.target.value)}
                                        className="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-800 rounded-xl text-slate-200 focus:border-brand-500 transition-all text-sm"
                                    >
                                        <option value="national_id">National ID</option>
                                        <option value="passport">Passport</option>
                                        <option value="driving_license">Driving License</option>
                                    </select>
                                </div>
                                <div>
                                    <label htmlFor="cust-id-number" className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1.5">
                                        ID Number {!customerId && <span className="text-rose-500">*</span>}
                                    </label>
                                    <input 
                                        type="text" 
                                        id="cust-id-number" 
                                        required={!customerId}
                                        placeholder="National ID or Passport No"
                                        value={idNumber}
                                        onChange={(e) => setIdNumber(e.target.value)}
                                        className="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-800 rounded-xl text-slate-200 focus:border-brand-500 transition-all text-sm"
                                    />
                                </div>
                            </div>

                            <div>
                                <label htmlFor="cust-address" className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1.5">Residential Address</label>
                                <textarea 
                                    id="cust-address" 
                                    rows="2" 
                                    placeholder="Enter guest street address"
                                    value={address}
                                    onChange={(e) => setAddress(e.target.value)}
                                    className="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-800 rounded-xl text-slate-200 focus:border-brand-500 transition-all text-sm resize-none"
                                ></textarea>
                            </div>

                            {/* Image Upload Fields */}
                            <div className="grid grid-cols-2 gap-4 pt-2">
                                {/* Front ID image upload */}
                                <div className="space-y-2">
                                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-400">ID Front Image</label>
                                    <div className="relative group border border-dashed border-slate-800 hover:border-brand-500/50 rounded-xl overflow-hidden bg-slate-900/60 p-4 flex flex-col items-center justify-center min-h-[120px] transition-all">
                                        {idFrontPreview ? (
                                            <div className="relative w-full h-[100px] flex items-center justify-center">
                                                <img 
                                                    src={getImageUrl(idFrontPreview)} 
                                                    alt="ID Front Preview" 
                                                    className="max-w-full max-h-full object-contain rounded-lg shadow-sm"
                                                />
                                                <button
                                                    type="button"
                                                    onClick={() => {
                                                        setIdFrontImage(null);
                                                        setIdFrontPreview('');
                                                    }}
                                                    className="absolute -top-2 -right-2 bg-rose-600/90 hover:bg-rose-500 text-white rounded-full p-1.5 shadow-md transition-all text-xs"
                                                >
                                                    <i className="fa-solid fa-trash-can"></i>
                                                </button>
                                            </div>
                                        ) : (
                                            <label className="cursor-pointer flex flex-col items-center justify-center space-y-1.5 text-slate-400 hover:text-slate-300">
                                                <i className="fa-solid fa-cloud-arrow-up text-xl text-slate-500"></i>
                                                <span className="text-[11px] font-semibold">Upload Front</span>
                                                <input 
                                                    type="file" 
                                                    accept="image/*"
                                                    onChange={(e) => handleFileChange(e, 'front')}
                                                    className="hidden" 
                                                />
                                            </label>
                                        )}
                                    </div>
                                </div>

                                {/* Back ID image upload */}
                                <div className="space-y-2">
                                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-400">ID Back Image</label>
                                    <div className="relative group border border-dashed border-slate-800 hover:border-brand-500/50 rounded-xl overflow-hidden bg-slate-900/60 p-4 flex flex-col items-center justify-center min-h-[120px] transition-all">
                                        {idBackPreview ? (
                                            <div className="relative w-full h-[100px] flex items-center justify-center">
                                                <img 
                                                    src={getImageUrl(idBackPreview)} 
                                                    alt="ID Back Preview" 
                                                    className="max-w-full max-h-full object-contain rounded-lg shadow-sm"
                                                />
                                                <button
                                                    type="button"
                                                    onClick={() => {
                                                        setIdBackImage(null);
                                                        setIdBackPreview('');
                                                    }}
                                                    className="absolute -top-2 -right-2 bg-rose-600/90 hover:bg-rose-500 text-white rounded-full p-1.5 shadow-md transition-all text-xs"
                                                >
                                                    <i className="fa-solid fa-trash-can"></i>
                                                </button>
                                            </div>
                                        ) : (
                                            <label className="cursor-pointer flex flex-col items-center justify-center space-y-1.5 text-slate-400 hover:text-slate-300">
                                                <i className="fa-solid fa-cloud-arrow-up text-xl text-slate-500"></i>
                                                <span className="text-[11px] font-semibold">Upload Back</span>
                                                <input 
                                                    type="file" 
                                                    accept="image/*"
                                                    onChange={(e) => handleFileChange(e, 'back')}
                                                    className="hidden" 
                                                />
                                            </label>
                                        )}
                                    </div>
                                </div>
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
                </div>,
                document.body
            )}

            {/* Guest Details View Modal */}
            {detailModalOpen && selectedCustomer && createPortal(
                <div className="fixed inset-0 z-50 bg-slate-950/80 overflow-y-auto flex justify-center items-start p-4 sm:p-10">
                    <div className="glass-panel w-full max-w-2xl rounded-2xl border border-slate-800/80 shadow-2xl relative my-auto overflow-hidden animate-fade-in">
                        <div className="absolute top-0 left-0 w-full h-[3px] bg-gradient-to-r from-emerald-500 to-teal-500"></div>
                        
                        <div className="p-6 border-b border-slate-800/50 flex justify-between items-center">
                            <h3 className="text-base font-bold text-slate-100 font-heading">
                                Guest Details Profile
                            </h3>
                            <button onClick={closeDetailModal} className="text-slate-400 hover:text-slate-200 transition-colors">
                                <i className="fa-solid fa-xmark text-lg"></i>
                            </button>
                        </div>

                        <div className="p-6 space-y-6">
                            {/* Profile Bio Row */}
                            <div className="flex flex-col md:flex-row gap-5 items-start">
                                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-indigo-500/20 to-brand-500/20 border border-slate-800 flex items-center justify-center text-slate-300 shrink-0">
                                    <i className="fa-solid fa-user-tie text-2xl text-brand-400"></i>
                                </div>
                                <div className="space-y-1 w-full">
                                    <h4 className="text-lg font-bold text-slate-100">{selectedCustomer.name || selectedCustomer.full_name}</h4>
                                    <div className="flex flex-wrap gap-2 text-xs">
                                        <span className="px-2 py-0.5 rounded bg-brand-500/10 text-brand-400 border border-brand-500/20 font-semibold uppercase">
                                            {formatIdType(selectedCustomer.id_type)}: {selectedCustomer.id_number || 'N/A'}
                                        </span>
                                        <span className="px-2 py-0.5 rounded bg-slate-800 text-slate-400 border border-slate-700/50">
                                            Registered: {formatDate(selectedCustomer.created_at || selectedCustomer.createdAt)}
                                        </span>
                                    </div>
                                </div>
                            </div>

                            {/* Detail Fields Grid */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-slate-900/30 border border-slate-850 p-5 rounded-2xl">
                                <div>
                                    <span className="block text-[10px] uppercase font-bold tracking-wider text-slate-500">Email Address</span>
                                    <span className="text-sm text-slate-200 break-all">{selectedCustomer.email || 'N/A'}</span>
                                </div>
                                <div>
                                    <span className="block text-[10px] uppercase font-bold tracking-wider text-slate-500">Phone Contact</span>
                                    <span className="text-sm text-indigo-400 font-semibold">{selectedCustomer.phone || 'N/A'}</span>
                                </div>
                                <div className="md:col-span-2">
                                    <span className="block text-[10px] uppercase font-bold tracking-wider text-slate-500">Residential Address</span>
                                    <span className="text-sm text-slate-300 block max-h-[80px] overflow-y-auto whitespace-pre-wrap">{selectedCustomer.address || 'N/A'}</span>
                                </div>
                            </div>

                            {/* ID Document Images Preview */}
                            <div className="space-y-3">
                                <h5 className="text-xs font-bold uppercase tracking-wider text-slate-450 border-b border-slate-850 pb-2">Uploaded Identity Documents</h5>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    {/* Front Image Preview */}
                                    <div className="space-y-1.5">
                                        <span className="text-[11px] font-bold text-slate-400">ID Card Front View</span>
                                        <div className="glass-panel border border-slate-800/80 bg-slate-900/40 rounded-xl p-3 flex items-center justify-center h-[160px] relative group overflow-hidden transition-all">
                                            {selectedCustomer.id_front_image ? (
                                                <>
                                                    <img 
                                                        src={getImageUrl(selectedCustomer.id_front_image)} 
                                                        alt="ID Front" 
                                                        className="max-w-full max-h-full object-contain rounded-lg transition-transform duration-300 group-hover:scale-102"
                                                    />
                                                    <div className="absolute inset-0 bg-slate-950/60 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-all duration-200">
                                                        <button 
                                                            onClick={() => openLightbox(getImageUrl(selectedCustomer.id_front_image))}
                                                            className="px-3.5 py-1.5 bg-brand-600 hover:bg-brand-500 text-white rounded-lg text-xs font-bold shadow-md flex items-center gap-1.5 transition-all transform translate-y-2 group-hover:translate-y-0"
                                                        >
                                                            <i className="fa-solid fa-magnifying-glass-plus text-[10px]"></i>
                                                            <span>Expand View</span>
                                                        </button>
                                                    </div>
                                                </>
                                            ) : (
                                                <div className="flex flex-col items-center justify-center text-slate-500 space-y-1.5">
                                                    <i className="fa-solid fa-image text-2xl text-slate-600"></i>
                                                    <span className="text-xs">No Front Image Uploaded</span>
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    {/* Back Image Preview */}
                                    <div className="space-y-1.5">
                                        <span className="text-[11px] font-bold text-slate-400">ID Card Back View</span>
                                        <div className="glass-panel border border-slate-800/80 bg-slate-900/40 rounded-xl p-3 flex items-center justify-center h-[160px] relative group overflow-hidden transition-all">
                                            {selectedCustomer.id_back_image ? (
                                                <>
                                                    <img 
                                                        src={getImageUrl(selectedCustomer.id_back_image)} 
                                                        alt="ID Back" 
                                                        className="max-w-full max-h-full object-contain rounded-lg transition-transform duration-300 group-hover:scale-102"
                                                    />
                                                    <div className="absolute inset-0 bg-slate-950/60 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-all duration-200">
                                                        <button 
                                                            onClick={() => openLightbox(getImageUrl(selectedCustomer.id_back_image))}
                                                            className="px-3.5 py-1.5 bg-brand-600 hover:bg-brand-500 text-white rounded-lg text-xs font-bold shadow-md flex items-center gap-1.5 transition-all transform translate-y-2 group-hover:translate-y-0"
                                                        >
                                                            <i className="fa-solid fa-magnifying-glass-plus text-[10px]"></i>
                                                            <span>Expand View</span>
                                                        </button>
                                                    </div>
                                                </>
                                            ) : (
                                                <div className="flex flex-col items-center justify-center text-slate-500 space-y-1.5">
                                                    <i className="fa-solid fa-image text-2xl text-slate-600"></i>
                                                    <span className="text-xs">No Back Image Uploaded</span>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="p-6 border-t border-slate-800/50 bg-slate-900/20 flex justify-end gap-3">
                            <button 
                                type="button" 
                                onClick={() => {
                                    closeDetailModal();
                                    openModal(selectedCustomer);
                                }}
                                className="px-4 py-2 bg-slate-800 hover:bg-slate-705 text-slate-200 border border-slate-700/60 hover:border-slate-600 font-semibold rounded-xl text-sm transition-all"
                            >
                                Edit Profile
                            </button>
                            <button 
                                type="button" 
                                onClick={closeDetailModal}
                                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold rounded-xl text-sm transition-all shadow-md shadow-emerald-500/10 hover:shadow-emerald-500/20"
                            >
                                Close Profile
                            </button>
                        </div>
                    </div>
                </div>,
                document.body
            )}

            {/* Image Lightbox Modal */}
            {lightboxOpen && createPortal(
                <div 
                    className="fixed inset-0 z-99 flex items-center justify-center bg-slate-950/95 p-4 transition-all duration-300 animate-fade-in"
                    onClick={closeLightbox}
                >
                    <div className="absolute top-4 right-4 z-50 flex gap-2">
                        <button 
                            onClick={closeLightbox}
                            className="w-10 h-10 bg-slate-900/80 hover:bg-slate-800 border border-slate-800 hover:border-slate-700 text-slate-200 hover:text-white rounded-full flex items-center justify-center transition-all shadow-lg text-lg"
                        >
                            <i className="fa-solid fa-xmark"></i>
                        </button>
                    </div>

                    <div 
                        className="relative max-w-4xl max-h-[85vh] w-full flex items-center justify-center"
                        onClick={(e) => e.stopPropagation()} // Prevent closing when clicking the image itself
                    >
                        <img 
                            src={lightboxImage} 
                            alt="Expanded View" 
                            className="max-w-full max-h-[85vh] object-contain rounded-xl shadow-2xl border border-slate-850"
                        />
                    </div>
                </div>,
                document.body
            )}
        </div>
    );
}
