-- +goose Up
-- +goose StatementBegin
CREATE TABLE IF NOT EXISTS movies (
    id    BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    title VARCHAR(255)    NOT NULL,
    PRIMARY KEY (id)
);
-- +goose StatementEnd

-- +goose Down
DROP TABLE IF EXISTS movies;
