package repository

import (
	"context"
	"database/sql"

	"booking-bioskop/internal/model"
)

type SeatRepository struct {
	db *sql.DB
}

func NewSeatRepository(db *sql.DB) *SeatRepository {
	return &SeatRepository{db: db}
}

// FindByShowtime returns all seats for a given showtime from DB.
// "reserved" status is NOT stored in DB; it will be overlaid from Redis by the service layer.
func (r *SeatRepository) FindByShowtime(ctx context.Context, showtimeID int64) ([]model.Seat, error) {
	rows, err := r.db.QueryContext(ctx,
		`SELECT id, showtime_id, seat_number, status FROM seats WHERE showtime_id = ? ORDER BY seat_number`,
		showtimeID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var seats []model.Seat
	for rows.Next() {
		var s model.Seat
		if err := rows.Scan(&s.ID, &s.ShowtimeID, &s.SeatNumber, &s.Status); err != nil {
			return nil, err
		}
		seats = append(seats, s)
	}
	return seats, rows.Err()
}

// FindByID returns a single seat.
func (r *SeatRepository) FindByID(ctx context.Context, id int64) (*model.Seat, error) {
	s := &model.Seat{}
	err := r.db.QueryRowContext(ctx,
		`SELECT id, showtime_id, seat_number, status FROM seats WHERE id = ?`, id).
		Scan(&s.ID, &s.ShowtimeID, &s.SeatNumber, &s.Status)
	if err == sql.ErrNoRows {
		return nil, nil
	}
	return s, err
}

// MarkBooked updates seat status to 'booked' within a transaction.
func (r *SeatRepository) MarkBooked(ctx context.Context, tx *sql.Tx, seatID int64) error {
	_, err := tx.ExecContext(ctx,
		`UPDATE seats SET status = 'booked' WHERE id = ?`, seatID)
	return err
}

// FindByIDs returns multiple seats by their IDs.
func (r *SeatRepository) FindByIDs(ctx context.Context, ids []int64) ([]model.Seat, error) {
	if len(ids) == 0 {
		return nil, nil
	}
	// Build placeholders
	query := `SELECT id, showtime_id, seat_number, status FROM seats WHERE id IN (`
	args := make([]interface{}, len(ids))
	for i, id := range ids {
		if i > 0 {
			query += ","
		}
		query += "?"
		args[i] = id
	}
	query += ")"

	rows, err := r.db.QueryContext(ctx, query, args...)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var seats []model.Seat
	for rows.Next() {
		var s model.Seat
		if err := rows.Scan(&s.ID, &s.ShowtimeID, &s.SeatNumber, &s.Status); err != nil {
			return nil, err
		}
		seats = append(seats, s)
	}
	return seats, rows.Err()
}
