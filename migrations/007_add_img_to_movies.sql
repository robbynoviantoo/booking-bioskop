-- +goose Up
ALTER TABLE movies ADD COLUMN img_url VARCHAR(255);

-- +goose Down
ALTER TABLE movies DROP COLUMN img_url;
