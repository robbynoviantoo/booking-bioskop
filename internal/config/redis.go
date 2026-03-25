package config

import (
	"context"
	"log"

	"github.com/redis/go-redis/v9"
)

var Redis *redis.Client

func InitRedis() {
	rdb := redis.NewClient(&redis.Options{
		Addr:     App.RedisAddr,
		Password: App.RedisPassword,
		DB:       App.RedisDB,
	})

	ctx := context.Background()
	if _, err := rdb.Ping(ctx).Result(); err != nil {
		log.Fatalf("[Redis] Failed to connect: %v", err)
	}

	Redis = rdb
	log.Println("[Redis] Connected successfully")
}
