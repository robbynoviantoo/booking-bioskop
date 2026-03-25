package model

type Movie struct {
	ID    int64  `json:"id"`
	Title string `json:"title"`
}

type CreateMovieRequest struct {
	Title string `json:"title"`
}
