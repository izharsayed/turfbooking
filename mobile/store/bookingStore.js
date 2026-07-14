"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.useBookingStore = void 0;
const zustand_1 = require("zustand");
exports.useBookingStore = (0, zustand_1.create)((set, get) => ({
    bookings: [
        {
            id: 'B-88392',
            turfId: '1',
            turfName: 'Old Trafford Arena',
            area: 'Savedi, Ahmednagar',
            date: '2026-07-06',
            time: '18:00 - 19:00',
            amount: 1200,
            status: 'UPCOMING',
        },
    ],
    setBookings: (bookings) => set({ bookings }),
    addBooking: (booking) => {
        const created = {
            ...booking,
            id: booking.id || `B-${Math.floor(10000 + Math.random() * 90000)}`,
            status: 'UPCOMING',
        };
        set((state) => ({ bookings: [created, ...state.bookings] }));
        return created;
    },
    cancelBooking: (id) => {
        set((state) => ({
            bookings: state.bookings.map((b) => b.id === id ? { ...b, status: 'CANCELLED' } : b),
        }));
    },
    rescheduleBooking: (id, date, time) => {
        set((state) => ({
            bookings: state.bookings.map((b) => b.id === id ? { ...b, date, time } : b),
        }));
    },
    getBookingById: (id) => get().bookings.find((b) => b.id === id),
}));
