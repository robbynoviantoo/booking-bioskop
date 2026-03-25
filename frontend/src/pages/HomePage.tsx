import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Film, ChevronRight, Loader2, Clapperboard } from 'lucide-react';
import api from '../lib/api';
import type { Movie } from '../types';
import './HomePage.css';

const COLORS = [
  ['#7c3aed','#9d63f5'], ['#db2777','#ec4899'],
  ['#0891b2','#06b6d4'], ['#059669','#34d399'],
  ['#d97706','#f59e0b'], ['#dc2626','#ef4444'],
];

export default function HomePage() {
  const [movies, setMovies] = useState<Movie[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/movies')
      .then((r) => setMovies(r.data || []))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="home-page page-enter">
      {/* Hero */}
      <div className="hero">
        <div className="hero-glow" />
        <div className="container hero-content">
          <div className="hero-badge">
            <Clapperboard size={14} />
            Real-time seat booking
          </div>
          <h1 className="hero-title">
            Pesan Tiket Bioskop<br/>
            <span className="hero-gradient">Tanpa Antri</span>
          </h1>
          <p className="hero-subtitle">
            Pilih film, jadwal, dan kursi favorit — semua secara real-time.
          </p>
        </div>
      </div>

      {/* Movie Grid */}
      <div className="container" style={{ padding: '48px 24px' }}>
        <div className="section-header">
          <h2 className="section-title">Film Sedang Tayang</h2>
          <span className="section-count">{movies.length} film</span>
        </div>

        {loading ? (
          <div style={{ textAlign: 'center', padding: '80px 0' }}>
            <div className="spinner" />
            <p style={{ marginTop: 16, color: 'var(--text-muted)' }}>Memuat film...</p>
          </div>
        ) : movies.length === 0 ? (
          <div className="empty-state">
            <Film size={48} style={{ color: 'var(--text-muted)' }} />
            <p>Belum ada film tersedia</p>
          </div>
        ) : (
          <div className="movie-grid">
            {movies.map((movie, i) => {
              const [c1, c2] = COLORS[i % COLORS.length];
              return (
                <Link to={`/movies/${movie.id}`} key={movie.id} className="movie-card">
                  <div className="movie-poster" style={{ background: `linear-gradient(135deg, ${c1}, ${c2})` }}>
                    <Film size={40} style={{ opacity: 0.4 }} />
                    <div className="movie-poster-overlay" />
                  </div>
                  <div className="movie-card-body">
                    <h3 className="movie-card-title">{movie.title}</h3>
                    <div className="movie-card-action">
                      <span>Lihat Jadwal</span>
                      <ChevronRight size={16} />
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
