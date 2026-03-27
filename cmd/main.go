package main

import (
	"log"

	"booking-bioskop/internal/config"
	"booking-bioskop/internal/handler"
	"booking-bioskop/internal/middleware"
	"booking-bioskop/internal/repository"
	"booking-bioskop/internal/router"
	"booking-bioskop/internal/service"
	"booking-bioskop/internal/ws"

	"github.com/gofiber/fiber/v2"
	"github.com/gofiber/fiber/v2/middleware/cors"
	"github.com/gofiber/fiber/v2/middleware/logger"
	"github.com/joho/godotenv"
)

func main() {
	// Load .env
	if err := godotenv.Load(); err != nil {
		log.Println("[Main] No .env file found, reading from system environment")
	}

	// Load config
	config.Load()

	// Init DB and Redis
	config.InitDB()
	config.InitRedis()

	// ─── Repositories ───────────────────────────────────────────────────────────
	userRepo := repository.NewUserRepository(config.DB)
	movieRepo := repository.NewMovieRepository(config.DB)
	showtimeRepo := repository.NewShowtimeRepository(config.DB)
	seatRepo := repository.NewSeatRepository(config.DB)
	bookingRepo := repository.NewBookingRepository(config.DB)

	// ─── Services ───────────────────────────────────────────────────────────────
	hub := ws.GlobalHub
	userSvc := service.NewUserService(userRepo)
	movieSvc := service.NewMovieService(movieRepo, showtimeRepo)
	seatSvc := service.NewSeatService(seatRepo, config.Redis, hub)
	bookingSvc := service.NewBookingService(bookingRepo, seatSvc, config.Redis, hub)

	// ─── Handlers ───────────────────────────────────────────────────────────────
	authH := handler.NewAuthHandler(userSvc)
	movieH := handler.NewMovieHandler(movieSvc)
	seatH := handler.NewSeatHandler(seatSvc, movieSvc)
	bookingH := handler.NewBookingHandler(bookingSvc, movieSvc)

	// ─── Fiber App ───────────────────────────────────────────────────────────────
	app := fiber.New(fiber.Config{
		AppName: "Booking Bioskop API v1.0",
	})

	// Global middleware
	app.Use(logger.New())
	app.Use(cors.New(cors.Config{
		AllowOrigins: "*",
		AllowHeaders: "Origin, Content-Type, Accept, Authorization",
		AllowMethods: "GET, POST, PUT, DELETE, OPTIONS",
	}))
	app.Use(middleware.RateLimiter())

	// Register all routes
	router.Setup(app, router.Deps{
		AuthHandler:    authH,
		MovieHandler:   movieH,
		SeatHandler:    seatH,
		BookingHandler: bookingH,
	})

	log.Printf("[Main] Server starting on :%s", config.App.AppPort)
	if err := app.Listen(":" + config.App.AppPort); err != nil {
		log.Fatalf("[Main] Server failed: %v", err)
	}
}
