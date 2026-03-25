package handler

import (
	"strconv"

	"booking-bioskop/internal/model"
	"booking-bioskop/internal/service"

	"github.com/gofiber/fiber/v2"
)

type MovieHandler struct {
	movieSvc *service.MovieService
}

func NewMovieHandler(movieSvc *service.MovieService) *MovieHandler {
	return &MovieHandler{movieSvc: movieSvc}
}

// GET /movies
func (h *MovieHandler) GetAll(c *fiber.Ctx) error {
	movies, err := h.movieSvc.GetAll(c.Context())
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": err.Error()})
	}
	return c.JSON(movies)
}

// GET /movies/:id
func (h *MovieHandler) GetByID(c *fiber.Ctx) error {
	id, err := strconv.ParseInt(c.Params("id"), 10, 64)
	if err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "invalid movie id"})
	}
	movie, err := h.movieSvc.GetByID(c.Context(), id)
	if err != nil {
		return c.Status(fiber.StatusNotFound).JSON(fiber.Map{"error": err.Error()})
	}
	return c.JSON(movie)
}

// POST /movies  (protected)
func (h *MovieHandler) Create(c *fiber.Ctx) error {
	var req model.CreateMovieRequest
	if err := c.BodyParser(&req); err != nil || req.Title == "" {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "title is required"})
	}
	movie, err := h.movieSvc.Create(c.Context(), req.Title)
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": err.Error()})
	}
	return c.Status(fiber.StatusCreated).JSON(movie)
}

// GET /movies/:id/showtimes
func (h *MovieHandler) GetShowtimes(c *fiber.Ctx) error {
	id, _ := strconv.ParseInt(c.Params("id"), 10, 64)
	showtimes, err := h.movieSvc.GetShowtimes(c.Context(), id)
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": err.Error()})
	}
	return c.JSON(showtimes)
}

// GET /showtimes/:id
func (h *MovieHandler) GetShowtimeByID(c *fiber.Ctx) error {
	id, _ := strconv.ParseInt(c.Params("id"), 10, 64)
	st, err := h.movieSvc.GetShowtimeByID(c.Context(), id)
	if err != nil {
		return c.Status(fiber.StatusNotFound).JSON(fiber.Map{"error": err.Error()})
	}
	return c.JSON(st)
}

// POST /showtimes  (protected)
func (h *MovieHandler) CreateShowtime(c *fiber.Ctx) error {
	var req model.CreateShowtimeRequest
	if err := c.BodyParser(&req); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "invalid request body"})
	}
	st, err := h.movieSvc.CreateShowtime(c.Context(), req)
	if err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": err.Error()})
	}
	return c.Status(fiber.StatusCreated).JSON(st)
}
