# 📡 API Documentation — Booking Bioskop

> **Base URL:** `http://localhost:8080`  
> **Format:** JSON (`Content-Type: application/json`)  
> **Auth:** JWT Bearer Token di header `Authorization`

---

## 🔐 Authentication

### POST `/auth/register`
Daftar akun baru.

**Request Body**
```json
{
  "name": "Budi Santoso",
  "email": "budi@email.com",
  "password": "password123"
}
```

**Response `201 Created`**
```json
{
  "id": 1,
  "name": "Budi Santoso",
  "email": "budi@email.com",
  "created_at": "2026-03-25T07:00:00Z"
}
```

**Error `409 Conflict`** — email sudah terdaftar
```json
{ "error": "email already registered" }
```

---

### POST `/auth/login`
Login dan dapatkan JWT token.

**Request Body**
```json
{
  "email": "budi@email.com",
  "password": "password123"
}
```

**Response `200 OK`**
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": 1,
    "name": "Budi Santoso",
    "email": "budi@email.com",
    "created_at": "2026-03-25T07:00:00Z"
  }
}
```

**Error `401 Unauthorized`** — email/password salah
```json
{ "error": "invalid email or password" }
```

> 💡 Simpan `token` di `localStorage` / state management. Gunakan untuk semua endpoint 🔒.

---

## 🎬 Movies

### GET `/movies`
List semua film.

**Response `200 OK`**
```json
[
  { "id": 1, "title": "Avengers: Endgame" },
  { "id": 2, "title": "Interstellar" }
]
```

---

### GET `/movies/:id`
Detail satu film.

**Response `200 OK`**
```json
{ "id": 1, "title": "Avengers: Endgame" }
```

**Error `404`**
```json
{ "error": "movie not found" }
```

---

### GET `/movies/:id/showtimes`
Daftar jadwal tayang untuk film tertentu.

**Response `200 OK`**
```json
[
  { "id": 10, "movie_id": 1, "show_time": "2026-03-25T14:00:00Z" },
  { "id": 11, "movie_id": 1, "show_time": "2026-03-25T17:00:00Z" }
]
```

---

### POST `/movies` 🔒
Buat film baru (hanya admin).

**Headers**
```
Authorization: Bearer <token>
```

**Request Body**
```json
{ "title": "Oppenheimer" }
```

**Response `201 Created`**
```json
{ "id": 3, "title": "Oppenheimer" }
```

---

## 🕒 Showtimes

### GET `/showtimes/:id`
Detail jadwal tayang + info film.

**Response `200 OK`**
```json
{
  "id": 10,
  "movie_id": 1,
  "show_time": "2026-03-25T14:00:00Z",
  "movie": {
    "id": 1,
    "title": "Avengers: Endgame"
  }
}
```

---

### POST `/showtimes` 🔒
Buat jadwal tayang baru.

**Headers**
```
Authorization: Bearer <token>
```

**Request Body**
```json
{
  "movie_id": 1,
  "show_time": "2026-03-26T19:00:00Z"
}
```

**Response `201 Created`**
```json
{
  "id": 12,
  "movie_id": 1,
  "show_time": "2026-03-26T19:00:00Z",
  "movie": { "id": 1, "title": "Avengers: Endgame" }
}
```

---

## 💺 Seats

### GET `/showtimes/:id/seats`
List semua kursi untuk jadwal tayang tertentu.  
Status kursi sudah di-merge dengan data Redis (real-time).

**Response `200 OK`**
```json
[
  { "id": 1, "showtime_id": 10, "seat_number": "A1", "status": "available" },
  { "id": 2, "showtime_id": 10, "seat_number": "A2", "status": "reserved", "locked_by": 3 },
  { "id": 3, "showtime_id": 10, "seat_number": "A3", "status": "booked" }
]
```

**Status Values:**
| Status | Keterangan |
|---|---|
| `available` | Bisa dipilih |
| `reserved` | Sedang dipilih user lain (lock Redis, TTL 5 menit) |
| `booked` | Sudah dibayar/dipesan permanen |

---

### POST `/seats/lock` 🔒
Kunci kursi (saat user klik pilih kursi).

**Headers**
```
Authorization: Bearer <token>
```

**Request Body**
```json
{
  "seat_id": 1,
  "showtime_id": 10
}
```

> ⚠️ `user_id` otomatis diambil dari JWT — jangan kirim di body.

**Response `200 OK`**
```json
{ "message": "seat locked successfully" }
```

**Error `409 Conflict`** — sudah di-lock user lain
```json
{ "error": "seat is already reserved by another user" }
```

**Error `409 Conflict`** — sudah dibooking
```json
{ "error": "seat is already booked" }
```

---

### POST `/seats/release` 🔒
Lepas kunci kursi (saat user batal pilih).

**Headers**
```
Authorization: Bearer <token>
```

**Request Body**
```json
{
  "seat_id": 1,
  "showtime_id": 10
}
```

**Response `200 OK`**
```json
{ "message": "seat released successfully" }
```

---

## 🎟️ Bookings

### POST `/bookings` 🔒
Checkout — konfirmasi dan buat booking.

> ⚠️ Semua kursi di `seat_ids` **harus sudah di-lock** oleh user ini terlebih dahulu via `POST /seats/lock`, jika tidak akan error.

**Headers**
```
Authorization: Bearer <token>
```

**Request Body**
```json
{
  "showtime_id": 10,
  "seat_ids": [1, 2],
  "total_price": 100000
}
```

**Response `201 Created`**
```json
{
  "id": 55,
  "user_id": 3,
  "showtime_id": 10,
  "total_price": 100000,
  "status": "pending",
  "created_at": "2026-03-25T07:55:00Z",
  "seats": [
    { "id": 1, "showtime_id": 10, "seat_number": "A1", "status": "booked" },
    { "id": 2, "showtime_id": 10, "seat_number": "A2", "status": "booked" }
  ]
}
```

**Error `409 Conflict`** — lock expired atau bukan milik user
```json
{ "error": "seat 1 is not locked (lock may have expired)" }
```

---

### GET `/bookings/:id` 🔒
Detail booking milik user yang sedang login.

**Headers**
```
Authorization: Bearer <token>
```

**Response `200 OK`**
```json
{
  "id": 55,
  "user_id": 3,
  "showtime_id": 10,
  "total_price": 100000,
  "status": "pending",
  "created_at": "2026-03-25T07:55:00Z",
  "seats": [
    { "id": 1, "showtime_id": 10, "seat_number": "A1", "status": "booked" }
  ]
}
```

**Error `403 Forbidden`** — bukan booking milik user ini
```json
{ "error": "access denied" }
```

---

## 🔌 WebSocket

### Koneksi

```
ws://localhost:8080/ws
```

Tidak perlu auth untuk connect (bisa ditambahkan di masa depan).

**Contoh JavaScript:**
```javascript
const ws = new WebSocket('ws://localhost:8080/ws')

ws.onmessage = (event) => {
  const data = JSON.parse(event.data)
  console.log(data)
  // { "type": "seat_reserved", "seat_id": 1, "status": "reserved" }
}
```

### Events dari Server

| Event | Trigger | Payload |
|---|---|---|
| `seat_reserved` | User klik pilih kursi | `{ type, seat_id, status: "reserved" }` |
| `seat_released` | User batal / TTL expired | `{ type, seat_id, status: "available" }` |
| `seat_booked` | Checkout berhasil | `{ type, seat_id, status: "booked" }` |

**Contoh Payload:**
```json
{ "type": "seat_reserved", "seat_id": 5, "status": "reserved" }
{ "type": "seat_released", "seat_id": 5, "status": "available" }
{ "type": "seat_booked",   "seat_id": 5, "status": "booked" }
```

> 💡 Gunakan event ini untuk **update tampilan kursi secara real-time** tanpa perlu refresh atau polling.

---

## 🔑 Cara Gunakan Auth Header

Untuk setiap endpoint yang 🔒, tambahkan header:

```
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Contoh fetch JavaScript:**
```javascript
const token = localStorage.getItem('token')

const res = await fetch('http://localhost:8080/seats/lock', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  },
  body: JSON.stringify({ seat_id: 1, showtime_id: 10 })
})
```

---

## 📋 Alur Lengkap Frontend

```
1. POST /auth/login           → simpan token

2. GET  /movies               → tampilkan list film

3. GET  /movies/:id/showtimes → tampilkan jadwal

4. GET  /showtimes/:id/seats  → tampilkan peta kursi
   - connect WebSocket        → update real-time

5. POST /seats/lock (per kursi dipilih)
   → kursi berubah jadi "reserved"
   → WebSocket broadcast ke semua user

6. POST /bookings (checkout)
   → validasi lock di Redis
   → commit ke DB
   → WebSocket broadcast seat_booked

7. GET  /bookings/:id         → tampilkan tiket
```

---

## ⚠️ Error Response Format

Semua error menggunakan format yang konsisten:

```json
{ "error": "pesan error di sini" }
```

| HTTP Code | Artinya |
|---|---|
| `400` | Request body invalid / field kurang |
| `401` | Token tidak ada / expired |
| `403` | Akses ditolak (bukan milik user) |
| `404` | Data tidak ditemukan |
| `409` | Conflict (kursi sudah locked/booked, dll) |
| `500` | Server error |
