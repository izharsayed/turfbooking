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
  id?: string;
  turfId: string;
  turfName: string;
  area: string;
  date: string;
  time: string;
  amount: number;
}

interface BookingState {
  bookings: Booking[];
  setBookings: (bookings: Booking[]) => void;
  addBooking: (booking: NewBooking) => Booking;
  cancelBooking: (id: string) => void;
  rescheduleBooking: (id: string, date: string, time: string) => void;
  getBookingById: (id: string | undefined) => Booking | undefined;
}

export const useBookingStore = create<BookingState>((set, get) => ({
  bookings: [],
  setBookings: (bookings) => set({ bookings }),
  addBooking: (booking) => {
    const created: Booking = {
      ...booking,
      id: booking.id || `B-${Math.floor(10000 + Math.random() * 90000)}`,
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
  rescheduleBooking: (id, date, time) => {
    set((state) => ({
      bookings: state.bookings.map((b) =>
        b.id === id ? { ...b, date, time } : b
      ),
    }));
  },
  getBookingById: (id) => get().bookings.find((b) => b.id === id),
}));
