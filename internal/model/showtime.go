package model

import "time"

type Showtime struct {
	ID       int64     `json:"id"`
	MovieID  int64     `json:"movie_id"`
	ShowTime time.Time `json:"show_time"`
	Movie    *Movie    `json:"movie,omitempty"`
}

type CreateShowtimeRequest struct {
	MovieID  int64     `json:"movie_id"`
	ShowTime time.Time `json:"show_time"`
}
