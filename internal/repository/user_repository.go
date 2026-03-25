package repository

import (
	"context"
	"database/sql"

	"booking-bioskop/internal/model"
)

type UserRepository struct {
	db *sql.DB
}

func NewUserRepository(db *sql.DB) *UserRepository {
	return &UserRepository{db: db}
}

func (r *UserRepository) FindByEmail(ctx context.Context, email string) (*model.User, error) {
	user := &model.User{}
	row := r.db.QueryRowContext(ctx,
		`SELECT id, name, email, password, created_at FROM users WHERE email = ?`, email)
	err := row.Scan(&user.ID, &user.Name, &user.Email, &user.Password, &user.CreatedAt)
	if err == sql.ErrNoRows {
		return nil, nil
	}
	return user, err
}

func (r *UserRepository) Create(ctx context.Context, user *model.User) (int64, error) {
	res, err := r.db.ExecContext(ctx,
		`INSERT INTO users (name, email, password) VALUES (?, ?, ?)`,
		user.Name, user.Email, user.Password,
	)
	if err != nil {
		return 0, err
	}
	return res.LastInsertId()
}
