package service

import (
	"context"

	"booking-bioskop/internal/model"
	redislock "booking-bioskop/internal/redis"
	"booking-bioskop/internal/repository"
	"booking-bioskop/internal/ws"

	"github.com/redis/go-redis/v9"
)

type BookingService struct {
	bookingRepo *repository.BookingRepository
	seatSvc     *SeatService
	rdb         *redis.Client
	hub         *ws.Hub
}

func NewBookingService(
	bookingRepo *repository.BookingRepository,
	seatSvc *SeatService,
	rdb *redis.Client,
	hub *ws.Hub,
) *BookingService {
	return &BookingService{bookingRepo: bookingRepo, seatSvc: seatSvc, rdb: rdb, hub: hub}
}

// Checkout performs the full booking flow:
// 1. Validate all Redis locks belong to the user
// 2. DB transaction: insert booking + booking_seats + mark seats booked
// 3. Release all Redis locks
// 4. Broadcast seat_booked for each seat
func (s *BookingService) Checkout(ctx context.Context, userID int64, req model.CheckoutRequest) (*model.Booking, error) {
	// Step 1: Validate Redis locks
	if err := s.seatSvc.ValidateUserLocks(ctx, req.ShowtimeID, userID, req.SeatIDs); err != nil {
		return nil, err
	}

	// Step 2: DB transaction (insert booking + booking_seats + update seats)
	booking, err := s.bookingRepo.Checkout(ctx, userID, req.ShowtimeID, req.SeatIDs, req.TotalPrice)
	if err != nil {
		return nil, err
	}

	// Step 3: Release all Redis locks
	_ = redislock.ReleaseAllSeats(ctx, s.rdb, req.ShowtimeID, req.SeatIDs)

	// Step 4: Broadcast seat_booked for each seat
	for _, seatID := range req.SeatIDs {
		s.hub.Broadcast(ws.Event{
			Type:   "seat_booked",
			SeatID: seatID,
			Status: string(model.SeatStatusBooked),
		})
	}

	return booking, nil
}

func (s *BookingService) GetByID(ctx context.Context, id int64) (*model.Booking, error) {
	return s.bookingRepo.FindByID(ctx, id)
}

func (s *BookingService) GetUserBookings(ctx context.Context, userID int64) ([]model.Booking, error) {
	return s.bookingRepo.FindByUser(ctx, userID)
}
