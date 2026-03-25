import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { CheckCircle, Film, Calendar, ArrowLeft, Ticket } from 'lucide-react';
import api from '../lib/api';
import type { Booking } from '../types';
import './BookingPage.css';

function formatIDR(amount: number) {
  return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(amount);
}
function formatDate(iso: string) {
  return new Date(iso).toLocaleString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' });
}

export default function BookingPage() {
  const { id } = useParams<{ id: string }>();
  const [booking, setBooking] = useState<Booking | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    api.get(`/bookings/${id}`)
      .then((r) => setBooking(r.data))
      .catch((err) => setError(err.response?.data?.error || 'Booking tidak ditemukan'))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) return <div style={{ textAlign: 'center', padding: '120px 0' }}><div className="spinner" /></div>;

  if (error || !booking) return (
    <div className="container" style={{ padding: '80px 24px', textAlign: 'center' }}>
      <p style={{ color: 'var(--danger)' }}>{error || 'Booking tidak ditemukan'}</p>
      <Link to="/" className="btn btn-ghost" style={{ marginTop: 16 }}>Kembali ke Home</Link>
    </div>
  );

  return (
    <div className="booking-page page-enter">
      <div className="container">
        <Link to="/" className="back-btn"><ArrowLeft size={16} /> Home</Link>

        {/* Success Header */}
        <div className="booking-success card">
          <div className="booking-success-icon">
            <CheckCircle size={48} />
          </div>
          <h1 className="booking-success-title">Booking Berhasil! 🎉</h1>
          <p style={{ color: 'var(--text-secondary)' }}>Tiket Anda sudah siap di bawah ini</p>
        </div>

        {/* Ticket Card */}
        <div className="ticket-card">
          <div className="ticket-top">
            <div className="ticket-movie">
              <Film size={32} style={{ color: 'var(--accent-light)', opacity: 0.7 }} />
              <div>
                <div className="ticket-booking-id">Booking #{booking.id}</div>
                <div className="ticket-showtime">
                  <Calendar size={14} />
                  {formatDate(booking.created_at)}
                </div>
              </div>
            </div>
            <div className={`badge badge-${booking.status}`}>{booking.status.toUpperCase()}</div>
          </div>

          <div className="ticket-divider">
            <div className="ticket-hole ticket-hole-left" />
            <div className="ticket-line" />
            <div className="ticket-hole ticket-hole-right" />
          </div>

          {/* Seats */}
          <div className="ticket-seats-section">
            <p className="ticket-label"><Ticket size={14} /> Kursi Yang Dipesan</p>
            <div className="ticket-seats">
              {booking.seats?.map((seat) => (
                <div key={seat.id} className="ticket-seat-badge">
                  {seat.seat_number}
                </div>
              ))}
            </div>
          </div>

          {/* Price */}
          <div className="ticket-price-section">
            <div className="ticket-price-row">
              <span style={{ color: 'var(--text-secondary)' }}>
                {booking.seats?.length || 0} Tiket × {formatIDR(50000)}
              </span>
              <span className="ticket-total">{formatIDR(booking.total_price)}</span>
            </div>
          </div>
        </div>

        <div style={{ textAlign: 'center', marginTop: 24 }}>
          <Link to="/" className="btn btn-primary">Pesan Lagi</Link>
        </div>
      </div>
    </div>
  );
}
