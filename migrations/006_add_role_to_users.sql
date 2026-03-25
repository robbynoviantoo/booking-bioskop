-- +goose Up
ALTER TABLE users ADD COLUMN role ENUM('user', 'admin') NOT NULL DEFAULT 'user';

-- +goose Down
ALTER TABLE users DROP COLUMN role;
