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
		`SELECT id, name, email, password, role, created_at FROM users WHERE email = ?`, email)
	err := row.Scan(&user.ID, &user.Name, &user.Email, &user.Password, &user.Role, &user.CreatedAt)
	if err == sql.ErrNoRows {
		return nil, nil
	}
	return user, err
}

func (r *UserRepository) Create(ctx context.Context, user *model.User) (int64, error) {
	res, err := r.db.ExecContext(ctx,
		`INSERT INTO users (name, email, password, role) VALUES (?, ?, ?, ?)`,
		user.Name, user.Email, user.Password, user.Role,
	)
	if err != nil {
		return 0, err
	}
	return res.LastInsertId()
}

func (r *UserRepository) FindByID(ctx context.Context, id int64) (*model.User, error) {
	user := &model.User{}
	row := r.db.QueryRowContext(ctx,
		`SELECT id, name, email, password, role, created_at FROM users WHERE id = ?`,
		id)
	err := row.Scan(&user.ID, &user.Name, &user.Email, &user.Password, &user.Role, &user.CreatedAt)
	if err == sql.ErrNoRows {
		return nil, nil
	}
	return user, err
}

func (r *UserRepository) GetAllUsers(ctx context.Context) ([]model.User, error) {
	var users []model.User
	rows, err := r.db.QueryContext(ctx,
		`SELECT id, name, email, password, role, created_at FROM users`)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	for rows.Next() {
		var user model.User
		if err := rows.Scan(&user.ID, &user.Name, &user.Email, &user.Password, &user.Role, &user.CreatedAt); err != nil {
			return nil, err
		}
		users = append(users, user)
	}
	return users, nil
}

func (r *UserRepository) DeleteUser(ctx context.Context, id int64) (int64, error) {
	res, err := r.db.ExecContext(ctx,
		`DELETE FROM users WHERE id = ?`,
		id,
	)
	if err != nil {
		return 0, err
	}
	return res.RowsAffected()
}
