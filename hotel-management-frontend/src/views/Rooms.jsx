import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { useApp } from '../context/AppContext';

export default function Rooms() {
    const { showToast, setGlobalLoading } = useApp();
    const [rooms, setRooms] = useState([]);
    const [loading, setLoading] = useState(true);
    const [modalOpen, setModalOpen] = useState(false);
    
    // Modal Form State
    const [roomId, setRoomId] = useState('');
    const [roomNumber, setRoomNumber] = useState('');
    const [roomType, setRoomType] = useState('Standard');
    const [capacity, setCapacity] = useState(2);
    const [status, setStatus] = useState('Available');
    const [priceDay, setPriceDay] = useState(0);
    const [priceNight, setPriceNight] = useState(0);

    const fetchRooms = async () => {
        setLoading(true);
        try {
            const response = await api.getRooms();
            // Supports array directly or { success: true, data: [...] }
            const data = response.data.data || response.data;
            setRooms(data);
        } catch (error) {
            console.error('Error fetching rooms:', error);
            showToast('Error loading rooms from backend.', 'error');
            setRooms([]);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchRooms();
    }, []);

    const openModal = (room = null) => {
        if (room) {
            setRoomId(room.id || room.room_id || room._id);
            setRoomNumber(room.roomNumber || room.room_number);
            setRoomType(room.roomType || room.room_type || 'Standard');
            setCapacity(room.capacity || 2);
            setStatus(room.status || 'Available');
            setPriceDay(room.priceDay || room.price_day || room.price || 0);
            setPriceNight(room.priceNight || room.price_night || room.price || 0);
        } else {
            setRoomId('');
            setRoomNumber('');
            setRoomType('Standard');
            setCapacity(2);
            setStatus('Available');
            setPriceDay(0);
            setPriceNight(0);
        }
        setModalOpen(true);
    };

    const closeModal = () => {
        setModalOpen(false);
    };

    const handleFormSubmit = async (e) => {
        e.preventDefault();
        const roomData = {
            roomNumber: roomNumber.trim(),
            roomType,
            capacity: parseInt(capacity, 10),
            status,
            priceDay: parseFloat(priceDay),
            priceNight: parseFloat(priceNight)
        };

        setGlobalLoading(true);
        try {
            if (roomId) {
                // Edit / Update
                await api.updateRoom(roomId, roomData);
                showToast(`Room ${roomData.roomNumber} updated successfully.`, 'success');
            } else {
                // Create
                await api.createRoom(roomData);
                showToast(`Room ${roomData.roomNumber} created successfully.`, 'success');
            }
            closeModal();
            fetchRooms();
        } catch (error) {
            console.error('Error saving room:', error);
            showToast(error.response?.data?.message || 'Error processing request.', 'error');
        } finally {
            setGlobalLoading(false);
        }
    };

    const handleDelete = async (id, roomNum) => {
        if (window.confirm(`Are you sure you want to delete Room ${roomNum}? This cannot be undone.`)) {
            setGlobalLoading(true);
            try {
                await api.deleteRoom(id);
                showToast(`Room ${roomNum} deleted successfully.`, 'success');
                fetchRooms();
            } catch (error) {
                console.error('Error deleting room:', error);
                showToast(error.response?.data?.message || 'Failed to delete room.', 'error');
            } finally {
                setGlobalLoading(false);
            }
        }
    };

    const statusColors = {
        'available': 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
        'occupied': 'bg-rose-500/10 text-rose-400 border-rose-500/20',
        'maintenance': 'bg-amber-500/10 text-amber-400 border-amber-500/20',
        'dirty': 'bg-orange-500/10 text-orange-400 border-orange-500/20'
    };

    return (
        <div className="space-y-6 animate-fade-in font-sans">
            {/* Header section */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-slate-100 tracking-tight font-heading">Room Inventory</h1>
                    <p className="text-sm text-slate-400">Configure room types, pricing, and live room statuses.</p>
                </div>
                <button 
                    onClick={() => openModal()}
                    className="px-4 py-2 bg-brand-600 hover:bg-brand-500 text-white rounded-xl shadow-md shadow-brand-500/10 hover:shadow-brand-500/20 font-semibold transition-all flex items-center gap-2 text-sm"
                >
                    <i className="fa-solid fa-plus text-xs"></i>
                    <span>Add New Room</span>
                </button>
            </div>

            {/* Rooms list card */}
            <div className="glass-panel rounded-2xl border border-slate-800/80 shadow-lg overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-slate-900/50 text-slate-400 text-[10px] font-bold tracking-wider uppercase border-b border-slate-800/40">
                                <th className="py-3.5 px-6">Room Number</th>
                                <th className="py-3.5 px-6">Room Type</th>
                                <th className="py-3.5 px-6">Max Capacity</th>
                                <th className="py-3.5 px-6">Day Rate</th>
                                <th className="py-3.5 px-6">Night Rate</th>
                                <th className="py-3.5 px-6">Live Status</th>
                                <th className="py-3.5 px-6 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-800/40 text-sm text-slate-300">
                            {loading ? (
                                <tr>
                                    <td colSpan="7" className="py-8 text-center text-slate-500">Retrieving room listings...</td>
                                </tr>
                            ) : rooms.length === 0 ? (
                                <tr>
                                    <td colSpan="7" className="py-8 text-center text-slate-500">No rooms configured. Add one to begin.</td>
                                </tr>
                            ) : (
                                rooms.map(room => {
                                    const currentStatus = room.status || room.live_status || 'Available';
                                    const colorClass = statusColors[currentStatus.toLowerCase()] || 'bg-slate-800 text-slate-400 border-slate-700/50';
                                    const id = room.id || room.room_id || room._id;
                                    
                                    return (
                                        <tr key={id} className="hover:bg-slate-900/30 transition-colors">
                                            <td className="py-4 px-6 font-bold text-slate-200">Room {room.roomNumber || room.room_number}</td>
                                            <td className="py-4 px-6 font-medium">{room.roomType || room.room_type}</td>
                                            <td className="py-4 px-6">{room.capacity} {room.capacity === 1 ? 'Guest' : 'Guests'}</td>
                                            <td className="py-4 px-6 font-semibold">${(room.priceDay || room.price_day || room.price || 0).toFixed(2)}</td>
                                            <td className="py-4 px-6 font-semibold">${(room.priceNight || room.price_night || room.price || 0).toFixed(2)}</td>
                                            <td className="py-4 px-6">
                                                <span className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-bold border capitalize ${colorClass}`}>
                                                    {currentStatus}
                                                </span>
                                            </td>
                                            <td className="py-4 px-6 text-right">
                                                <div className="flex items-center justify-end gap-2">
                                                    <button 
                                                        onClick={() => openModal(room)}
                                                        className="p-2 text-slate-400 hover:text-brand-400 hover:bg-slate-800/80 rounded-lg transition-all"
                                                    >
                                                        <i className="fa-solid fa-pen-to-square text-sm"></i>
                                                    </button>
                                                    <button 
                                                        onClick={() => handleDelete(id, room.roomNumber || room.room_number)}
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

            {/* Add/Edit Room Modal Backdrop */}
            {modalOpen && (
                <div className="fixed inset-0 z-50 bg-slate-950/75 flex items-center justify-center p-4">
                    <div className="glass-panel w-full max-w-lg rounded-2xl border border-slate-800/80 shadow-2xl relative overflow-hidden animate-fade-in">
                        <div className="absolute top-0 left-0 w-full h-[3px] bg-gradient-to-r from-brand-500 to-indigo-500"></div>
                        
                        <div className="p-6 border-b border-slate-800/50 flex justify-between items-center">
                            <h3 className="text-base font-bold text-slate-100 font-heading">
                                {roomId ? `Edit Room ${roomNumber}` : 'Add New Room'}
                            </h3>
                            <button onClick={closeModal} className="text-slate-400 hover:text-slate-200 transition-colors">
                                <i className="fa-solid fa-xmark text-lg"></i>
                            </button>
                        </div>

                        <form onSubmit={handleFormSubmit} className="p-6 space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label htmlFor="room-number" className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1.5">Room Number</label>
                                    <input 
                                        type="text" 
                                        id="room-number" 
                                        required 
                                        placeholder="e.g. 101"
                                        value={roomNumber}
                                        onChange={(e) => setRoomNumber(e.target.value)}
                                        className="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-800 rounded-xl text-slate-200 focus:border-brand-500 transition-all text-sm"
                                    />
                                </div>
                                <div>
                                    <label htmlFor="room-type" className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1.5">Room Type</label>
                                    <select 
                                        id="room-type" 
                                        required
                                        value={roomType}
                                        onChange={(e) => setRoomType(e.target.value)}
                                        className="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-800 rounded-xl text-slate-200 focus:border-brand-500 transition-all text-sm focus:outline-none"
                                    >
                                        <option value="Standard">Standard</option>
                                        <option value="Deluxe">Deluxe</option>
                                        <option value="Suite">Suite</option>
                                        <option value="Presidential">Presidential</option>
                                    </select>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label htmlFor="room-capacity" className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1.5">Max Capacity (Guests)</label>
                                    <input 
                                        type="number" 
                                        id="room-capacity" 
                                        required 
                                        min="1" 
                                        max="10" 
                                        placeholder="e.g. 2"
                                        value={capacity}
                                        onChange={(e) => setCapacity(e.target.value)}
                                        className="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-800 rounded-xl text-slate-200 focus:border-brand-500 transition-all text-sm"
                                    />
                                </div>
                                <div>
                                    <label htmlFor="room-status" className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1.5">Status</label>
                                    <select 
                                        id="room-status" 
                                        required
                                        value={status}
                                        onChange={(e) => setStatus(e.target.value)}
                                        className="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-800 rounded-xl text-slate-200 focus:border-brand-500 transition-all text-sm focus:outline-none"
                                    >
                                        <option value="Available">Available</option>
                                        <option value="Occupied">Occupied</option>
                                        <option value="Maintenance">Maintenance</option>
                                        <option value="Dirty">Dirty</option>
                                    </select>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label htmlFor="room-price-day" className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1.5">Day Price ($)</label>
                                    <input 
                                        type="number" 
                                        id="room-price-day" 
                                        required 
                                        min="0" 
                                        step="0.01" 
                                        placeholder="0.00"
                                        value={priceDay}
                                        onChange={(e) => setPriceDay(e.target.value)}
                                        className="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-800 rounded-xl text-slate-200 focus:border-brand-500 transition-all text-sm"
                                    />
                                </div>
                                <div>
                                    <label htmlFor="room-price-night" className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1.5">Night Price ($)</label>
                                    <input 
                                        type="number" 
                                        id="room-price-night" 
                                        required 
                                        min="0" 
                                        step="0.01" 
                                        placeholder="0.00"
                                        value={priceNight}
                                        onChange={(e) => setPriceNight(e.target.value)}
                                        className="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-800 rounded-xl text-slate-200 focus:border-brand-500 transition-all text-sm"
                                    />
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
                                    Save Changes
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
