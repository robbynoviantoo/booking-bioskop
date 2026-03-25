package handler

import (
	"strconv"
	"time"

	"booking-bioskop/internal/model"
	"booking-bioskop/internal/service"

	"github.com/gofiber/fiber/v2"
)

type SeatHandler struct {
	seatSvc  *service.SeatService
	movieSvc *service.MovieService
}

func NewSeatHandler(seatSvc *service.SeatService, movieSvc *service.MovieService) *SeatHandler {
	return &SeatHandler{seatSvc: seatSvc, movieSvc: movieSvc}
}

// GET /showtimes/:id/seats
func (h *SeatHandler) GetSeats(c *fiber.Ctx) error {
	id, err := strconv.ParseInt(c.Params("id"), 10, 64)
	if err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "invalid showtime id"})
	}
	seats, err := h.seatSvc.GetSeats(c.Context(), id)
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": err.Error()})
	}
	return c.JSON(seats)
}

// POST /seats/lock  (protected)
func (h *SeatHandler) LockSeat(c *fiber.Ctx) error {
	userID := c.Locals("user_id").(int64)

	var req model.LockSeatRequest
	if err := c.BodyParser(&req); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "invalid request body"})
	}
	req.UserID = userID

	// Validate showtime hasn't passed
	st, err := h.movieSvc.GetShowtimeByID(c.Context(), req.ShowtimeID)
	if err != nil || st == nil {
		return c.Status(fiber.StatusNotFound).JSON(fiber.Map{"error": "showtime not found"})
	}
	if st.ShowTime.Before(time.Now()) {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "kanot lock seats for past showtimes"})
	}

	if err := h.seatSvc.LockSeat(c.Context(), req); err != nil {
		return c.Status(fiber.StatusConflict).JSON(fiber.Map{"error": err.Error()})
	}
	return c.JSON(fiber.Map{"message": "seat locked successfully"})
}

// POST /seats/release  (protected)
func (h *SeatHandler) ReleaseSeat(c *fiber.Ctx) error {
	userID := c.Locals("user_id").(int64)

	var req model.ReleaseSeatRequest
	if err := c.BodyParser(&req); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "invalid request body"})
	}
	req.UserID = userID

	if err := h.seatSvc.ReleaseSeat(c.Context(), req); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": err.Error()})
	}
	return c.JSON(fiber.Map{"message": "seat released successfully"})
}

// POST /showtimes/:id/seats  (protected) - admin: create seats for a showtime
func (h *SeatHandler) CreateSeats(c *fiber.Ctx) error {
	showtimeID, err := strconv.ParseInt(c.Params("id"), 10, 64)
	if err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "invalid showtime id"})
	}

	var body struct {
		Rows        []string `json:"rows"`
		SeatsPerRow int      `json:"seats_per_row"`
	}
	if err := c.BodyParser(&body); err != nil || len(body.Rows) == 0 || body.SeatsPerRow <= 0 {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "rows (array) and seats_per_row (int) are required"})
	}

	if err := h.seatSvc.CreateSeats(c.Context(), showtimeID, body.Rows, body.SeatsPerRow); err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": err.Error()})
	}
	return c.Status(fiber.StatusCreated).JSON(fiber.Map{"message": "seats created successfully"})
}
