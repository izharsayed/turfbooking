import { create } from 'zustand';

export type BookingStatus = 'UPCOMING' | 'COMPLETED' | 'CANCELLED';

export interface Booking {
  id: string;
  turfId: string;
  turfName: string;
  area: string;
  date: string;
  time: string;
  amount: number;
  status: BookingStatus;
}

interface NewBooking {
  turfId: string;
  turfName: string;
  area: string;
  date: string;
  time: string;
  amount: number;
}

interface BookingState {
  bookings: Booking[];
  addBooking: (booking: NewBooking) => Booking;
  cancelBooking: (id: string) => void;
  getBookingById: (id: string | undefined) => Booking | undefined;
}

export const useBookingStore = create<BookingState>((set, get) => ({
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
  addBooking: (booking) => {
    const created: Booking = {
      ...booking,
      id: `B-${Math.floor(10000 + Math.random() * 90000)}`,
      status: 'UPCOMING',
    };
    set((state) => ({ bookings: [created, ...state.bookings] }));
    return created;
  },
  cancelBooking: (id) => {
    set((state) => ({
      bookings: state.bookings.map((b) =>
        b.id === id ? { ...b, status: 'CANCELLED' } : b
      ),
    }));
  },
  getBookingById: (id) => get().bookings.find((b) => b.id === id),
}));
