-- +goose Up
-- +goose StatementBegin
CREATE TABLE IF NOT EXISTS bookings (
    id          BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    user_id     BIGINT UNSIGNED NOT NULL,
    showtime_id BIGINT UNSIGNED NOT NULL,
    total_price INT             NOT NULL DEFAULT 0,
    status      ENUM('pending','paid','cancelled') NOT NULL DEFAULT 'pending',
    created_at  DATETIME        NOT NULL DEFAULT NOW(),
    PRIMARY KEY (id),
    CONSTRAINT fk_booking_user     FOREIGN KEY (user_id)     REFERENCES users (id),
    CONSTRAINT fk_booking_showtime FOREIGN KEY (showtime_id) REFERENCES showtimes (id)
);
-- +goose StatementEnd

-- +goose StatementBegin
CREATE TABLE IF NOT EXISTS booking_seats (
    id         BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    booking_id BIGINT UNSIGNED NOT NULL,
    seat_id    BIGINT UNSIGNED NOT NULL,
    PRIMARY KEY (id),
    UNIQUE KEY uq_booking_seat (booking_id, seat_id),
    CONSTRAINT fk_bs_booking FOREIGN KEY (booking_id) REFERENCES bookings (id) ON DELETE CASCADE,
    CONSTRAINT fk_bs_seat    FOREIGN KEY (seat_id)    REFERENCES seats (id) ON DELETE CASCADE
);
-- +goose StatementEnd

-- +goose Down
DROP TABLE IF EXISTS booking_seats;
DROP TABLE IF EXISTS bookings;
