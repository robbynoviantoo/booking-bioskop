package repository

import (
	"context"
	"database/sql"

	"booking-bioskop/internal/model"
)

type MovieRepository struct {
	db *sql.DB
}

func NewMovieRepository(db *sql.DB) *MovieRepository {
	return &MovieRepository{db: db}
}

func (r *MovieRepository) FindAll(ctx context.Context) ([]model.Movie, error) {
	rows, err := r.db.QueryContext(ctx, `SELECT id, title, COALESCE(img_url, '') FROM movies ORDER BY id`)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var movies []model.Movie
	for rows.Next() {
		var m model.Movie
		if err := rows.Scan(&m.ID, &m.Title, &m.ImgURL); err != nil {
			return nil, err
		}
		movies = append(movies, m)
	}
	return movies, rows.Err()
}

func (r *MovieRepository) FindByID(ctx context.Context, id int64) (*model.Movie, error) {
	m := &model.Movie{}
	err := r.db.QueryRowContext(ctx, `SELECT id, title, COALESCE(img_url, '') FROM movies WHERE id = ?`, id).
		Scan(&m.ID, &m.Title, &m.ImgURL)
	if err == sql.ErrNoRows {
		return nil, nil
	}
	return m, err
}

func (r *MovieRepository) Create(ctx context.Context, title string, imgURL string) (int64, error) {
	res, err := r.db.ExecContext(ctx, `INSERT INTO movies (title, img_url) VALUES (?, ?)`, title, imgURL)
	if err != nil {
		return 0, err
	}
	return res.LastInsertId()
}

// ----- Showtimes (co-located for simplicity) -----

type ShowtimeRepository struct {
	db *sql.DB
}

func NewShowtimeRepository(db *sql.DB) *ShowtimeRepository {
	return &ShowtimeRepository{db: db}
}

func (r *ShowtimeRepository) FindByID(ctx context.Context, id int64) (*model.Showtime, error) {
	st := &model.Showtime{}
	err := r.db.QueryRowContext(ctx,
		`SELECT s.id, s.movie_id, s.show_time, m.title
		 FROM showtimes s JOIN movies m ON m.id = s.movie_id
		 WHERE s.id = ?`, id).
		Scan(&st.ID, &st.MovieID, &st.ShowTime, new(string))
	if err == sql.ErrNoRows {
		return nil, nil
	}
	return st, err
}

func (r *ShowtimeRepository) FindByIDWithMovie(ctx context.Context, id int64) (*model.Showtime, error) {
	st := &model.Showtime{Movie: &model.Movie{}}
	err := r.db.QueryRowContext(ctx,
		`SELECT s.id, s.movie_id, s.show_time, m.id, m.title
		 FROM showtimes s JOIN movies m ON m.id = s.movie_id
		 WHERE s.id = ?`, id).
		Scan(&st.ID, &st.MovieID, &st.ShowTime, &st.Movie.ID, &st.Movie.Title)
	if err == sql.ErrNoRows {
		return nil, nil
	}
	return st, err
}

func (r *ShowtimeRepository) FindByMovie(ctx context.Context, movieID int64) ([]model.Showtime, error) {
	rows, err := r.db.QueryContext(ctx,
		`SELECT id, movie_id, show_time FROM showtimes WHERE movie_id = ? ORDER BY show_time`, movieID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var list []model.Showtime
	for rows.Next() {
		var st model.Showtime
		if err := rows.Scan(&st.ID, &st.MovieID, &st.ShowTime); err != nil {
			return nil, err
		}
		list = append(list, st)
	}
	return list, rows.Err()
}

func (r *ShowtimeRepository) Create(ctx context.Context, req model.CreateShowtimeRequest) (int64, error) {
	res, err := r.db.ExecContext(ctx,
		`INSERT INTO showtimes (movie_id, show_time) VALUES (?, ?)`,
		req.MovieID, req.ShowTime,
	)
	if err != nil {
		return 0, err
	}
	return res.LastInsertId()
}
