package model

type Movie struct {
	ID     int64  `json:"id"`
	Title  string `json:"title"`
	ImgURL string `json:"img_url"`
}

type CreateMovieRequest struct {
	Title  string `json:"title"`
	ImgURL string `json:"img_url"`
}
