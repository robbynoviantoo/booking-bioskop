package repository

import (
	"context"
	"database/sql"

	"booking-bioskop/internal/model"
)

type BookingRepository struct {
	db *sql.DB
}

func NewBookingRepository(db *sql.DB) *BookingRepository {
	return &BookingRepository{db: db}
}

// FindByID returns a booking with its seat list.
func (r *BookingRepository) FindByID(ctx context.Context, id int64) (*model.Booking, error) {
	b := &model.Booking{}
	err := r.db.QueryRowContext(ctx,
		`SELECT id, user_id, showtime_id, total_price, status, created_at FROM bookings WHERE id = ?`, id).
		Scan(&b.ID, &b.UserID, &b.ShowtimeID, &b.TotalPrice, &b.Status, &b.CreatedAt)
	if err == sql.ErrNoRows {
		return nil, nil
	}
	if err != nil {
		return nil, err
	}

	// Fetch associated seats
	rows, err := r.db.QueryContext(ctx,
		`SELECT s.id, s.showtime_id, s.seat_number, s.status
		 FROM booking_seats bs JOIN seats s ON s.id = bs.seat_id
		 WHERE bs.booking_id = ?`, id)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	for rows.Next() {
		var s model.Seat
		if err := rows.Scan(&s.ID, &s.ShowtimeID, &s.SeatNumber, &s.Status); err != nil {
			return nil, err
		}
		b.Seats = append(b.Seats, s)
	}
	return b, rows.Err()
}

// Checkout creates a booking inside a DB transaction.
// Steps: insert booking → insert booking_seats → update seat status
func (r *BookingRepository) Checkout(ctx context.Context, userID, showtimeID int64, seatIDs []int64, totalPrice int64) (*model.Booking, error) {
	tx, err := r.db.BeginTx(ctx, nil)
	if err != nil {
		return nil, err
	}
	defer func() {
		if err != nil {
			tx.Rollback()
		}
	}()

	// 1. Insert booking
	res, err := tx.ExecContext(ctx,
		`INSERT INTO bookings (user_id, showtime_id, total_price, status) VALUES (?, ?, ?, 'pending')`,
		userID, showtimeID, totalPrice,
	)
	if err != nil {
		return nil, err
	}
	bookingID, err := res.LastInsertId()
	if err != nil {
		return nil, err
	}

	// 2. Insert booking_seats + update seats status
	for _, seatID := range seatIDs {
		if _, err = tx.ExecContext(ctx,
			`INSERT INTO booking_seats (booking_id, seat_id) VALUES (?, ?)`, bookingID, seatID); err != nil {
			return nil, err
		}
		if _, err = tx.ExecContext(ctx,
			`UPDATE seats SET status = 'booked' WHERE id = ?`, seatID); err != nil {
			return nil, err
		}
	}

	if err = tx.Commit(); err != nil {
		return nil, err
	}

	return r.FindByID(ctx, bookingID)
}
