package service

import (
	"context"
	"errors"

	"booking-bioskop/internal/model"
	"booking-bioskop/internal/repository"
)

type MovieService struct {
	movieRepo    *repository.MovieRepository
	showtimeRepo *repository.ShowtimeRepository
}

func NewMovieService(movieRepo *repository.MovieRepository, showtimeRepo *repository.ShowtimeRepository) *MovieService {
	return &MovieService{movieRepo: movieRepo, showtimeRepo: showtimeRepo}
}

func (s *MovieService) GetAll(ctx context.Context) ([]model.Movie, error) {
	return s.movieRepo.FindAll(ctx)
}

func (s *MovieService) GetByID(ctx context.Context, id int64) (*model.Movie, error) {
	m, err := s.movieRepo.FindByID(ctx, id)
	if err != nil {
		return nil, err
	}
	if m == nil {
		return nil, errors.New("movie not found")
	}
	return m, nil
}

func (s *MovieService) Create(ctx context.Context, title string) (*model.Movie, error) {
	id, err := s.movieRepo.Create(ctx, title)
	if err != nil {
		return nil, err
	}
	return &model.Movie{ID: id, Title: title}, nil
}

func (s *MovieService) GetShowtimes(ctx context.Context, movieID int64) ([]model.Showtime, error) {
	return s.showtimeRepo.FindByMovie(ctx, movieID)
}

func (s *MovieService) GetShowtimeByID(ctx context.Context, id int64) (*model.Showtime, error) {
	st, err := s.showtimeRepo.FindByIDWithMovie(ctx, id)
	if err != nil {
		return nil, err
	}
	if st == nil {
		return nil, errors.New("showtime not found")
	}
	return st, nil
}

func (s *MovieService) CreateShowtime(ctx context.Context, req model.CreateShowtimeRequest) (*model.Showtime, error) {
	// Verify movie exists
	m, err := s.movieRepo.FindByID(ctx, req.MovieID)
	if err != nil {
		return nil, err
	}
	if m == nil {
		return nil, errors.New("movie not found")
	}

	id, err := s.showtimeRepo.Create(ctx, req)
	if err != nil {
		return nil, err
	}
	return &model.Showtime{ID: id, MovieID: req.MovieID, ShowTime: req.ShowTime, Movie: m}, nil
}
