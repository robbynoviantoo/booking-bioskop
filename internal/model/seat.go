package model

// SeatStatus enumerates seat states
type SeatStatus string

const (
	SeatStatusAvailable SeatStatus = "available"
	SeatStatusReserved  SeatStatus = "reserved" // locked in Redis
	SeatStatusBooked    SeatStatus = "booked"   // committed in DB
)

type Seat struct {
	ID          int64      `json:"id"`
	ShowtimeID  int64      `json:"showtime_id"`
	SeatNumber  string     `json:"seat_number"`
	Status      SeatStatus `json:"status"`
	LockedByUID int64      `json:"locked_by,omitempty"` // populated from Redis
}

type LockSeatRequest struct {
	SeatID     int64 `json:"seat_id"`
	ShowtimeID int64 `json:"showtime_id"`
	UserID     int64 `json:"user_id"`
}

type ReleaseSeatRequest struct {
	SeatID     int64 `json:"seat_id"`
	ShowtimeID int64 `json:"showtime_id"`
	UserID     int64 `json:"user_id"`
}
