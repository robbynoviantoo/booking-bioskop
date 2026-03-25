import { useEffect, useState } from 'react';
import { Film, Clock, Plus, CheckCircle, Armchair } from 'lucide-react';
import api from '../lib/api';
import { useToast } from '../contexts/ToastContext';
import type { Movie, Showtime } from '../types';
import './AdminPage.css';

const ROWS_OPTIONS = ['A','B','C','D','E','F','G','H'];

export default function AdminPage() {
  const { toast } = useToast();

  // Movies
  const [movies, setMovies] = useState<Movie[]>([]);
  const [movieTitle, setMovieTitle] = useState('');
  const [savingMovie, setSavingMovie] = useState(false);

  // Showtimes
  const [showtimes, setShowtimes] = useState<Showtime[]>([]);
  const [selectedMovieId, setSelectedMovieId] = useState('');
  const [showDateTime, setShowDateTime] = useState('');
  const [savingShowtime, setSavingShowtime] = useState(false);

  // Seats
  const [selectedShowtimeId, setSelectedShowtimeId] = useState('');
  const [selectedRows, setSelectedRows] = useState<string[]>(['A','B','C']);
  const [seatsPerRow, setSeatsPerRow] = useState(8);
  const [savingSeats, setSavingSeats] = useState(false);

  const loadMovies = () => api.get('/movies').then(r => setMovies(r.data || []));
  const loadShowtimes = (movieId: string) => {
    if (!movieId) return;
    api.get(`/movies/${movieId}/showtimes`).then(r => setShowtimes(r.data || []));
  };

  useEffect(() => { loadMovies(); }, []);
  useEffect(() => { loadShowtimes(selectedMovieId); }, [selectedMovieId]);

  // Add Movie
  const addMovie = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!movieTitle.trim()) return;
    setSavingMovie(true);
    try {
      await api.post('/movies', { title: movieTitle });
      toast('success', `Film "${movieTitle}" berhasil ditambahkan!`);
      setMovieTitle('');
      loadMovies();
    } catch (err: any) {
      toast('error', err.response?.data?.error || 'Gagal tambah film');
    } finally { setSavingMovie(false); }
  };

  // Add Showtime
  const addShowtime = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedMovieId || !showDateTime) return;
    setSavingShowtime(true);
    try {
      await api.post('/showtimes', { movie_id: Number(selectedMovieId), show_time: new Date(showDateTime).toISOString() });
      toast('success', 'Jadwal berhasil ditambahkan!');
      setShowDateTime('');
      loadShowtimes(selectedMovieId);
    } catch (err: any) {
      toast('error', err.response?.data?.error || 'Gagal tambah jadwal');
    } finally { setSavingShowtime(false); }
  };

  // Add Seats
  const addSeats = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedShowtimeId || selectedRows.length === 0) return;
    setSavingSeats(true);
    try {
      await api.post(`/showtimes/${selectedShowtimeId}/seats`, { rows: selectedRows, seats_per_row: seatsPerRow });
      toast('success', `${selectedRows.length * seatsPerRow} kursi berhasil dibuat!`);
      setSelectedShowtimeId('');
    } catch (err: any) {
      toast('error', err.response?.data?.error || 'Gagal buat kursi');
    } finally { setSavingSeats(false); }
  };

  const toggleRow = (r: string) =>
    setSelectedRows(prev => prev.includes(r) ? prev.filter(x => x !== r) : [...prev, r].sort());

  return (
    <div className="admin-page page-enter">
      <div className="container">
        <div className="admin-header">
          <h1 className="admin-title">⚙️ Panel Admin</h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
            Kelola film, jadwal, dan kursi bioskop
          </p>
        </div>

        <div className="admin-grid">

          {/* ── Add Movie ── */}
          <section className="admin-card card">
            <div className="admin-card-header">
              <Film size={20} className="admin-icon" />
              <h2 className="admin-card-title">Tambah Film</h2>
            </div>
            <form onSubmit={addMovie} className="admin-form">
              <div className="form-group">
                <label className="label">Judul Film</label>
                <input
                  className="input-field"
                  placeholder="Contoh: Inception"
                  value={movieTitle}
                  onChange={e => setMovieTitle(e.target.value)}
                  required
                />
              </div>
              <button className="btn btn-primary" type="submit" disabled={savingMovie}>
                <Plus size={16} /> {savingMovie ? 'Menyimpan...' : 'Tambah Film'}
              </button>
            </form>

            {/* Movie list */}
            {movies.length > 0 && (
              <div className="admin-list">
                <p className="admin-list-title">Film Terdaftar ({movies.length})</p>
                {movies.map(m => (
                  <div key={m.id} className="admin-list-item">
                    <Film size={14} style={{ color: 'var(--accent-light)' }} />
                    {m.title}
                  </div>
                ))}
              </div>
            )}
          </section>

          {/* ── Add Showtime ── */}
          <section className="admin-card card">
            <div className="admin-card-header">
              <Clock size={20} className="admin-icon" />
              <h2 className="admin-card-title">Tambah Jadwal Tayang</h2>
            </div>
            <form onSubmit={addShowtime} className="admin-form">
              <div className="form-group">
                <label className="label">Pilih Film</label>
                <select
                  className="input-field"
                  value={selectedMovieId}
                  onChange={e => setSelectedMovieId(e.target.value)}
                  required
                >
                  <option value="">-- Pilih Film --</option>
                  {movies.map(m => <option key={m.id} value={m.id}>{m.title}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label className="label">Tanggal & Waktu Tayang</label>
                <input
                  type="datetime-local"
                  className="input-field"
                  value={showDateTime}
                  onChange={e => setShowDateTime(e.target.value)}
                  required
                />
              </div>
              <button className="btn btn-primary" type="submit" disabled={savingShowtime || !selectedMovieId}>
                <Plus size={16} /> {savingShowtime ? 'Menyimpan...' : 'Tambah Jadwal'}
              </button>
            </form>

            {/* Showtime list */}
            {showtimes.length > 0 && (
              <div className="admin-list">
                <p className="admin-list-title">Jadwal ({showtimes.length})</p>
                {showtimes.map(st => (
                  <div key={st.id} className="admin-list-item">
                    <Clock size={13} style={{ color: 'var(--accent-light)' }} />
                    {new Date(st.show_time).toLocaleString('id-ID', { weekday: 'short', day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                    <span style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>ID: {st.id}</span>
                  </div>
                ))}
              </div>
            )}
          </section>

          {/* ── Add Seats ── */}
          <section className="admin-card card admin-card-full">
            <div className="admin-card-header">
              <Armchair size={20} className="admin-icon" />
              <h2 className="admin-card-title">Tambah Kursi</h2>
            </div>
            <form onSubmit={addSeats} className="admin-form admin-form-row">
              <div className="form-group" style={{ flex: 1 }}>
                <label className="label">Pilih Jadwal Tayang</label>
                <select
                  className="input-field"
                  value={selectedShowtimeId}
                  onChange={e => setSelectedShowtimeId(e.target.value)}
                  required
                >
                  <option value="">-- Pilih Jadwal (pilih film dulu di atas) --</option>
                  {showtimes.map(st => (
                    <option key={st.id} value={st.id}>
                      ID {st.id} — {new Date(st.show_time).toLocaleString('id-ID', { weekday: 'short', day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label className="label">Kursi per Baris</label>
                <input
                  type="number" min={1} max={20}
                  className="input-field"
                  style={{ width: 120 }}
                  value={seatsPerRow}
                  onChange={e => setSeatsPerRow(Number(e.target.value))}
                />
              </div>

              <div className="form-group" style={{ flex: 1 }}>
                <label className="label">
                  Pilih Baris ({selectedRows.join(', ')} — {selectedRows.length * seatsPerRow} kursi total)
                </label>
                <div className="row-selector">
                  {ROWS_OPTIONS.map(r => (
                    <button
                      key={r} type="button"
                      className={`row-btn ${selectedRows.includes(r) ? 'row-btn-active' : ''}`}
                      onClick={() => toggleRow(r)}
                    >
                      {r}
                    </button>
                  ))}
                </div>
              </div>

              <button
                className="btn btn-primary"
                type="submit"
                disabled={savingSeats || !selectedShowtimeId || selectedRows.length === 0}
                style={{ alignSelf: 'flex-end' }}
              >
                <CheckCircle size={16} />
                {savingSeats ? 'Membuat...' : `Buat ${selectedRows.length * seatsPerRow} Kursi`}
              </button>
            </form>

            {/* Seat preview */}
            {selectedRows.length > 0 && seatsPerRow > 0 && (
              <div className="seat-preview">
                <p className="admin-list-title">Preview Kursi</p>
                <div className="seat-preview-container" style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 12 }}>
                  {selectedRows.map(row => (
                    <div key={row} className="seat-preview-row" style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                      {Array.from({ length: seatsPerRow }, (_, i) => (
                        <span key={`${row}${i+1}`} className="preview-seat">{row}{i+1}</span>
                      ))}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </section>

        </div>
      </div>
    </div>
  );
}
