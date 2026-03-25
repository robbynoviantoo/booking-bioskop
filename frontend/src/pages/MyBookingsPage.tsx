import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Ticket, Calendar, ChevronRight, ArrowLeft } from 'lucide-react';
import api from '../lib/api';
import type { Booking } from '../types';
import './MyBookingsPage.css';

function formatIDR(amount: number) {
  return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(amount);
}
function formatDate(iso: string) {
  return new Date(iso).toLocaleString('id-ID', { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' });
}

export default function MyBookingsPage() {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/bookings')
      .then((r) => setBookings(r.data || []))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div style={{ textAlign: 'center', padding: '120px 0' }}><div className="spinner" /></div>;

  return (
    <div className="my-bookings-page page-enter">
      <div className="container">
        <Link to="/" className="back-btn"><ArrowLeft size={16} /> Home</Link>
        <div className="section-header">
          <h1 className="section-title">Tiket Saya</h1>
          <span className="section-count">{bookings.length} booking</span>
        </div>

        {bookings.length === 0 ? (
          <div className="empty-state" style={{ padding: '80px 0' }}>
            <Ticket size={48} style={{ color: 'var(--text-muted)' }} />
            <p style={{ color: 'var(--text-muted)' }}>Belum ada booking</p>
            <Link to="/" className="btn btn-primary" style={{ marginTop: 12 }}>Pesan Sekarang</Link>
          </div>
        ) : (
          <div className="bookings-list">
            {bookings.map((b) => (
              <Link to={`/bookings/${b.id}`} key={b.id} className="booking-list-card card">
                <div className="booking-list-left">
                  <div className="booking-list-id">
                    <Ticket size={16} style={{ color: 'var(--accent-light)' }} />
                    Booking #{b.id}
                  </div>
                  <div className="booking-list-meta">
                    <Calendar size={13} />
                    {formatDate(b.created_at)}
                  </div>
                </div>
                <div className="booking-list-right">
                  <div className="booking-list-price">{formatIDR(b.total_price)}</div>
                  <span className={`badge badge-${b.status}`}>{b.status.toUpperCase()}</span>
                  <ChevronRight size={18} style={{ color: 'var(--text-muted)' }} />
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
