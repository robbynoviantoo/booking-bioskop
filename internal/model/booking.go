package model

import "time"

// BookingStatus enumerates booking states
type BookingStatus string

const (
	BookingStatusPending BookingStatus = "pending"
	BookingStatusPaid    BookingStatus = "paid"
	BookingStatusCancelled BookingStatus = "cancelled"
)

type Booking struct {
	ID          int64         `json:"id"`
	UserID      int64         `json:"user_id"`
	ShowtimeID  int64         `json:"showtime_id"`
	TotalPrice  int64         `json:"total_price"`
	Status      BookingStatus `json:"status"`
	CreatedAt   time.Time     `json:"created_at"`
	Seats       []Seat        `json:"seats,omitempty"`
}

type BookingSeat struct {
	ID        int64 `json:"id"`
	BookingID int64 `json:"booking_id"`
	SeatID    int64 `json:"seat_id"`
}

type CheckoutRequest struct {
	ShowtimeID int64   `json:"showtime_id"`
	SeatIDs    []int64 `json:"seat_ids"`
	TotalPrice int64   `json:"total_price"`
}
