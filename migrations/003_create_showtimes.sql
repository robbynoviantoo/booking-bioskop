-- +goose Up
-- +goose StatementBegin
CREATE TABLE IF NOT EXISTS showtimes (
    id        BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    movie_id  BIGINT UNSIGNED NOT NULL,
    show_time DATETIME        NOT NULL,
    PRIMARY KEY (id),
    CONSTRAINT fk_showtime_movie FOREIGN KEY (movie_id) REFERENCES movies (id) ON DELETE CASCADE
);
-- +goose StatementEnd

-- +goose Down
DROP TABLE IF EXISTS showtimes;
