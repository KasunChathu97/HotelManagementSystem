// Booking Management View Module
import api from '../api.js';
import { showToast, setGlobalLoading } from '../app.js';

let bookingsList = [];
let customersList = [];
let roomsList = [];
let bookingStep = 1;

export async function render(container) {
    container.innerHTML = `
        <div class="space-y-6">
            <!-- Header -->
            <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 class="text-2xl font-bold text-slate-100 tracking-tight font-heading">Bookings & Reservations</h1>
                    <p class="text-sm text-slate-400">Manage guest reservations, room assignments, and check-ins/check-outs.</p>
                </div>
                <button id="add-booking-btn" class="px-4 py-2 bg-brand-600 hover:bg-brand-500 text-white rounded-xl shadow-md shadow-brand-500/10 hover:shadow-brand-500/20 font-semibold transition-all flex items-center gap-2 text-sm">
                    <i class="fa-solid fa-calendar-plus text-xs"></i>
                    <span>New Reservation</span>
                </button>
            </div>

            <!-- Filter Panel -->
            <div class="glass-panel p-4 rounded-xl border border-slate-800/80 flex flex-wrap gap-4 items-center justify-between">
                <div class="flex flex-wrap gap-3 items-center">
                    <span class="text-xs font-bold text-slate-400 uppercase tracking-wider">Filter Status:</span>
                    <button class="filter-status-btn px-3.5 py-1.5 rounded-lg text-xs font-semibold bg-slate-900 border border-slate-800 text-slate-300 hover:text-slate-100 transition-all active-filter" data-status="all">All Bookings</button>
                    <button class="filter-status-btn px-3.5 py-1.5 rounded-lg text-xs font-semibold bg-slate-900 border border-slate-800 text-slate-300 hover:text-slate-100 transition-all" data-status="pending">Pending</button>
                    <button class="filter-status-btn px-3.5 py-1.5 rounded-lg text-xs font-semibold bg-slate-900 border border-slate-800 text-slate-300 hover:text-slate-100 transition-all" data-status="checked-in">Checked In</button>
                    <button class="filter-status-btn px-3.5 py-1.5 rounded-lg text-xs font-semibold bg-slate-900 border border-slate-800 text-slate-300 hover:text-slate-100 transition-all" data-status="checked-out">Checked Out</button>
                </div>
            </div>

            <!-- Bookings List Card -->
            <div class="glass-panel rounded-2xl border border-slate-800/80 shadow-lg overflow-hidden">
                <div class="overflow-x-auto">
                    <table class="w-full text-left border-collapse">
                        <thead>
                            <tr class="bg-slate-900/50 text-slate-400 text-[10px] font-bold tracking-wider uppercase border-b border-slate-800/40">
                                <th class="py-3.5 px-6">Ref ID</th>
                                <th class="py-3.5 px-6">Customer</th>
                                <th class="py-3.5 px-6">Room Details</th>
                                <th class="py-3.5 px-6">Dates & Arrival</th>
                                <th class="py-3.5 px-6">Total Amount</th>
                                <th class="py-3.5 px-6">Status</th>
                                <th class="py-3.5 px-6 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody id="bookings-tbody" class="divide-y divide-slate-800/40 text-sm text-slate-300">
                            <tr>
                                <td colspan="7" class="py-8 text-center text-slate-500">Retrieving booking records...</td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            </div>
        </div>

        <!-- Multi-Step Booking Modal Backdrop -->
        <div id="booking-modal" class="fixed inset-0 z-50 bg-slate-950/75 flex items-center justify-center hidden p-4">
            <div class="glass-panel w-full max-w-xl rounded-2xl border border-slate-800/80 shadow-2xl relative overflow-hidden animate-fade-in">
                <div class="absolute top-0 left-0 w-full h-[3px] bg-gradient-to-r from-brand-500 to-indigo-500"></div>

                <!-- Modal Header -->
                <div class="p-6 border-b border-slate-800/50 flex justify-between items-center">
                    <div>
                        <h3 class="text-base font-bold text-slate-100 font-heading">New Booking Registration</h3>
                        <p class="text-xs text-slate-400 mt-1" id="step-indicator">Step 1 of 3: Customer Information</p>
                    </div>
                    <button id="close-booking-modal-btn" class="text-slate-400 hover:text-slate-200 transition-colors">
                        <i class="fa-solid fa-xmark text-lg"></i>
                    </button>
                </div>

                <!-- Stepper Progress Dots -->
                <div class="px-6 pt-4 flex items-center gap-3">
                    <span class="step-dot w-2.5 h-2.5 rounded-full active" id="dot-1"></span>
                    <span class="w-10 h-[2px] bg-slate-800" id="line-1"></span>
                    <span class="step-dot w-2.5 h-2.5 rounded-full bg-slate-800" id="dot-2"></span>
                    <span class="w-10 h-[2px] bg-slate-800" id="line-2"></span>
                    <span class="step-dot w-2.5 h-2.5 rounded-full bg-slate-800" id="dot-3"></span>
                </div>

                <!-- Modal Body Forms -->
                <div class="p-6">
                    <!-- Step 1: Customer Selection -->
                    <div id="step-1-content" class="space-y-4">
                        <div>
                            <label class="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">Select Guest</label>
                            <select id="booking-customer-id" required
                                class="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-800 rounded-xl text-slate-200 focus:border-brand-500 transition-all text-sm">
                                <option value="">-- Choose registered customer --</option>
                            </select>
                        </div>
                        <p class="text-xs text-slate-500">Note: If the customer is not registered, please save them under the Customer Management view first.</p>
                    </div>

                    <!-- Step 2: Date selection and room checking -->
                    <div id="step-2-content" class="space-y-4 hidden">
                        <div class="grid grid-cols-2 gap-4">
                            <div>
                                <label for="booking-checkin-date" class="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1.5">Check-In Date</label>
                                <input type="date" id="booking-checkin-date" required
                                    class="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-800 rounded-xl text-slate-200 focus:border-brand-500 transition-all text-sm">
                            </div>
                            <div>
                                <label for="booking-checkout-date" class="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1.5">Check-Out Date</label>
                                <input type="date" id="booking-checkout-date" required
                                    class="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-800 rounded-xl text-slate-200 focus:border-brand-500 transition-all text-sm">
                            </div>
                        </div>

                        <div class="grid grid-cols-2 gap-4">
                            <div>
                                <label for="booking-checkin-time" class="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1.5">Check-In Time</label>
                                <input type="time" id="booking-checkin-time" required value="12:00"
                                    class="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-800 rounded-xl text-slate-200 focus:border-brand-500 transition-all text-sm">
                            </div>
                            <div class="flex items-end">
                                <button type="button" id="check-avail-rooms-btn" 
                                    class="w-full py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-750 font-semibold rounded-xl text-sm transition-all flex items-center justify-center gap-2">
                                    <i class="fa-solid fa-magnifying-glass text-xs"></i>
                                    <span>Find Rooms</span>
                                </button>
                            </div>
                        </div>

                        <!-- Available Room Selector -->
                        <div id="room-selection-container" class="hidden">
                            <label for="booking-room-id" class="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1.5">Assign Room</label>
                            <select id="booking-room-id" required
                                class="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-800 rounded-xl text-slate-200 focus:border-brand-500 transition-all text-sm">
                                <option value="">-- Select an available room --</option>
                            </select>
                        </div>
                    </div>

                    <!-- Step 3: Booking Summary & Price calculation -->
                    <div id="step-3-content" class="space-y-4 hidden">
                        <div class="glass-card p-4 rounded-xl border border-slate-800 space-y-3">
                            <h4 class="text-xs font-bold uppercase tracking-wider text-slate-400 border-b border-slate-800 pb-2">Billing Breakdown</h4>
                            
                            <div class="flex justify-between text-sm">
                                <span class="text-slate-400">Guest:</span>
                                <span class="font-medium text-slate-200" id="summary-guest">-</span>
                            </div>
                            <div class="flex justify-between text-sm">
                                <span class="text-slate-400">Assigned Room:</span>
                                <span class="font-medium text-indigo-400" id="summary-room">-</span>
                            </div>
                            <div class="flex justify-between text-sm">
                                <span class="text-slate-400">Stay Duration:</span>
                                <span class="font-medium text-slate-200" id="summary-duration">-</span>
                            </div>
                            <div class="flex justify-between text-sm">
                                <span class="text-slate-400">Arrival Profile:</span>
                                <span class="font-medium" id="summary-pricing-type">-</span>
                            </div>
                            <div class="flex justify-between text-sm font-bold border-t border-slate-800 pt-2 text-base text-slate-100">
                                <span>Total Amount:</span>
                                <span class="text-brand-400" id="summary-total-price">Rs 0.00</span>
                            </div>
                        </div>
                    </div>

                    <!-- Modal Actions Navigation -->
                    <div class="pt-6 mt-6 border-t border-slate-800/50 flex justify-between">
                        <button type="button" id="back-step-btn" class="px-4 py-2 border border-slate-800 hover:bg-slate-900 text-slate-400 font-semibold rounded-xl text-sm transition-all hidden">
                            <i class="fa-solid fa-chevron-left mr-1.5 text-xs"></i> Back
                        </button>
                        <div class="flex-grow"></div>
                        <button type="button" id="next-step-btn" class="px-5 py-2 bg-brand-600 hover:bg-brand-500 text-white font-semibold rounded-xl text-sm transition-all">
                            Next Step <i class="fa-solid fa-chevron-right ml-1.5 text-xs"></i>
                        </button>
                        <button type="button" id="submit-booking-btn" class="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold rounded-xl text-sm transition-all hidden">
                            Confirm Booking <i class="fa-solid fa-circle-check ml-1.5 text-xs"></i>
                        </button>
                    </div>
                </div>
            </div>
        </div>
    `;

    // Hook Events
    document.getElementById('add-booking-btn').addEventListener('click', openBookingModal);
    document.getElementById('close-booking-modal-btn').addEventListener('click', closeBookingModal);
    document.getElementById('next-step-btn').addEventListener('click', handleNextStep);
    document.getElementById('back-step-btn').addEventListener('click', handleBackStep);
    document.getElementById('check-avail-rooms-btn').addEventListener('click', checkRoomAvailability);
    document.getElementById('booking-room-id').addEventListener('change', calculateSummaryPrices);
    document.getElementById('submit-booking-btn').addEventListener('click', submitBookingForm);

    // Filters event listener
    document.querySelectorAll('.filter-status-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            document.querySelectorAll('.filter-status-btn').forEach(b => b.classList.remove('active-filter', 'bg-brand-600', 'text-white'));
            btn.classList.add('active-filter');
            if (btn.getAttribute('data-status') !== 'all') {
                btn.classList.add('bg-brand-600', 'text-white');
            }
            filterBookings(btn.getAttribute('data-status'));
        });
    });

    // Load initial listings
    await fetchBookingsData();
}

async function fetchBookingsData() {
    try {
        const [bookingsRes, customersRes, roomsRes] = await Promise.all([
            api.getBookings(),
            api.getCustomers(),
            api.getRooms()
        ]);
        
        bookingsList = bookingsRes.data;
        customersList = customersRes.data;
        roomsList = roomsRes.data;

        renderBookingsTable(bookingsList);
        populateCustomersDropdown();
    } catch (error) {
        console.error('Error loading bookings dependencies:', error);
        showToast('Error syncing booking details. Showing demo datasets.', 'warning');
        loadFallbackBookings();
    }
}

function populateCustomersDropdown() {
    const dropdown = document.getElementById('booking-customer-id');
    dropdown.innerHTML = '<option value="">-- Choose registered customer --</option>' + 
        customersList.map(c => `<option value="${c.id || c._id}">${c.name} (${c.email || c.phone || 'No Contact'})</option>`).join('');
}

function renderBookingsTable(bookings) {
    const tbody = document.getElementById('bookings-tbody');
    if (!bookings || bookings.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="7" class="py-8 text-center text-slate-500">No bookings matching filter.</td>
            </tr>
        `;
        return;
    }

    const statusColors = {
        'pending': 'bg-amber-500/10 text-amber-400 border-amber-500/20',
        'checked-in': 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
        'checked-out': 'bg-slate-800 text-slate-400 border-slate-700/50',
        'cancelled': 'bg-rose-500/10 text-rose-400 border-rose-500/20',
    };

    tbody.innerHTML = bookings.map(b => {
        const checkInVal = new Date(b.checkIn);
        const checkOutVal = new Date(b.checkOut);
        
        const checkInFmt = checkInVal.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
        const checkOutFmt = checkOutVal.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
        
        const status = b.status || 'pending';
        const colorClass = statusColors[status.toLowerCase()] || 'bg-slate-800 text-slate-400 border-slate-700/50';

        // Check if check-in or check-out buttons are active
        const showCheckIn = status.toLowerCase() === 'pending';
        const showCheckOut = status.toLowerCase() === 'checked-in';

        return `
            <tr class="hover:bg-slate-900/30 transition-colors">
                <td class="py-4 px-6 font-bold text-slate-400">#${(b.id || b._id).toString().substring(0, 8)}</td>
                <td class="py-4 px-6">
                    <div class="font-semibold text-slate-200">${b.customer?.name || 'Walk-in Guest'}</div>
                    <div class="text-xs text-slate-400">${b.customer?.phone || ''}</div>
                </td>
                <td class="py-4 px-6">
                    <div class="font-bold text-indigo-400">Room ${b.room?.roomNumber || 'Unassigned'}</div>
                    <div class="text-xs text-slate-400 capitalize">${b.room?.roomType || 'Standard'}</div>
                </td>
                <td class="py-4 px-6">
                    <div class="text-xs text-slate-300 font-semibold">${checkInFmt} &mdash; ${checkOutFmt}</div>
                    <div class="text-[10px] text-slate-400 mt-0.5"><i class="fa-solid fa-clock mr-1 text-slate-500"></i> Arrival: ${b.checkInTime || '12:00'}</div>
                </td>
                <td class="py-4 px-6 font-bold text-slate-200">Rs ${(b.totalAmount || 0).toFixed(2)}</td>
                <td class="py-4 px-6">
                    <span class="inline-block px-2.5 py-0.5 rounded-full text-xs font-bold border capitalize ${colorClass}">
                        ${status}
                    </span>
                </td>
                <td class="py-4 px-6 text-right">
                    <div class="flex items-center justify-end gap-2">
                        ${showCheckIn ? `
                            <button class="checkin-btn px-3 py-1.5 bg-emerald-600/10 hover:bg-emerald-600 text-emerald-400 hover:text-white rounded-lg border border-emerald-500/25 transition-all text-xs font-semibold" data-id="${b.id || b._id}">
                                Check In
                            </button>
                        ` : ''}
                        ${showCheckOut ? `
                            <button class="checkout-btn px-3 py-1.5 bg-brand-600/10 hover:bg-brand-600 text-brand-400 hover:text-white rounded-lg border border-brand-500/25 transition-all text-xs font-semibold" data-id="${b.id || b._id}">
                                Check Out
                            </button>
                        ` : ''}
                        ${!showCheckIn && !showCheckOut ? `<span class="text-xs text-slate-500 font-medium">Completed</span>` : ''}
                    </div>
                </td>
            </tr>
        `;
    }).join('');

    // Attach actions
    document.querySelectorAll('.checkin-btn').forEach(btn => {
        btn.addEventListener('click', () => performCheckIn(btn.getAttribute('data-id')));
    });

    document.querySelectorAll('.checkout-btn').forEach(btn => {
        btn.addEventListener('click', () => performCheckOut(btn.getAttribute('data-id')));
    });
}

function filterBookings(status) {
    if (status === 'all') {
        renderBookingsTable(bookingsList);
    } else {
        const filtered = bookingsList.filter(b => (b.status || '').toLowerCase() === status.toLowerCase());
        renderBookingsTable(filtered);
    }
}

async function performCheckIn(id) {
    setGlobalLoading(true);
    try {
        await api.checkinBooking(id);
        showToast('Guest checked in successfully.', 'success');
        await fetchBookingsData();
    } catch (error) {
        console.error('Check-in error:', error);
        showToast(error.response?.data?.message || 'Check-in failed.', 'error');
    } finally {
        setGlobalLoading(false);
    }
}

async function performCheckOut(id) {
    setGlobalLoading(true);
    try {
        await api.checkoutBooking(id);
        showToast('Guest checked out successfully.', 'success');
        await fetchBookingsData();
    } catch (error) {
        console.error('Check-out error:', error);
        showToast(error.response?.data?.message || 'Check-out failed.', 'error');
    } finally {
        setGlobalLoading(false);
    }
}

// Modal handling
function openBookingModal() {
    bookingStep = 1;
    document.getElementById('booking-modal').classList.remove('hidden');
    updateStepView();
}

function closeBookingModal() {
    document.getElementById('booking-modal').classList.add('hidden');
}

function handleNextStep() {
    if (bookingStep === 1) {
        const customerId = document.getElementById('booking-customer-id').value;
        if (!customerId) {
            showToast('Please select a customer to proceed.', 'warning');
            return;
        }
        bookingStep = 2;
    } else if (bookingStep === 2) {
        const roomId = document.getElementById('booking-room-id').value;
        if (!roomId) {
            showToast('Please find and assign an available room.', 'warning');
            return;
        }
        bookingStep = 3;
        calculateSummaryPrices();
    }
    updateStepView();
}

function handleBackStep() {
    if (bookingStep > 1) {
        bookingStep--;
        updateStepView();
    }
}

function updateStepView() {
    // Content sections
    document.getElementById('step-1-content').classList.add('hidden');
    document.getElementById('step-2-content').classList.add('hidden');
    document.getElementById('step-3-content').classList.add('hidden');
    document.getElementById(`step-${bookingStep}-content`).classList.remove('hidden');

    // Indicator Title
    const stepTitles = [
        'Step 1 of 3: Customer Information',
        'Step 2 of 3: Check-In Details & Availability',
        'Step 3 of 3: Booking Billing Summary'
    ];
    document.getElementById('step-indicator').innerText = stepTitles[bookingStep - 1];

    // Stepper dots
    document.getElementById('dot-1').className = `step-dot w-2.5 h-2.5 rounded-full ${bookingStep >= 1 ? 'completed' : 'bg-slate-800'}`;
    document.getElementById('dot-2').className = `step-dot w-2.5 h-2.5 rounded-full ${bookingStep > 2 ? 'completed' : bookingStep === 2 ? 'active' : 'bg-slate-800'}`;
    document.getElementById('dot-3').className = `step-dot w-2.5 h-2.5 rounded-full ${bookingStep === 3 ? 'active' : 'bg-slate-800'}`;
    
    document.getElementById('line-1').className = `w-10 h-[2px] ${bookingStep >= 2 ? 'bg-brand-500' : 'bg-slate-800'}`;
    document.getElementById('line-2').className = `w-10 h-[2px] ${bookingStep === 3 ? 'bg-brand-500' : 'bg-slate-800'}`;

    // Nav buttons
    if (bookingStep === 1) {
        document.getElementById('back-step-btn').classList.add('hidden');
        document.getElementById('next-step-btn').classList.remove('hidden');
        document.getElementById('submit-booking-btn').classList.add('hidden');
    } else if (bookingStep === 2) {
        document.getElementById('back-step-btn').classList.remove('hidden');
        document.getElementById('next-step-btn').classList.remove('hidden');
        document.getElementById('submit-booking-btn').classList.add('hidden');
    } else if (bookingStep === 3) {
        document.getElementById('back-step-btn').classList.remove('hidden');
        document.getElementById('next-step-btn').classList.add('hidden');
        document.getElementById('submit-booking-btn').classList.remove('hidden');
    }
}

async function checkRoomAvailability() {
    const checkInDate = document.getElementById('booking-checkin-date').value;
    const checkOutDate = document.getElementById('booking-checkout-date').value;

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
        // Query backend for available rooms
        // Usually matches: GET /rooms?status=Available or endpoint filter.
        // Let's filter client side or query GET /rooms
        const response = await api.getRooms();
        const allRooms = response.data;
        
        // Filter rooms. If room status is Available, show them.
        const availableRooms = allRooms.filter(r => r.status === 'Available');
        
        const dropdown = document.getElementById('booking-room-id');
        dropdown.innerHTML = '<option value="">-- Select an available room --</option>' + 
            availableRooms.map(r => `<option value="${r.id || r._id}">Room ${r.roomNumber} - ${r.roomType} (Day: Rs ${r.priceDay}, Night: Rs ${r.priceNight})</option>`).join('');

        document.getElementById('room-selection-container').classList.remove('hidden');
        showToast(`Found ${availableRooms.length} available rooms.`, 'success');
    } catch (error) {
        console.error('Error checking room availability:', error);
        showToast('Could not fetch available rooms.', 'error');
    } finally {
        setGlobalLoading(false);
    }
}

// Calculate booking costs
function getStayPricing() {
    const checkInDate = document.getElementById('booking-checkin-date').value;
    const checkOutDate = document.getElementById('booking-checkout-date').value;
    const checkInTime = document.getElementById('booking-checkin-time').value || '12:00';
    const roomId = document.getElementById('booking-room-id').value;

    if (!checkInDate || !checkOutDate || !roomId) return null;

    const room = roomsList.find(r => (r.id || r._id) == roomId);
    if (!room) return null;

    const start = new Date(checkInDate);
    const end = new Date(checkOutDate);
    const diffTime = Math.abs(end - start);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) || 1;

    // Pricing Rule: Night rate if checking in late (>= 18:00 or 6 PM) or overnight
    // Day rate if staying within same-day daytime
    const hour = parseInt(checkInTime.split(':')[0], 10);
    const isNightStay = hour >= 18 || hour < 6 || diffDays > 0;
    
    const rate = isNightStay ? (room.priceNight || room.price || 0) : (room.priceDay || room.price || 0);
    const total = rate * diffDays;

    return {
        diffDays,
        isNightStay,
        rate,
        total,
        roomNumber: room.roomNumber,
        roomType: room.roomType
    };
}

function calculateSummaryPrices() {
    const pricing = getStayPricing();
    if (!pricing) return;

    const custId = document.getElementById('booking-customer-id').value;
    const customer = customersList.find(c => (c.id || c._id) == custId);

    document.getElementById('summary-guest').innerText = customer ? customer.name : 'Unknown Guest';
    document.getElementById('summary-room').innerText = `Room ${pricing.roomNumber} (${pricing.roomType})`;
    document.getElementById('summary-duration').innerText = `${pricing.diffDays} Night(s)`;
    document.getElementById('summary-pricing-type').innerText = pricing.isNightStay ? 'Night Rate Applied' : 'Day Rate Applied';
    
    const rateEl = document.getElementById('summary-pricing-type');
    rateEl.className = pricing.isNightStay ? 'font-medium text-indigo-400' : 'font-medium text-amber-400';

    document.getElementById('summary-total-price').innerText = `Rs ${pricing.total.toFixed(2)}`;
}

async function submitBookingForm() {
    const pricing = getStayPricing();
    if (!pricing) return;

    const customerId = document.getElementById('booking-customer-id').value;
    const roomId = document.getElementById('booking-room-id').value;
    const checkInDate = document.getElementById('booking-checkin-date').value;
    const checkOutDate = document.getElementById('booking-checkout-date').value;
    const checkInTime = document.getElementById('booking-checkin-time').value;

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
        await fetchBookingsData();
    } catch (error) {
        console.error('Error creating booking:', error);
        showToast(error.response?.data?.message || 'Failed to complete booking reservation.', 'error');
    } finally {
        setGlobalLoading(false);
    }
}

function loadFallbackBookings() {
    customersList = [
        { id: 1, name: 'Alice Watson', email: 'alice@watson.com', phone: '+123456789' },
        { id: 2, name: 'Bob Henderson', email: 'bob@henderson.com', phone: '+987654321' }
    ];
    roomsList = [
        { id: 1, roomNumber: '101', roomType: 'Standard', priceDay: 50, priceNight: 65, status: 'Available' },
        { id: 2, roomNumber: '201', roomType: 'Deluxe', priceDay: 85, priceNight: 105, status: 'Available' }
    ];
    bookingsList = [
        { id: 1, customer: customersList[0], room: roomsList[0], checkIn: '2026-05-28', checkOut: '2026-05-30', checkInTime: '14:00', totalAmount: 130, status: 'Checked-in' },
        { id: 2, customer: customersList[1], room: roomsList[1], checkIn: '2026-05-29', checkOut: '2026-06-01', checkInTime: '19:00', totalAmount: 315, status: 'Pending' }
    ];
    
    renderBookingsTable(bookingsList);
    populateCustomersDropdown();
}
