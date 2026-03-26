// ─── Auth Types ───────────────────────────────────────
export interface User {
  id: number;
  name: string;
  email: string;
  role: string;
  created_at: string;
}

export interface LoginResponse {
  token: string;
  user: User;
}

// ─── Movie / Showtime Types ───────────────────────────
export interface Movie {
  id: number;
  title: string;
  img_url: string;
}

export interface Showtime {
  id: number;
  movie_id: number;
  show_time: string;
  movie?: Movie;
}

// ─── Seat Types ───────────────────────────────────────
export type SeatStatus = 'available' | 'reserved' | 'booked';

export interface Seat {
  id: number;
  showtime_id: number;
  seat_number: string;
  status: SeatStatus;
  locked_by?: number;
}

// ─── Booking Types ────────────────────────────────────
export type BookingStatus = 'pending' | 'paid' | 'cancelled' | 'expired';

export interface Booking {
  id: number;
  user_id: number;
  showtime_id: number;
  total_price: number;
  status: BookingStatus;
  created_at: string;
  seats?: Seat[];
}

export interface CheckoutRequest {
  showtime_id: number;
  seat_ids: number[];
  total_price: number;
}

// ─── WebSocket Event Types ────────────────────────────
export type WsEventType = 'seat_reserved' | 'seat_released' | 'seat_booked';

export interface WsEvent {
  type: WsEventType;
  seat_id: number;
  status: SeatStatus;
}

// ─── API Error ────────────────────────────────────────
export interface ApiError {
  error: string;
}
