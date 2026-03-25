package handler

import (
	"strconv"

	"time"

	"booking-bioskop/internal/model"
	"booking-bioskop/internal/service"

	"github.com/gofiber/fiber/v2"
)

type BookingHandler struct {
	bookingSvc *service.BookingService
	movieSvc   *service.MovieService
}

func NewBookingHandler(bookingSvc *service.BookingService, movieSvc *service.MovieService) *BookingHandler {
	return &BookingHandler{bookingSvc: bookingSvc, movieSvc: movieSvc}
}

// POST /bookings  (protected) - Checkout
func (h *BookingHandler) Checkout(c *fiber.Ctx) error {
	userID := c.Locals("user_id").(int64)

	var req model.CheckoutRequest
	if err := c.BodyParser(&req); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "invalid request body"})
	}
	if req.ShowtimeID == 0 || len(req.SeatIDs) == 0 {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "showtime_id and seat_ids are required"})
	}

	// Validate showtime hasn't passed
	st, err := h.movieSvc.GetShowtimeByID(c.Context(), req.ShowtimeID)
	if err != nil || st == nil {
		return c.Status(fiber.StatusNotFound).JSON(fiber.Map{"error": "showtime not found"})
	}
	if st.ShowTime.Before(time.Now()) {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "cannot book past showtimes"})
	}

	booking, err := h.bookingSvc.Checkout(c.Context(), userID, req)
	if err != nil {
		return c.Status(fiber.StatusConflict).JSON(fiber.Map{"error": err.Error()})
	}
	return c.Status(fiber.StatusCreated).JSON(booking)
}

// GET /bookings/:id  (protected)
func (h *BookingHandler) GetByID(c *fiber.Ctx) error {
	id, err := strconv.ParseInt(c.Params("id"), 10, 64)
	if err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "invalid booking id"})
	}

	booking, err := h.bookingSvc.GetByID(c.Context(), id)
	if err != nil || booking == nil {
		return c.Status(fiber.StatusNotFound).JSON(fiber.Map{"error": "booking not found"})
	}

	// Only allow user to see their own booking
	userID := c.Locals("user_id").(int64)
	if booking.UserID != userID {
		return c.Status(fiber.StatusForbidden).JSON(fiber.Map{"error": "access denied"})
	}

	return c.JSON(booking)
}

// GET /bookings  (protected) - list user's own bookings
func (h *BookingHandler) GetUserBookings(c *fiber.Ctx) error {
	userID := c.Locals("user_id").(int64)
	bookings, err := h.bookingSvc.GetUserBookings(c.Context(), userID)
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": err.Error()})
	}
	if bookings == nil {
		bookings = []model.Booking{}
	}
	return c.JSON(bookings)
}
