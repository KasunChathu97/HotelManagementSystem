import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { useApp } from '../context/AppContext';

export default function Bookings() {
    const { showToast, setGlobalLoading } = useApp();
    const [bookings, setBookings] = useState([]);
    const [customers, setCustomers] = useState([]);
    const [rooms, setRooms] = useState([]);
    const [loading, setLoading] = useState(true);
    const [modalOpen, setModalOpen] = useState(false);
    const [activeFilter, setActiveFilter] = useState('all');

    // Stepper State
    const [bookingStep, setBookingStep] = useState(1);
    
    // Booking Form State
    const [customerId, setCustomerId] = useState('');
    const [checkInDate, setCheckInDate] = useState('');
    const [checkOutDate, setCheckOutDate] = useState('');
    const [checkInTime, setCheckInTime] = useState('12:00');
    const [roomId, setRoomId] = useState('');
    const [availableRooms, setAvailableRooms] = useState([]);
    const [roomsFetched, setRoomsFetched] = useState(false);

    const fetchBookingsData = async () => {
        setLoading(true);
        try {
            const [bookingsRes, customersRes, roomsRes] = await Promise.all([
                api.getBookings(),
                api.getCustomers(),
                api.getRooms()
            ]);
            
            setBookings(bookingsRes.data.data || bookingsRes.data || []);
            setCustomers(customersRes.data.data || customersRes.data || []);
            setRooms(roomsRes.data.data || roomsRes.data || []);
        } catch (error) {
            console.error('Error loading bookings dependencies:', error);
            showToast('Error syncing booking details from backend.', 'error');
            setBookings([]);
            setCustomers([]);
            setRooms([]);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchBookingsData();
    }, []);

    const performCheckIn = async (id) => {
        setGlobalLoading(true);
        try {
            await api.checkinBooking(id);
            showToast('Guest checked in successfully.', 'success');
            fetchBookingsData();
        } catch (error) {
            console.error('Check-in error:', error);
            showToast(error.response?.data?.message || 'Check-in failed.', 'error');
        } finally {
            setGlobalLoading(false);
        }
    };

    const performCheckOut = async (id) => {
        setGlobalLoading(true);
        try {
            await api.checkoutBooking(id);
            showToast('Guest checked out successfully.', 'success');
            fetchBookingsData();
        } catch (error) {
            console.error('Check-out error:', error);
            showToast(error.response?.data?.message || 'Check-out failed.', 'error');
        } finally {
            setGlobalLoading(false);
        }
    };

    const openBookingModal = () => {
        setBookingStep(1);
        setCustomerId('');
        setCheckInDate('');
        setCheckOutDate('');
        setCheckInTime('12:00');
        setRoomId('');
        setAvailableRooms([]);
        setRoomsFetched(false);
        setModalOpen(true);
    };

    const closeBookingModal = () => {
        setModalOpen(false);
    };

    const handleNextStep = () => {
        if (bookingStep === 1) {
            if (!customerId) {
                showToast('Please select a customer to proceed.', 'warning');
                return;
            }
            setBookingStep(2);
        } else if (bookingStep === 2) {
            if (!roomId) {
                showToast('Please find and assign an available room.', 'warning');
                return;
            }
            setBookingStep(3);
        }
    };

    const handleBackStep = () => {
        if (bookingStep > 1) {
            setBookingStep(prev => prev - 1);
        }
    };

    const checkRoomAvailability = async () => {
        if (!checkInDate || !checkOutDate) {
            showToast('Please choose check-in and check-out dates.', 'warning');
            return;
        }

        if (new Date(checkInDate) >= new Date(checkOutDate)) {
            showToast('Check-out date must be after check-in date.', 'error');
            return;
        }

        setGlobalLoading(true);
        try {
            const response = await api.getRooms();
            const allRooms = response.data.data || response.data || [];
            const avail = allRooms.filter(r => r.status === 'Available');
            setAvailableRooms(avail);
            setRoomsFetched(true);
            showToast(`Found ${avail.length} available rooms.`, 'success');
        } catch (error) {
            console.error('Error checking room availability:', error);
            showToast('Could not fetch available rooms.', 'error');
        } finally {
            setGlobalLoading(false);
        }
    };

    const getStayPricing = () => {
        if (!checkInDate || !checkOutDate || !roomId) return null;

        const room = rooms.find(r => (r.id || r.room_id || r._id) == roomId);
        if (!room) return null;

        const start = new Date(checkInDate);
        const end = new Date(checkOutDate);
        const diffTime = Math.abs(end - start);
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) || 1;

        const hour = parseInt(checkInTime.split(':')[0], 10);
        const isNightStay = hour >= 18 || hour < 6 || diffDays > 0;
        
        const rate = isNightStay ? (room.priceNight || room.price_night || room.price || 0) : (room.priceDay || room.price_day || room.price || 0);
        const total = rate * diffDays;

        return {
            diffDays,
            isNightStay,
            rate,
            total,
            roomNumber: room.roomNumber || room.room_number,
            roomType: room.roomType || room.room_type
        };
    };

    const submitBookingForm = async () => {
        const pricing = getStayPricing();
        if (!pricing) return;

        const bookingData = {
            customerId,
            roomId,
            checkIn: checkInDate,
            checkOut: checkOutDate,
            checkInTime,
            totalAmount: pricing.total
        };

        setGlobalLoading(true);
        try {
            await api.createBooking(bookingData);
            showToast('Booking successfully recorded!', 'success');
            closeBookingModal();
            fetchBookingsData();
        } catch (error) {
            console.error('Error creating booking:', error);
            showToast(error.response?.data?.message || 'Error processing request.', 'error');
        } finally {
            setGlobalLoading(false);
        }
    };

    const pricing = getStayPricing();
    const selectedCustomer = customers.find(c => (c.id || c._id) == customerId);

    const filteredBookings = activeFilter === 'all' 
        ? bookings 
        : bookings.filter(b => (b.status || '').toLowerCase() === activeFilter.toLowerCase());

    const statusColors = {
        'pending': 'bg-amber-500/10 text-amber-400 border-amber-500/20',
        'checked-in': 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
        'checked-out': 'bg-slate-800 text-slate-400 border-slate-700/50',
        'cancelled': 'bg-rose-500/10 text-rose-400 border-rose-500/20',
    };

    return (
        <div className="space-y-6 animate-fade-in font-sans">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-slate-100 tracking-tight font-heading">Bookings & Reservations</h1>
                    <p className="text-sm text-slate-400">Manage guest reservations, room assignments, and check-ins/check-outs.</p>
                </div>
                <button 
                    onClick={openBookingModal}
                    className="px-4 py-2 bg-brand-600 hover:bg-brand-500 text-white rounded-xl shadow-md shadow-brand-500/10 hover:shadow-brand-500/20 font-semibold transition-all flex items-center gap-2 text-sm"
                >
                    <i className="fa-solid fa-calendar-plus text-xs"></i>
                    <span>New Reservation</span>
                </button>
            </div>

            {/* Filter Panel */}
            <div className="glass-panel p-4 rounded-xl border border-slate-800/80 flex flex-wrap gap-4 items-center justify-between">
                <div className="flex flex-wrap gap-3 items-center">
                    <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Filter Status:</span>
                    <button 
                        onClick={() => setActiveFilter('all')}
                        className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold border transition-all ${activeFilter === 'all' ? 'bg-brand-600 text-white border-brand-500' : 'bg-slate-900 border-slate-800 text-slate-300 hover:text-slate-100'}`}
                    >
                        All Bookings
                    </button>
                    <button 
                        onClick={() => setActiveFilter('pending')}
                        className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold border transition-all ${activeFilter === 'pending' ? 'bg-brand-600 text-white border-brand-500' : 'bg-slate-900 border-slate-800 text-slate-300 hover:text-slate-100'}`}
                    >
                        Pending
                    </button>
                    <button 
                        onClick={() => setActiveFilter('checked-in')}
                        className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold border transition-all ${activeFilter === 'checked-in' ? 'bg-brand-600 text-white border-brand-500' : 'bg-slate-900 border-slate-800 text-slate-300 hover:text-slate-100'}`}
                    >
                        Checked In
                    </button>
                    <button 
                        onClick={() => setActiveFilter('checked-out')}
                        className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold border transition-all ${activeFilter === 'checked-out' ? 'bg-brand-600 text-white border-brand-500' : 'bg-slate-900 border-slate-800 text-slate-300 hover:text-slate-100'}`}
                    >
                        Checked Out
                    </button>
                </div>
            </div>

            {/* Bookings List Card */}
            <div className="glass-panel rounded-2xl border border-slate-800/80 shadow-lg overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-slate-900/50 text-slate-400 text-[10px] font-bold tracking-wider uppercase border-b border-slate-800/40">
                                <th class="py-3.5 px-6">Ref ID</th>
                                <th class="py-3.5 px-6">Customer</th>
                                <th class="py-3.5 px-6">Room Details</th>
                                <th class="py-3.5 px-6">Dates & Arrival</th>
                                <th class="py-3.5 px-6">Total Amount</th>
                                <th class="py-3.5 px-6">Status</th>
                                <th class="py-3.5 px-6 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-800/40 text-sm text-slate-300">
                            {loading ? (
                                <tr>
                                    <td colSpan="7" className="py-8 text-center text-slate-500">Retrieving booking records...</td>
                                </tr>
                            ) : filteredBookings.length === 0 ? (
                                <tr>
                                    <td colSpan="7" className="py-8 text-center text-slate-500">No bookings matching filter.</td>
                                </tr>
                            ) : (
                                filteredBookings.map(b => {
                                    const checkInVal = new Date(b.checkIn || b.check_in);
                                    const checkOutVal = new Date(b.checkOut || b.check_out);
                                    
                                    const checkInFmt = checkInVal.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
                                    const checkOutFmt = checkOutVal.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
                                    
                                    const status = b.status || 'pending';
                                    const colorClass = statusColors[status.toLowerCase()] || 'bg-slate-800 text-slate-400 border-slate-700/50';
                                    const id = b.id || b.booking_id || b._id;

                                    const showCheckIn = status.toLowerCase() === 'pending';
                                    const showCheckOut = status.toLowerCase() === 'checked-in';

                                    return (
                                        <tr key={id} className="hover:bg-slate-900/30 transition-colors">
                                            <td className="py-4 px-6 font-bold text-slate-400">#{id.toString().substring(0, 8)}</td>
                                            <td className="py-4 px-6">
                                                <div className="font-semibold text-slate-200">{b.customer?.name || b.customer?.full_name || 'Walk-in Guest'}</div>
                                                <div className="text-xs text-slate-400">{b.customer?.phone || b.customer?.email || ''}</div>
                                            </td>
                                            <td className="py-4 px-6">
                                                <div className="font-bold text-indigo-400">Room {b.room?.roomNumber || b.room?.room_number || 'Unassigned'}</div>
                                                <div className="text-xs text-slate-400 capitalize">{b.room?.roomType || b.room?.room_type || 'Standard'}</div>
                                            </td>
                                            <td className="py-4 px-6">
                                                <div className="text-xs text-slate-300 font-semibold">{checkInFmt} &mdash; {checkOutFmt}</div>
                                                <div className="text-[10px] text-slate-450 mt-0.5"><i className="fa-solid fa-clock mr-1 text-slate-500"></i> Arrival: {b.checkInTime || b.check_in_time || '12:00'}</div>
                                            </td>
                                            <td className="py-4 px-6 font-bold text-slate-200">${(b.totalAmount || b.total_amount || 0).toFixed(2)}</td>
                                            <td className="py-4 px-6">
                                                <span className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-bold border capitalize ${colorClass}`}>
                                                    {status}
                                                </span>
                                            </td>
                                            <td className="py-4 px-6 text-right">
                                                <div className="flex items-center justify-end gap-2">
                                                    {showCheckIn && (
                                                        <button 
                                                            onClick={() => performCheckIn(id)}
                                                            className="px-3 py-1.5 bg-emerald-600/10 hover:bg-emerald-600 text-emerald-400 hover:text-white rounded-lg border border-emerald-500/25 transition-all text-xs font-semibold"
                                                        >
                                                            Check In
                                                        </button>
                                                    )}
                                                    {showCheckOut && (
                                                        <button 
                                                            onClick={() => performCheckOut(id)}
                                                            className="px-3 py-1.5 bg-brand-600/10 hover:bg-brand-600 text-brand-400 hover:text-white rounded-lg border border-brand-500/25 transition-all text-xs font-semibold"
                                                        >
                                                            Check Out
                                                        </button>
                                                    )}
                                                    {!showCheckIn && !showCheckOut && (
                                                        <span className="text-xs text-slate-500 font-medium">Completed</span>
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

            {/* Multi-Step Booking Modal Backdrop */}
            {modalOpen && (
                <div className="fixed inset-0 z-50 bg-slate-950/75 flex items-center justify-center p-4">
                    <div className="glass-panel w-full max-w-xl rounded-2xl border border-slate-800/80 shadow-2xl relative overflow-hidden animate-fade-in">
                        <div className="absolute top-0 left-0 w-full h-[3px] bg-gradient-to-r from-brand-500 to-indigo-500"></div>

                        {/* Modal Header */}
                        <div className="p-6 border-b border-slate-800/50 flex justify-between items-center">
                            <div>
                                <h3 className="text-base font-bold text-slate-100 font-heading">New Booking Registration</h3>
                                <p className="text-xs text-slate-400 mt-1">
                                    {bookingStep === 1 && 'Step 1 of 3: Customer Information'}
                                    {bookingStep === 2 && 'Step 2 of 3: Check-In Details & Availability'}
                                    {bookingStep === 3 && 'Step 3 of 3: Booking Billing Summary'}
                                </p>
                            </div>
                            <button onClick={closeBookingModal} className="text-slate-400 hover:text-slate-200 transition-colors">
                                <i className="fa-solid fa-xmark text-lg"></i>
                            </button>
                        </div>

                        {/* Stepper Progress Dots */}
                        <div className="px-6 pt-4 flex items-center gap-3">
                            <span className={`step-dot w-2.5 h-2.5 rounded-full ${bookingStep >= 1 ? 'completed' : 'bg-slate-800'}`}></span>
                            <span className={`w-10 h-[2px] ${bookingStep >= 2 ? 'bg-brand-500' : 'bg-slate-800'}`}></span>
                            <span className={`step-dot w-2.5 h-2.5 rounded-full ${bookingStep > 2 ? 'completed' : bookingStep === 2 ? 'active' : 'bg-slate-800'}`}></span>
                            <span className={`w-10 h-[2px] ${bookingStep === 3 ? 'bg-brand-500' : 'bg-slate-800'}`}></span>
                            <span className={`step-dot w-2.5 h-2.5 rounded-full ${bookingStep === 3 ? 'active' : 'bg-slate-800'}`}></span>
                        </div>

                        {/* Modal Body Forms */}
                        <div className="p-6">
                            {/* Step 1: Customer Selection */}
                            {bookingStep === 1 && (
                                <div className="space-y-4 animate-fade-in">
                                    <div>
                                        <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">Select Guest</label>
                                        <select 
                                            value={customerId}
                                            onChange={(e) => setCustomerId(e.target.value)}
                                            required
                                            className="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-800 rounded-xl text-slate-200 focus:border-brand-500 transition-all text-sm focus:outline-none"
                                        >
                                            <option value="">-- Choose registered customer --</option>
                                            {customers.map(c => (
                                                <option key={c.id || c._id} value={c.id || c._id}>
                                                    {c.name || c.full_name} ({c.email || c.phone || 'No Contact'})
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                    <p className="text-xs text-slate-500">Note: If the customer is not registered, please save them under the Customer Management view first.</p>
                                </div>
                            )}

                            {/* Step 2: Date selection and room checking */}
                            {bookingStep === 2 && (
                                <div className="space-y-4 animate-fade-in">
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label htmlFor="booking-checkin-date" className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1.5">Check-In Date</label>
                                            <input 
                                                type="date" 
                                                id="booking-checkin-date" 
                                                required
                                                value={checkInDate}
                                                onChange={(e) => setCheckInDate(e.target.value)}
                                                className="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-800 rounded-xl text-slate-200 focus:border-brand-500 transition-all text-sm"
                                            />
                                        </div>
                                        <div>
                                            <label htmlFor="booking-checkout-date" className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1.5">Check-Out Date</label>
                                            <input 
                                                type="date" 
                                                id="booking-checkout-date" 
                                                required
                                                value={checkOutDate}
                                                onChange={(e) => setCheckOutDate(e.target.value)}
                                                className="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-800 rounded-xl text-slate-200 focus:border-brand-500 transition-all text-sm"
                                            />
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label htmlFor="booking-checkin-time" className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1.5">Check-In Time</label>
                                            <input 
                                                type="time" 
                                                id="booking-checkin-time" 
                                                required
                                                value={checkInTime}
                                                onChange={(e) => setCheckInTime(e.target.value)}
                                                className="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-800 rounded-xl text-slate-200 focus:border-brand-500 transition-all text-sm"
                                            />
                                        </div>
                                        <div className="flex items-end">
                                            <button 
                                                type="button" 
                                                onClick={checkRoomAvailability}
                                                className="w-full py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-750 font-semibold rounded-xl text-sm transition-all flex items-center justify-center gap-2"
                                            >
                                                <i className="fa-solid fa-magnifying-glass text-xs"></i>
                                                <span>Find Rooms</span>
                                            </button>
                                        </div>
                                    </div>

                                    {/* Available Room Selector */}
                                    {roomsFetched && (
                                        <div className="animate-fade-in">
                                            <label htmlFor="booking-room-id" className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1.5">Assign Room</label>
                                            <select 
                                                id="booking-room-id" 
                                                required
                                                value={roomId}
                                                onChange={(e) => setRoomId(e.target.value)}
                                                className="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-800 rounded-xl text-slate-200 focus:border-brand-500 transition-all text-sm focus:outline-none"
                                            >
                                                <option value="">-- Select an available room --</option>
                                                {availableRooms.map(r => (
                                                    <option key={r.id || r._id} value={r.id || r._id}>
                                                        Room {r.roomNumber || r.room_number} - {r.roomType || r.room_type} (Day: ${r.priceDay || r.price}, Night: ${r.priceNight || r.price})
                                                    </option>
                                                ))}
                                            </select>
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* Step 3: Booking Summary & Price calculation */}
                            {bookingStep === 3 && pricing && (
                                <div className="space-y-4 animate-fade-in">
                                    <div className="glass-card p-4 rounded-xl border border-slate-800 space-y-3">
                                        <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 border-b border-slate-800 pb-2">Billing Breakdown</h4>
                                        
                                        <div className="flex justify-between text-sm">
                                            <span className="text-slate-400">Guest:</span>
                                            <span className="font-medium text-slate-250">{selectedCustomer ? (selectedCustomer.name || selectedCustomer.full_name) : 'Unknown Guest'}</span>
                                        </div>
                                        <div className="flex justify-between text-sm">
                                            <span className="text-slate-400">Assigned Room:</span>
                                            <span className="font-medium text-indigo-400">Room {pricing.roomNumber} ({pricing.roomType})</span>
                                        </div>
                                        <div className="flex justify-between text-sm">
                                            <span className="text-slate-400">Stay Duration:</span>
                                            <span className="font-medium text-slate-250">{pricing.diffDays} Night(s)</span>
                                        </div>
                                        <div className="flex justify-between text-sm">
                                            <span className="text-slate-400">Arrival Profile:</span>
                                            <span className={`font-medium ${pricing.isNightStay ? 'text-indigo-400' : 'text-amber-400'}`}>
                                                {pricing.isNightStay ? 'Night Rate Applied' : 'Day Rate Applied'}
                                            </span>
                                        </div>
                                        <div className="flex justify-between text-sm font-bold border-t border-slate-800 pt-2 text-base text-slate-100">
                                            <span>Total Amount:</span>
                                            <span className="text-brand-400">${pricing.total.toFixed(2)}</span>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Modal Actions Navigation */}
                            <div className="pt-6 mt-6 border-t border-slate-800/50 flex justify-between">
                                {bookingStep > 1 && (
                                    <button 
                                        type="button" 
                                        onClick={handleBackStep}
                                        className="px-4 py-2 border border-slate-800 hover:bg-slate-900 text-slate-400 font-semibold rounded-xl text-sm transition-all"
                                    >
                                        <i className="fa-solid fa-chevron-left mr-1.5 text-xs"></i> Back
                                    </button>
                                )}
                                <div className="flex-grow"></div>
                                {bookingStep < 3 ? (
                                    <button 
                                        type="button" 
                                        onClick={handleNextStep}
                                        className="px-5 py-2 bg-brand-600 hover:bg-brand-500 text-white font-semibold rounded-xl text-sm transition-all"
                                    >
                                        Next Step <i className="fa-solid fa-chevron-right ml-1.5 text-xs"></i>
                                    </button>
                                ) : (
                                    <button 
                                        type="button" 
                                        onClick={submitBookingForm}
                                        className="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold rounded-xl text-sm transition-all shadow-md shadow-emerald-500/10 hover:shadow-emerald-500/20"
                                    >
                                        Confirm Booking <i className="fa-solid fa-circle-check ml-1.5 text-xs"></i>
                                    </button>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
