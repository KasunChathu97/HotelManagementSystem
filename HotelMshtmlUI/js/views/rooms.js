// Room Management View Module
import api from '../api.js';
import { showToast, setGlobalLoading } from '../app.js';

let roomsList = [];

export async function render(container) {
    container.innerHTML = `
        <div class="space-y-6">
            <!-- Header section -->
            <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 class="text-2xl font-bold text-slate-100 tracking-tight font-heading">Room Inventory</h1>
                    <p class="text-sm text-slate-400">Configure room types, pricing, and live room statuses.</p>
                </div>
                <button id="add-room-btn" class="px-4 py-2 bg-brand-600 hover:bg-brand-500 text-white rounded-xl shadow-md shadow-brand-500/10 hover:shadow-brand-500/20 font-semibold transition-all flex items-center gap-2 text-sm">
                    <i class="fa-solid fa-plus text-xs"></i>
                    <span>Add New Room</span>
                </button>
            </div>

            <!-- Rooms list card -->
            <div class="glass-panel rounded-2xl border border-slate-800/80 shadow-lg overflow-hidden">
                <div class="overflow-x-auto">
                    <table class="w-full text-left border-collapse">
                        <thead>
                            <tr class="bg-slate-900/50 text-slate-400 text-[10px] font-bold tracking-wider uppercase border-b border-slate-800/40">
                                <th class="py-3.5 px-6">Room Number</th>
                                <th class="py-3.5 px-6">Room Type</th>
                                <th class="py-3.5 px-6">Max Capacity</th>
                                <th class="py-3.5 px-6">Day Rate</th>
                                <th class="py-3.5 px-6">Night Rate</th>
                                <th class="py-3.5 px-6">Live Status</th>
                                <th class="py-3.5 px-6 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody id="rooms-tbody" class="divide-y divide-slate-800/40 text-sm text-slate-300">
                            <tr>
                                <td colspan="7" class="py-8 text-center text-slate-500">Retrieving room listings...</td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            </div>
        </div>

        <!-- Add/Edit Room Modal Backdrop -->
        <div id="room-modal" class="fixed inset-0 z-50 bg-slate-950/75 flex items-center justify-center hidden p-4">
            <div class="glass-panel w-full max-w-lg rounded-2xl border border-slate-800/80 shadow-2xl relative overflow-hidden animate-fade-in">
                <div class="absolute top-0 left-0 w-full h-[3px] bg-gradient-to-r from-brand-500 to-indigo-500"></div>
                
                <div class="p-6 border-b border-slate-800/50 flex justify-between items-center">
                    <h3 id="modal-title" class="text-base font-bold text-slate-100 font-heading">Add New Room</h3>
                    <button id="close-modal-btn" class="text-slate-400 hover:text-slate-200 transition-colors">
                        <i class="fa-solid fa-xmark text-lg"></i>
                    </button>
                </div>

                <form id="room-form" class="p-6 space-y-4">
                    <input type="hidden" id="room-id">
                    
                    <div class="grid grid-cols-2 gap-4">
                        <div>
                            <label for="room-number" class="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1.5">Room Number</label>
                            <input type="text" id="room-number" required placeholder="e.g. 101"
                                class="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-800 rounded-xl text-slate-200 focus:border-brand-500 transition-all text-sm">
                        </div>
                        <div>
                            <label for="room-type" class="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1.5">Room Type</label>
                            <select id="room-type" required
                                class="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-800 rounded-xl text-slate-200 focus:border-brand-500 transition-all text-sm">
                                <option value="Standard">Standard</option>
                                <option value="Deluxe">Deluxe</option>
                                <option value="Suite">Suite</option>
                                <option value="Presidential">Presidential</option>
                            </select>
                        </div>
                    </div>

                    <div class="grid grid-cols-2 gap-4">
                        <div>
                            <label for="room-capacity" class="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1.5">Max Capacity (Guests)</label>
                            <input type="number" id="room-capacity" required min="1" max="10" placeholder="e.g. 2"
                                class="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-800 rounded-xl text-slate-200 focus:border-brand-500 transition-all text-sm">
                        </div>
                        <div>
                            <label for="room-status" class="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1.5">Status</label>
                            <select id="room-status" required
                                class="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-800 rounded-xl text-slate-200 focus:border-brand-500 transition-all text-sm">
                                <option value="Available">Available</option>
                                <option value="Occupied">Occupied</option>
                                <option value="Maintenance">Maintenance</option>
                                <option value="Dirty">Dirty</option>
                            </select>
                        </div>
                    </div>

                    <div class="grid grid-cols-2 gap-4">
                        <div>
                            <label for="room-price-day" class="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1.5">Day Price (Rs)</label>
                            <input type="number" id="room-price-day" required min="0" step="0.01" placeholder="0.00"
                                class="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-800 rounded-xl text-slate-200 focus:border-brand-500 transition-all text-sm">
                        </div>
                        <div>
                            <label for="room-price-night" class="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1.5">Night Price (Rs)</label>
                            <input type="number" id="room-price-night" required min="0" step="0.01" placeholder="0.00"
                                class="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-800 rounded-xl text-slate-200 focus:border-brand-500 transition-all text-sm">
                        </div>
                    </div>

                    <div class="pt-4 border-t border-slate-800/50 flex justify-end gap-3">
                        <button type="button" id="cancel-room-btn" class="px-4 py-2 border border-slate-800 hover:bg-slate-900 text-slate-300 font-semibold rounded-xl text-sm transition-all">
                            Cancel
                        </button>
                        <button type="submit" class="px-4 py-2 bg-brand-600 hover:bg-brand-500 text-white font-semibold rounded-xl text-sm transition-all">
                            Save Changes
                        </button>
                    </div>
                </form>
            </div>
        </div>
    `;

    // Hook listeners
    document.getElementById('add-room-btn').addEventListener('click', () => openRoomModal());
    document.getElementById('close-modal-btn').addEventListener('click', closeRoomModal);
    document.getElementById('cancel-room-btn').addEventListener('click', closeRoomModal);
    document.getElementById('room-form').addEventListener('submit', handleRoomFormSubmit);

    // Initial Fetch
    await fetchRooms();
}

async function fetchRooms() {
    try {
        const response = await api.getRooms();
        roomsList = response.data;
        renderRoomsTable(roomsList);
    } catch (error) {
        console.error('Error fetching rooms:', error);
        showToast('Error loading rooms from server. Showing local simulation.', 'warning');
        loadFallbackRooms();
    }
}

function renderRoomsTable(rooms) {
    const tbody = document.getElementById('rooms-tbody');
    if (!rooms || rooms.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="7" class="py-8 text-center text-slate-500">No rooms configured. Add one to begin.</td>
            </tr>
        `;
        return;
    }

    const statusColors = {
        'available': 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
        'occupied': 'bg-rose-500/10 text-rose-400 border-rose-500/20',
        'maintenance': 'bg-amber-500/10 text-amber-400 border-amber-500/20',
        'dirty': 'bg-orange-500/10 text-orange-400 border-orange-500/20'
    };

    tbody.innerHTML = rooms.map(room => {
        const status = room.status || 'Available';
        const colorClass = statusColors[status.toLowerCase()] || 'bg-slate-800 text-slate-400 border-slate-700/50';
        
        return `
            <tr class="hover:bg-slate-900/30 transition-colors">
                <td class="py-4 px-6 font-bold text-slate-200">Room ${room.roomNumber}</td>
                <td class="py-4 px-6 font-medium">${room.roomType}</td>
                <td class="py-4 px-6">${room.capacity} ${room.capacity === 1 ? 'Guest' : 'Guests'}</td>
                <td class="py-4 px-6 font-semibold">Rs ${(room.priceDay || room.price || 0).toFixed(2)}</td>
                <td class="py-4 px-6 font-semibold">Rs ${(room.priceNight || room.price || 0).toFixed(2)}</td>
                <td class="py-4 px-6">
                    <span class="inline-block px-2.5 py-0.5 rounded-full text-xs font-bold border capitalize ${colorClass}">
                        ${status}
                    </span>
                </td>
                <td class="py-4 px-6 text-right">
                    <div class="flex items-center justify-end gap-2">
                        <button class="edit-room-btn p-2 text-slate-400 hover:text-brand-400 hover:bg-slate-800/80 rounded-lg transition-all" data-id="${room.id || room._id}">
                            <i class="fa-solid fa-pen-to-square text-sm"></i>
                        </button>
                        <button class="delete-room-btn p-2 text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition-all" data-id="${room.id || room._id}">
                            <i class="fa-solid fa-trash-can text-sm"></i>
                        </button>
                    </div>
                </td>
            </tr>
        `;
    }).join('');

    // Attach click events to dynamic table buttons
    document.querySelectorAll('.edit-room-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const id = btn.getAttribute('data-id');
            const room = roomsList.find(r => (r.id || r._id) == id);
            if (room) openRoomModal(room);
        });
    });

    document.querySelectorAll('.delete-room-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const id = btn.getAttribute('data-id');
            confirmDeleteRoom(id);
        });
    });
}

function openRoomModal(room = null) {
    const modal = document.getElementById('room-modal');
    const form = document.getElementById('room-form');
    const title = document.getElementById('modal-title');
    
    form.reset();
    
    if (room) {
        title.innerText = `Edit Room ${room.roomNumber}`;
        document.getElementById('room-id').value = room.id || room._id;
        document.getElementById('room-number').value = room.roomNumber;
        document.getElementById('room-type').value = room.roomType;
        document.getElementById('room-capacity').value = room.capacity;
        document.getElementById('room-status').value = room.status;
        document.getElementById('room-price-day').value = room.priceDay || room.price || 0;
        document.getElementById('room-price-night').value = room.priceNight || room.price || 0;
    } else {
        title.innerText = 'Add New Room';
        document.getElementById('room-id').value = '';
    }
    
    modal.classList.remove('hidden');
}

function closeRoomModal() {
    document.getElementById('room-modal').classList.add('hidden');
}

async function handleRoomFormSubmit(e) {
    e.preventDefault();
    
    const roomId = document.getElementById('room-id').value;
    const roomData = {
        roomNumber: document.getElementById('room-number').value.trim(),
        roomType: document.getElementById('room-type').value,
        capacity: parseInt(document.getElementById('room-capacity').value, 10),
        status: document.getElementById('room-status').value,
        priceDay: parseFloat(document.getElementById('room-price-day').value),
        priceNight: parseFloat(document.getElementById('room-price-night').value)
    };

    setGlobalLoading(true);
    try {
        if (roomId) {
            // Edit
            await api.updateRoom(roomId, roomData);
            showToast(`Room ${roomData.roomNumber} updated successfully.`, 'success');
        } else {
            // Create
            await api.createRoom(roomData);
            showToast(`Room ${roomData.roomNumber} created successfully.`, 'success');
        }
        closeRoomModal();
        await fetchRooms();
    } catch (error) {
        console.error('Error saving room:', error);
        showToast(error.response?.data?.message || 'Error processing request.', 'error');
    } finally {
        setGlobalLoading(false);
    }
}

async function confirmDeleteRoom(id) {
    const room = roomsList.find(r => (r.id || r._id) == id);
    if (!room) return;

    if (confirm(`Are you sure you want to delete Room ${room.roomNumber}? This cannot be undone.`)) {
        setGlobalLoading(true);
        try {
            await api.deleteRoom(id);
            showToast(`Room ${room.roomNumber} deleted successfully.`, 'success');
            await fetchRooms();
        } catch (error) {
            console.error('Error deleting room:', error);
            showToast(error.response?.data?.message || 'Failed to delete room.', 'error');
        } finally {
            setGlobalLoading(false);
        }
    }
}

// Fallback logic for offline simulation
function loadFallbackRooms() {
    roomsList = [
        { id: 1, roomNumber: '101', roomType: 'Standard', capacity: 2, priceDay: 50, priceNight: 65, status: 'Available' },
        { id: 2, roomNumber: '102', roomType: 'Standard', capacity: 2, priceDay: 50, priceNight: 65, status: 'Occupied' },
        { id: 3, roomNumber: '201', roomType: 'Deluxe', capacity: 3, priceDay: 85, priceNight: 105, status: 'Available' },
        { id: 4, roomNumber: '202', roomType: 'Deluxe', capacity: 3, priceDay: 85, priceNight: 105, status: 'Maintenance' },
        { id: 5, roomNumber: '301', roomType: 'Suite', capacity: 4, priceDay: 150, priceNight: 180, status: 'Available' },
        { id: 6, roomNumber: '302', roomType: 'Suite', capacity: 4, priceDay: 150, priceNight: 180, status: 'Dirty' }
    ];
    renderRoomsTable(roomsList);
}
