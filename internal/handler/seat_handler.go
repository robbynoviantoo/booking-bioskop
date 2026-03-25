package handler

import (
	"strconv"

	"booking-bioskop/internal/model"
	"booking-bioskop/internal/service"

	"github.com/gofiber/fiber/v2"
)

type SeatHandler struct {
	seatSvc *service.SeatService
}

func NewSeatHandler(seatSvc *service.SeatService) *SeatHandler {
	return &SeatHandler{seatSvc: seatSvc}
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
