package router

import (
	"booking-bioskop/internal/handler"
	"booking-bioskop/internal/middleware"
	"booking-bioskop/internal/ws"

	"github.com/gofiber/fiber/v2"
	fiberws "github.com/gofiber/websocket/v2"
)

type Deps struct {
	AuthHandler    *handler.AuthHandler
	MovieHandler   *handler.MovieHandler
	SeatHandler    *handler.SeatHandler
	BookingHandler *handler.BookingHandler
}

func Setup(app *fiber.App, d Deps) {
	// ── Static files ──────────────────────────────────────────────────────────
	app.Static("/uploads", "./uploads")

	// ── Health check ──────────────────────────────────────────────────────────
	app.Get("/health", func(c *fiber.Ctx) error {
		return c.JSON(fiber.Map{"status": "ok"})
	})

	// ── WebSocket ─────────────────────────────────────────────────────────────
	// Upgrade check middleware
	app.Use("/ws", func(c *fiber.Ctx) error {
		if fiberws.IsWebSocketUpgrade(c) {
			return c.Next()
		}
		return fiber.ErrUpgradeRequired
	})
	app.Get("/ws", fiberws.New(ws.HandleClient))

	// ── Auth (public) ─────────────────────────────────────────────────────────
	auth := app.Group("/auth")
	auth.Post("/register", d.AuthHandler.Register)
	auth.Post("/login", d.AuthHandler.Login)
	auth.Delete("/delete", middleware.AuthRequired(), middleware.AdminRequired(), d.AuthHandler.DeleteUser)
	auth.Get("/:id", middleware.AuthRequired(), middleware.AdminRequired(), d.AuthHandler.GetUserByID)
	auth.Get("/", middleware.AuthRequired(), middleware.AdminRequired(), d.AuthHandler.GetAllUsers)

	// ── Movies (public read, protected write) ─────────────────────────────────
	movies := app.Group("/movies")
	movies.Get("/", d.MovieHandler.GetAll)
	movies.Get("/:id", d.MovieHandler.GetByID)
	movies.Get("/:id/showtimes", d.MovieHandler.GetShowtimes)
	movies.Post("/", middleware.AuthRequired(), middleware.AdminRequired(), d.MovieHandler.Create)

	// ── Showtimes ─────────────────────────────────────────────────────────────
	showtimes := app.Group("/showtimes")
	showtimes.Get("/:id", d.MovieHandler.GetShowtimeByID)
	showtimes.Get("/:id/seats", d.SeatHandler.GetSeats)
	showtimes.Post("/", middleware.AuthRequired(), middleware.AdminRequired(), d.MovieHandler.CreateShowtime)
	// ── Seat creation (protected, admin) ──────────────────────────────────────
	showtimes.Post("/:id/seats", middleware.AuthRequired(), middleware.AdminRequired(), d.SeatHandler.CreateSeats)

	// ── Seats (protected) ─────────────────────────────────────────────────────
	seats := app.Group("/seats", middleware.AuthRequired())
	seats.Post("/lock", d.SeatHandler.LockSeat)
	seats.Post("/release", d.SeatHandler.ReleaseSeat)

	// ── Bookings (protected) ──────────────────────────────────────────────────
	bookings := app.Group("/bookings", middleware.AuthRequired())
	bookings.Get("/", d.BookingHandler.GetUserBookings)
	bookings.Post("/", d.BookingHandler.Checkout)
	bookings.Get("/:id", d.BookingHandler.GetByID)

}
