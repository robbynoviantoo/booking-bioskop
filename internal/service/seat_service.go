package service

import (
	"context"
	"errors"
	"fmt"

	"booking-bioskop/internal/model"
	redislock "booking-bioskop/internal/redis"
	"booking-bioskop/internal/repository"
	"booking-bioskop/internal/ws"

	"github.com/redis/go-redis/v9"
)

type SeatService struct {
	seatRepo *repository.SeatRepository
	rdb      *redis.Client
	hub      *ws.Hub
}

func NewSeatService(seatRepo *repository.SeatRepository, rdb *redis.Client, hub *ws.Hub) *SeatService {
	return &SeatService{seatRepo: seatRepo, rdb: rdb, hub: hub}
}

// GetSeats returns seats for a showtime, overlaying Redis lock status.
func (s *SeatService) GetSeats(ctx context.Context, showtimeID int64) ([]model.Seat, error) {
	seats, err := s.seatRepo.FindByShowtime(ctx, showtimeID)
	if err != nil {
		return nil, err
	}

	for i := range seats {
		// Only check Redis for seats that are still 'available' in DB
		if seats[i].Status == model.SeatStatusAvailable {
			lockedBy, err := redislock.GetSeatLock(ctx, s.rdb, showtimeID, seats[i].ID)
			if err != nil {
				return nil, err
			}
			if lockedBy != 0 {
				seats[i].Status = model.SeatStatusReserved
				seats[i].LockedByUID = lockedBy
			}
		}
	}
	return seats, nil
}

// LockSeat tries to lock a seat via Redis SetNX and broadcasts the event.
func (s *SeatService) LockSeat(ctx context.Context, req model.LockSeatRequest) error {
	// Verify seat exists and belongs to showtime
	seat, err := s.seatRepo.FindByID(ctx, req.SeatID)
	if err != nil {
		return err
	}
	if seat == nil {
		return errors.New("seat not found")
	}
	if seat.ShowtimeID != req.ShowtimeID {
		return errors.New("seat does not belong to this showtime")
	}
	if seat.Status == model.SeatStatusBooked {
		return errors.New("seat is already booked")
	}

	// Attempt Redis lock
	ok, err := redislock.LockSeat(ctx, s.rdb, req.ShowtimeID, req.SeatID, req.UserID)
	if err != nil {
		return fmt.Errorf("redis error: %w", err)
	}
	if !ok {
		// Check who locked it
		lockedBy, _ := redislock.GetSeatLock(ctx, s.rdb, req.ShowtimeID, req.SeatID)
		if lockedBy == req.UserID {
			return errors.New("you already locked this seat")
		}
		return errors.New("seat is already reserved by another user")
	}

	// Broadcast to all WebSocket clients
	s.hub.Broadcast(ws.Event{
		Type:   "seat_reserved",
		SeatID: req.SeatID,
		Status: string(model.SeatStatusReserved),
	})
	return nil
}

// ReleaseSeat removes the Redis lock and broadcasts.
func (s *SeatService) ReleaseSeat(ctx context.Context, req model.ReleaseSeatRequest) error {
	if err := redislock.ReleaseSeat(ctx, s.rdb, req.ShowtimeID, req.SeatID, req.UserID); err != nil {
		return err
	}

	s.hub.Broadcast(ws.Event{
		Type:   "seat_released",
		SeatID: req.SeatID,
		Status: string(model.SeatStatusAvailable),
	})
	return nil
}

// ValidateUserLocks ensures all seatIDs are locked by userID in Redis before checkout.
func (s *SeatService) ValidateUserLocks(ctx context.Context, showtimeID, userID int64, seatIDs []int64) error {
	for _, sid := range seatIDs {
		lockedBy, err := redislock.GetSeatLock(ctx, s.rdb, showtimeID, sid)
		if err != nil {
			return err
		}
		if lockedBy == 0 {
			return fmt.Errorf("seat %d is not locked (lock may have expired)", sid)
		}
		if lockedBy != userID {
			return fmt.Errorf("seat %d is locked by another user", sid)
		}
	}
	return nil
}
