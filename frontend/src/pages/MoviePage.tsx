import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Film, Calendar, Clock, ChevronRight, ArrowLeft } from 'lucide-react';
import api from '../lib/api';
import type { Movie, Showtime } from '../types';
import './MoviePage.css';

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
}
function formatTime(iso: string) {
  return new Date(iso).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
}

export default function MoviePage() {
  const { id } = useParams<{ id: string }>();
  const [movie, setMovie] = useState<Movie | null>(null);
  const [showtimes, setShowtimes] = useState<Showtime[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      api.get(`/movies/${id}`),
      api.get(`/movies/${id}/showtimes`),
    ])
      .then(([mRes, sRes]) => {
        setMovie(mRes.data);
        setShowtimes(sRes.data || []);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) return (
    <div style={{ textAlign: 'center', padding: '120px 0' }}>
      <div className="spinner" />
    </div>
  );

  if (!movie) return (
    <div className="container" style={{ padding: '80px 24px', textAlign: 'center', color: 'var(--text-muted)' }}>
      Film tidak ditemukan
    </div>
  );

  return (
    <div className="movie-page page-enter">
      <div className="container">
        <Link to="/" className="back-btn">
          <ArrowLeft size={16} /> Semua Film
        </Link>

        {/* Movie Header */}
        <div className="movie-header card">
          <div className="movie-header-icon">
            <Film size={40} style={{ opacity: 0.6, color: 'var(--accent-light)' }} />
          </div>
          <div>
            <h1 className="movie-page-title">{movie.title}</h1>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginTop: 4 }}>
              {showtimes.length} jadwal tersedia
            </p>
          </div>
        </div>

        {/* Showtimes */}
        <div style={{ marginTop: 24 }}>
          <h2 className="section-title" style={{ marginBottom: 16 }}>Pilih Jadwal Tayang</h2>

          {showtimes.length === 0 ? (
            <div className="empty-state" style={{ padding: '60px 0' }}>
              <Calendar size={40} style={{ color: 'var(--text-muted)' }} />
              <p style={{ color: 'var(--text-muted)' }}>Belum ada jadwal tayang</p>
            </div>
          ) : (
            <div className="showtime-list">
              {showtimes.map((st) => {
                const isPast = new Date(st.show_time) < new Date();
                return (
                  <Link 
                    to={isPast ? "#" : `/showtimes/${st.id}/seats`} 
                    key={st.id} 
                    className={`showtime-card card ${isPast ? 'disabled' : ''}`}
                    style={isPast ? { opacity: 0.5, pointerEvents: 'none' } : {}}
                  >
                    <div className="showtime-card-left">
                      <div className="showtime-time">
                        <Clock size={18} style={{ color: isPast ? 'var(--text-muted)' : 'var(--accent-light)' }} />
                        {formatTime(st.show_time)}
                      </div>
                      <div className="showtime-date">
                        <Calendar size={14} />
                        {formatDate(st.show_time)}
                      </div>
                    </div>
                    <div className="showtime-card-right">
                      {isPast ? (
                        <span className="badge badge-booked">Lewat</span>
                      ) : (
                        <span className="badge badge-available">Tersedia</span>
                      )}
                      <ChevronRight size={20} style={{ color: 'var(--text-muted)' }} />
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
