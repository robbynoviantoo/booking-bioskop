package redislock

import (
	"context"
	"fmt"
	"strconv"
	"time"

	"github.com/redis/go-redis/v9"
)

const lockTTL = 5 * time.Minute

func seatKey(showtimeID, seatID int64) string {
	return fmt.Sprintf("seat_lock:%d:%d", showtimeID, seatID)
}

// LockSeat atomically locks a seat for a user using SET NX.
// Returns false if seat is already locked by another user.
func LockSeat(ctx context.Context, rdb *redis.Client, showtimeID, seatID, userID int64) (bool, error) {
	key := seatKey(showtimeID, seatID)
	ok, err := rdb.SetNX(ctx, key, userID, lockTTL).Result()
	return ok, err
}

// ReleaseSeat removes a seat lock. Only releases if lock belongs to the user.
func ReleaseSeat(ctx context.Context, rdb *redis.Client, showtimeID, seatID, userID int64) error {
	key := seatKey(showtimeID, seatID)
	val, err := rdb.Get(ctx, key).Result()
	if err == redis.Nil {
		return nil // already gone, that's fine
	}
	if err != nil {
		return err
	}
	if val == strconv.FormatInt(userID, 10) {
		return rdb.Del(ctx, key).Err()
	}
	return fmt.Errorf("seat is locked by another user")
}

// GetSeatLock returns the user_id holding the lock, or 0 if not locked.
func GetSeatLock(ctx context.Context, rdb *redis.Client, showtimeID, seatID int64) (int64, error) {
	key := seatKey(showtimeID, seatID)
	val, err := rdb.Get(ctx, key).Result()
	if err == redis.Nil {
		return 0, nil
	}
	if err != nil {
		return 0, err
	}
	uid, err := strconv.ParseInt(val, 10, 64)
	return uid, err
}

// ReleaseAllSeats removes all locks for a list of seats (called after successful checkout).
func ReleaseAllSeats(ctx context.Context, rdb *redis.Client, showtimeID int64, seatIDs []int64) error {
	keys := make([]string, len(seatIDs))
	for i, sid := range seatIDs {
		keys[i] = seatKey(showtimeID, sid)
	}
	return rdb.Del(ctx, keys...).Err()
}
