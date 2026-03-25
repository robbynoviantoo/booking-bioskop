-- +goose Up
-- +goose StatementBegin
CREATE TABLE IF NOT EXISTS seats (
    id          BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    showtime_id BIGINT UNSIGNED NOT NULL,
    seat_number VARCHAR(10)     NOT NULL,
    status      ENUM('available','booked') NOT NULL DEFAULT 'available',
    PRIMARY KEY (id),
    UNIQUE KEY uq_seat_showtime (showtime_id, seat_number),
    CONSTRAINT fk_seat_showtime FOREIGN KEY (showtime_id) REFERENCES showtimes (id) ON DELETE CASCADE
);
-- +goose StatementEnd

-- +goose Down
DROP TABLE IF EXISTS seats;
