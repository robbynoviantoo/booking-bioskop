# 🎬 Aplikasi Booking Bioskop

Selamat datang di repositori pembelajaran **Booking Bioskop**! Aplikasi ini dirancang tidak hanya untuk berfungsi secara *real-time*, tetapi juga sebagai studi kasus nyata bagaimana membangun backend yang kuat (production-ready) menggunakan **Golang** (Fiber), **React** (Vite), **MySQL**, dan **Redis**.

Dokumen ini ditulis secara khusus agar Anda bisa mempelajari **"logic berpikir"** dan urutan cara membuat sistem dari nol.

---

## 🏗️ 1. Arsitektur: "Clean Architecture"
Backend di proyek ini menggunakan prinsip **Clean Architecture**. Tujuannya agar kode rapi, mudah dites, dan jika ada perubahan (misalnya ganti database MySQL ke PostgreSQL), kita tidak perlu merombak seluruh aplikasi.

Struktur folder terbagi dalam 4 lapisan "bawang" dari yang paling dalam (Database) hingga yang paling luar (Router HTTP):

1. **Layer Database & Model (`internal/model`)**
   Layer paling inti. Hanya berisi definisi bentuk data (`struct`). Tidak ada logika pemrograman di sini. Model adalah representasi dari tabel MySQL.

2. **Layer Akses Data (`internal/repository`)**
   Layer penambang data. **HANYA** file di folder ini yang boleh menulis bahasa SQL (`SELECT`, `INSERT`, dll).
   *Contoh:* `seat_repository.go` bertugas mengambil data kursi dari MariaDB/MySQL.

3. **Layer Otak/Business Logic (`internal/service`)**
   Layer pusat pemikiran. Layer ini tidak tahu-menahu soal "Fiber" atau "HTTP". Ia hanya berisi aturan bisnis.
   *Contoh:* Di `booking_service.go`, otak kita berpikir: *"Sebelum checkout, cek dulu di Redis apakah kursi masih punya user ini. Jika iya, tulis ke Database. Jika sukses, hapus kunci Redis, lalu umumkan ke ruangan WebSocket."*

4. **Layer Penerima Tamu (`internal/handler`)**
   Layer komunikasi. Bertugas membaca Request dari React (JSON), memberikannya kepada *Service* (Otak), lalu membungkus hasil dari *Service* menjadi API JSON Response (contoh: 200 OK, 400 Bad Request) untuk React.

---

## 🧠 2. Logic Berpikir Fitur Utama: "Booking Kursi"
Masalah tersulit di aplikasi bioskop adalah: **Rebutan Kursi**. Bagaimana jika 2 orang memencet tombol "Pesan" di kursi A1 pada milidetik yang sama persis?

Pendekatan kita menggunakan **3 Lapis Proteksi**:

### Lapis 1: Lock Sementara (Redis)
Saat user menekan ("Klik") kursi, frontend memanggil `POST /seats/lock`.
1. Backend memakai Redis `SET NX` (Set if Not eXists) dengan TTL (Timeout) 5 menit.
2. Jika kursi `A1` sudah terkunci (misal di-lock oleh User B), perintah ini akan otomatis ditolak oleh Redis.
3. User A mendapat kursi `A1`. Kita simpan di Redis: `"seat_lock:1:A1" = userID_A`.

### Lapis 2: Real-time Update (WebSocket)
Begitu User A sukses mengunci di Redis:
1. Backend merespon sukses.
2. Backend berteriak via WebSocket ke SEMUA orang yang sedang buka halaman tersebut: *"Woy, kursi A1 baru saja di-reserve!"*
3. Di HP milik User B, kursi A1 akan langsung berubah warna kuning (secara ajaib) tanpa perlu me-refresh halaman!

### Lapis 3: Transaksi Permanen (MySQL Database)
Saat User A menekan **"Bayar Sekarang"** (`POST /bookings`):
1. **Verifikasi:** Backend mencocokkan, *"Apakah kunci Redis untuk kursi A1 benar-benar milik User A?"*. (Mencegah Hacker mem-bypass Checkout).
2. **Database Transaction:** Kita memulai `db.BeginTx()`. Ini fitur SQL supaya aktivitas Insert Data dilakukan dalam 1 paket kedap udara.
3. Masukkan data ke tabel `bookings`.
4. Masukkan data ke tabel `booking_seats`.
5. Ubah tabel `seats` menjadi `status = 'booked'`.
6. Jika di langkah ke-3, 4, atau 5 terjadi error (listrik mati, DB penuh), semuanya akan di-*Rollback* (dibatalkan) seolah tak pernah terjadi.
7. Hapus kunci di Redis karena sudah permanen di MySQL.
8. Berteriak lagi via WebSocket: *"Kursi A1 sekarang TERJUAL!"* (Merah).

---

## 🚀 3. Urutan Pembuatan Aplikasi
Jika Anda ingin mencoba membuat proyek sejenis, ikuti urutan "Membangun dari Dalam ke Luar" seperti ini:

1. **Desain Database (`migrations/`)**
   Pikirkan relasi datanya. *Movies punya banyak Showtimes. Showtimes punya banyak Seats.* Buat skema SQL-nya.
2. **Setup Koneksi (`internal/config/`)**
   Buat kode untuk membuka koneksi MySQL dan Redis yang membaca rahasia dari `.env`.
3. **Bikin Repositories (`internal/repository/`)**
   Tulis kueri-kueri rakitan (Mencari email user, Insert booking). Uji coba pastikan tidak salah ketik (typo) SQL.
4. **Bikin Services (`internal/service/`)**
   Lakukan validasi data. Misalnya, cek `bcrypt` saat login JWT. Inject repository ke dalam service.
5. **Bikin Handlers (`internal/handler/`)**
   Ambil `fiber.Ctx`. Parse data JSON, lalu panggil Service.
6. **Buka Pintunya (`internal/router/` & `cmd/main.go`)**
   Sambungkan alamat URL (seperti `/movies`) ke Handlers terkait.
7. **Frontend (React)**
   Buat desain antarmuka penggunanya, dan gunakan fungsi seperti *Axios/fetch* untuk berbicara dengan URL di atas.

---

## 👮 4. Sistem Role (JWT Middleware)
Untuk membedakan Orang Biasa dan Admin:
1. Saat user berhasil login, server memasukkan **Role** ("user" atau "admin") ke dalam tiket rahasia bernama **JWT (JSON Web Token)**.
2. Tiket JWT ini ditaruh di saku Frontend.
3. Setiap kali React meminta akses (Misal: memanggil API Tambah Film), React wajib menyodorkan tiket JWT tersebut di Header (`Authorization: Bearer <token>`).
4. Di pintu backend, satpam kita bernama **`AuthRequired`** membongkar isi tiket JWT-nya.
5. Jika halamannya bersifat Rahasia Admin, berlapis dengan satpam kedua: **`AdminRequired`** yang akan menolak masuk jika isi tiketnya bukan `"admin"`.

---

## 📦 5. Cara Menjalankan Project

1. Pastikan Anda punya MySQL Server, Redis (via Docker: `docker compose up -d`), dan Go Terinstall.
2. Buat database: `CREATE DATABASE booking_bioskop;`
3. Aktifkan tabel DB otomatis menggunakan Goose CLI atau import manual melalui folder `migrations/`.
4. Sesuaikan credential di `.env`.
5. Buka 2 terminal:
   - Terminal 1 (Backend Backend): 
     ```bash
     go mod tidy
     go run cmd/main.go
     ```
   - Terminal 2 (Frontend React):
     ```bash
     cd frontend
     npm install
     npm run dev
     ```
6. Buka browser: `http://localhost:5173`.
7. **Untuk Coba Admin:** Buka MySQL / HeidiSQL, ubah role di tabel Anda (klik manual): `UPDATE users SET role = 'admin' ...` lalu re-login di browser.

Selamat belajar! Kode ini ditulis setransparan mungkin. Baca dari `cmd/main.go` pelan-pelan ke bawah, dan Anda akan menguasai seninya! 🍿
