package middleware

import (
	"time"

	"booking-bioskop/internal/config"

	"github.com/gofiber/fiber/v2"
	"github.com/gofiber/fiber/v2/middleware/limiter"
	"github.com/gofiber/storage/redis/v3"
)

func RateLimiter() fiber.Handler {
	// Initialize custom storage using existing Redis configuration
	// We use the same address as initialized in config.InitRedis
	store := redis.New(redis.Config{
		URL:      "redis://" + config.App.RedisAddr,
		Password: config.App.RedisPassword,
		Database: config.App.RedisDB,
	})

	return limiter.New(limiter.Config{
		Max:        50,               // Limit: 50 requests
		Expiration: 10 * time.Second, // Per 10 seconds
		KeyGenerator: func(c *fiber.Ctx) string {
			return c.IP()
		},
		LimitReached: func(c *fiber.Ctx) error {
			return c.Status(fiber.StatusTooManyRequests).JSON(fiber.Map{
				"status":  "error",
				"message": "Too many requests. Please try again after 10 seconds.",
			})
		},
		Storage: store,
	})
}
