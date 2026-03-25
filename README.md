# 🎬 Booking Bioskop Backend

Backend production-ready untuk sistem pemesanan kursi bioskop secara real-time.

**Stack:** Go (Fiber) · MySQL · Redis (Docker) · WebSocket · JWT

---

## 🏗️ Arsitektur

```
Frontend (Vue/React)
      ↓
 WebSocket (real-time)   &   REST API
      ↓
Backend (Go + Fiber)
      ↓
 ┌─────────────┬──────────────┐
 │    MySQL    │    Redis     │
 │ (data tetap)│ (lock kursi) │
 └─────────────┴──────────────┘
```

---

## 📁 Struktur Project

```
booking-bioskop/
├── cmd/
│   └── main.go                    # Entry point
├── internal/
│   ├── config/
│   │   ├── config.go              # App config loader
│   │   ├── db.go                  # MySQL connection
│   │   └── redis.go               # Redis connection
│   ├── model/                     # Domain structs
│   │   ├── user.go
│   │   ├── movie.go
│   │   ├── showtime.go
│   │   ├── seat.go
│   │   └── booking.go
│   ├── repository/                # Data access layer (raw SQL)
│   │   ├── user_repository.go
│   │   ├── movie_repository.go    # + ShowtimeRepository
│   │   ├── seat_repository.go
│   │   └── booking_repository.go  # Transactional checkout
│   ├── redis/
│   │   └── seat_lock.go           # SetNX lock logic
│   ├── ws/
│   │   ├── hub.go                 # Broadcast hub
│   │   └── client.go              # Per-client handler
│   ├── service/                   # Business logic
│   │   ├── user_service.go        # Bcrypt + JWT
│   │   ├── seat_service.go        # Lock/release/load
│   │   ├── booking_service.go     # Checkout orchestration
│   │   └── movie_service.go       # CRUD movies/showtimes
│   ├── handler/                   # HTTP layer
│   │   ├── auth_handler.go
│   │   ├── movie_handler.go
│   │   ├── seat_handler.go
│   │   └── booking_handler.go
│   ├── middleware/
│   │   └── auth.go                # JWT middleware
│   └── router/
│       └── router.go              # Routes registration
├── migrations/                    # Goose SQL migrations
│   ├── 001_create_users.sql
│   ├── 002_create_movies.sql
│   ├── 003_create_showtimes.sql
│   ├── 004_create_seats.sql
│   └── 005_create_bookings.sql
├── docker-compose.yml             # Redis via Docker
├── .env.example                   # Environment template
└── go.mod
```

---

## 🚀 Setup & Cara Menjalankan

### 1. Persiapan

```bash
# Clone / buka project
cd "d:\Keperluan Sistem\booking-bioskop"

# Copy .env
cp .env.example .env
# Edit .env sesuai konfigurasi MySQL Anda
```

### 2. Jalankan Redis (Docker)

```bash
docker compose up -d
# Verifikasi:
docker ps   # bioskop_redis should be running
```

### 3. Buat Database MySQL

```sql
CREATE DATABASE booking_bioskop CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

### 4. Jalankan Migrasi

```bash
# Install goose CLI (sekali saja)
go install github.com/pressly/goose/v3/cmd/goose@latest

# Jalankan semua migrasi
goose -dir migrations mysql "root:yourpassword@tcp(127.0.0.1:3306)/booking_bioskop?parseTime=true" up
```

### 5. Jalankan Server

```bash
go run cmd/main.go
# Server berjalan di http://localhost:8080
```

---

## 🔌 API Reference

### Auth (Public)

| Method | Endpoint | Body |
|---|---|---|
| POST | `/auth/register` | `{ name, email, password }` |
| POST | `/auth/login` | `{ email, password }` → `{ token, user }` |

### Movies (Public read)

| Method | Endpoint | Keterangan |
|---|---|---|
| GET | `/movies` | List semua film |
| GET | `/movies/:id` | Detail film |
| GET | `/movies/:id/showtimes` | Jadwal tayang film |
| POST | `/movies` | 🔒 Buat film baru |

### Showtimes

| Method | Endpoint | Keterangan |
|---|---|---|
| GET | `/showtimes/:id` | Detail jadwal tayang |
| GET | `/showtimes/:id/seats` | **List kursi + status Redis** |
| POST | `/showtimes` | 🔒 Buat jadwal tayang |

### Seats 🔒 (Perlu JWT)

| Method | Endpoint | Body |
|---|---|---|
| POST | `/seats/lock` | `{ seat_id, showtime_id }` |
| POST | `/seats/release` | `{ seat_id, showtime_id }` |

> ⚠️ `user_id` selalu diambil dari JWT token, **tidak** dari request body.

### Bookings 🔒 (Perlu JWT)

| Method | Endpoint | Body |
|---|---|---|
| POST | `/bookings` | `{ showtime_id, seat_ids: [], total_price }` |
| GET | `/bookings/:id` | Detail booking milik user |

### WebSocket

```
ws://localhost:8080/ws
```

Events yang diterima client:
```json
{ "type": "seat_reserved", "seat_id": 1, "status": "reserved" }
{ "type": "seat_released", "seat_id": 1, "status": "available" }
{ "type": "seat_booked",   "seat_id": 1, "status": "booked" }
```

---

## ⚡ Redis Seat Lock Pattern

```
Key:   seat_lock:{showtime_id}:{seat_id}
Value: {user_id}
TTL:   5 menit (300 detik)

Contoh: seat_lock:10:25 = "3"
→ Showtime 10, Seat 25, di-lock oleh User 3
```

**Lock menggunakan `SET NX`** — atomic, tidak bisa race condition.

---

## 🔄 Flow Checkout (Critical Path)

```
1. POST /seats/lock (untuk setiap kursi yang dipilih)
   → Redis SetNX atomic per seat

2. POST /bookings (checkout)
   → Validasi semua lock milik user ini di Redis
   → BEGIN DB transaction
      → INSERT INTO bookings
      → INSERT INTO booking_seats (per seat)
      → UPDATE seats SET status = 'booked' (per seat)
   → COMMIT
   → DEL semua Redis lock
   → Broadcast seat_booked via WebSocket
```

---

## ⚠️ Edge Cases yang Di-handle

| Kasus | Solusi |
|---|---|
| User close tab tiba-tiba | Redis TTL 5 menit auto-release |
| Double click lock | `SET NX` atomic — hanya 1 yang berhasil |
| Server crash | Redis TTL tetap berjalan independent |
| Race condition checkout | Validasi Redis lock sebelum DB transaksi |
| Banyak user bersamaan | WebSocket broadcast ke semua client |
| User akses booking orang lain | Ownership check di handler |

---

## 🎯 Environment Variables

| Variable | Default | Keterangan |
|---|---|---|
| `APP_PORT` | `8080` | Port server |
| `DB_HOST` | `127.0.0.1` | MySQL host |
| `DB_PORT` | `3306` | MySQL port |
| `DB_USER` | `root` | MySQL user |
| `DB_PASSWORD` | _(kosong)_ | MySQL password |
| `DB_NAME` | `booking_bioskop` | Database name |
| `REDIS_ADDR` | `127.0.0.1:6379` | Redis address |
| `JWT_SECRET` | `change-me` | **Wajib diganti di production** |
| `JWT_EXPIRE_HOURS` | `24` | Durasi token JWT |

---

## 🚀 Cara Extend (Payment Gateway)

Payment gateway (contoh: Midtrans) dapat ditambahkan dengan:

1. **Tambah field** `payment_url` dan `payment_token` di tabel `bookings`
2. **Buat** `internal/service/payment_service.go` dengan integrasi Midtrans SDK
3. **Buat** `POST /bookings/:id/pay` yang memanggil payment service
4. **Webhook** `POST /payments/webhook` untuk update status `pending → paid`
5. **Update** booking status via `PATCH` dan emit WebSocket event `booking_paid`

Tambahkan migration baru:
```sql
-- +goose Up
ALTER TABLE bookings
  ADD COLUMN payment_url   VARCHAR(500) NULL,
  ADD COLUMN payment_token VARCHAR(255) NULL;
```

---

## 📦 Dependencies

| Package | Fungsi |
|---|---|
| `gofiber/fiber/v2` | HTTP Framework |
| `gofiber/websocket/v2` | WebSocket |
| `go-sql-driver/mysql` | MySQL Driver |
| `redis/go-redis/v9` | Redis Client |
| `golang-jwt/jwt/v5` | JWT Auth |
| `golang.org/x/crypto` | Bcrypt |
| `joho/godotenv` | Load .env |
| `pressly/goose/v3` | DB Migration |
