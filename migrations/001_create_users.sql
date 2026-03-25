-- +goose Up
-- +goose StatementBegin
CREATE TABLE IF NOT EXISTS users (
    id         BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    name       VARCHAR(100)    NOT NULL,
    email      VARCHAR(255)    NOT NULL UNIQUE,
    password   VARCHAR(255)    NOT NULL,
    created_at DATETIME        NOT NULL DEFAULT NOW(),
    PRIMARY KEY (id)
);
-- +goose StatementEnd

-- +goose Down
DROP TABLE IF EXISTS users;
