import React, { useEffect, useState, useCallback, useRef } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { ArrowLeft, Clock, Wifi, WifiOff, ShoppingCart, X, AlertCircle } from 'lucide-react';
import api from '../lib/api';
import type { Seat, Showtime, WsEvent, SeatStatus } from '../types';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import './SeatPickerPage.css';

const TICKET_PRICE = 50000;
const WS_URL = 'ws://localhost:8080/ws';

function formatIDR(amount: number) {
  return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(amount);
}
function formatTime(iso: string) {
  return new Date(iso).toLocaleString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' });
}

export default function SeatPickerPage() {
  const { id } = useParams<{ id: string }>();
  const showtimeId = Number(id);
  const { user, isAuthenticated } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  const [showtime, setShowtime] = useState<Showtime | null>(null);
  const [seats, setSeats] = useState<Seat[]>([]);
  const [selected, setSelected] = useState<Set<number>>(new Set());
  const [loading, setLoading] = useState(true);
  const [checkingOut, setCheckingOut] = useState(false);
  const [wsConnected, setWsConnected] = useState(false);
  const wsRef = useRef<WebSocket | null>(null);

  // Fetch showtime + seats
  const fetchSeats = useCallback(async () => {
    try {
      const [stRes, sRes] = await Promise.all([
        api.get(`/showtimes/${showtimeId}`),
        api.get(`/showtimes/${showtimeId}/seats`),
      ]);
      setShowtime(stRes.data);
      setSeats(sRes.data || []);
    } catch {
      toast('error', 'Gagal memuat data kursi');
    } finally {
      setLoading(false);
    }
  }, [showtimeId]);

  useEffect(() => { fetchSeats(); }, [fetchSeats]);

  // WebSocket connection
  useEffect(() => {
    const ws = new WebSocket(WS_URL);
    wsRef.current = ws;

    ws.onopen = () => setWsConnected(true);
    ws.onclose = () => setWsConnected(false);
    ws.onerror = () => setWsConnected(false);

    ws.onmessage = (evt) => {
      const event: WsEvent = JSON.parse(evt.data);
      setSeats((prev) =>
        prev.map((s) =>
          s.id === event.seat_id ? { ...s, status: event.status as SeatStatus } : s
        )
      );
      // If one of our selected seats got booked by someone else, deselect it
      if (event.type === 'seat_booked') {
        setSelected((prev) => { const next = new Set(prev); next.delete(event.seat_id); return next; });
      }
    };

    return () => ws.close();
  }, []);

  // Group seats by row (A1 → A, B1 → B, ...)
  const rows = seats.reduce<Record<string, Seat[]>>((acc, seat) => {
    const row = seat.seat_number.replace(/\d/g, '');
    acc[row] = [...(acc[row] || []), seat];
    return acc;
  }, {});

  const handleSeatClick = async (seat: Seat) => {
    if (!isAuthenticated) { toast('info', 'Silakan login terlebih dahulu'); navigate('/login'); return; }
    if (seat.status === 'booked') return;
    if (seat.status === 'reserved' && !selected.has(seat.id)) {
      toast('error', 'Kursi sedang dipilih oleh pengguna lain'); return;
    }

    const isSelected = selected.has(seat.id);
    try {
      if (isSelected) {
        await api.post('/seats/release', { seat_id: seat.id, showtime_id: showtimeId });
        setSelected((prev) => { const n = new Set(prev); n.delete(seat.id); return n; });
      } else {
        await api.post('/seats/lock', { seat_id: seat.id, showtime_id: showtimeId });
        setSelected((prev) => new Set([...prev, seat.id]));
        toast('info', `Kursi ${seat.seat_number} dikunci — selesaikan dalam 5 menit`);
      }
    } catch (err: any) {
      toast('error', err.response?.data?.error || 'Gagal mengubah kursi');
    }
  };

  const handleCheckout = async () => {
    if (selected.size === 0) return;
    setCheckingOut(true);
    try {
      const res = await api.post('/bookings', {
        showtime_id: showtimeId,
        seat_ids: [...selected],
        total_price: selected.size * TICKET_PRICE,
      });
      toast('success', 'Booking berhasil! Tiketmu sudah siap 🎉');
      navigate(`/bookings/${res.data.id}`);
    } catch (err: any) {
      toast('error', err.response?.data?.error || 'Checkout gagal');
    } finally {
      setCheckingOut(false);
    }
  };

  if (loading) return <div style={{ textAlign: 'center', padding: '120px 0' }}><div className="spinner" /></div>;

  return (
    <div className="seat-page page-enter">
      <div className="container">
        {/* Back + Header */}
        <Link to={`/movies/${showtime?.movie_id}`} className="back-btn">
          <ArrowLeft size={16} /> Kembali
        </Link>

        <div className="seat-page-header">
          <div>
            <h1 className="seat-page-title">{showtime?.movie?.title}</h1>
            <p className="seat-page-time"><Clock size={14} />{showtime ? formatTime(showtime.show_time) : ''}</p>
          </div>
          <div className={`ws-status ${wsConnected ? 'ws-on' : 'ws-off'}`}>
            {wsConnected ? <><Wifi size={14} /> Real-time</> : <><WifiOff size={14} /> Offline</>}
          </div>
        </div>

        {/* Screen */}
        <div className="screen-container">
          <div className="screen">LAYAR</div>
        </div>

        {/* Seat Map */}
        <div className="seat-map">
          {Object.entries(rows).map(([row, rowSeats]) => (
            <div key={row} className="seat-row">
              <span className="row-label">{row}</span>
              <div className="seat-row-seats">
                {rowSeats.map((seat) => (
                  <button
                    key={seat.id}
                    className={`seat-btn seat-${seat.status} ${selected.has(seat.id) ? 'seat-selected' : ''}`}
                    onClick={() => handleSeatClick(seat)}
                    disabled={seat.status === 'booked'}
                    title={`Kursi ${seat.seat_number} — ${seat.status}`}
                  >
                    {seat.seat_number.replace(/[A-Z]/g, '')}
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Legend */}
        <div className="seat-legend">
          <div className="legend-item"><div className="seat-demo seat-available" />Tersedia</div>
          <div className="legend-item"><div className="seat-demo seat-selected" />Dipilih</div>
          <div className="legend-item"><div className="seat-demo seat-reserved" />Dipesan Orang Lain</div>
          <div className="legend-item"><div className="seat-demo seat-booked" />Terjual</div>
        </div>
      </div>

      {/* Checkout Drawer */}
      {selected.size > 0 && (
        <div className="checkout-drawer">
          <div className="checkout-content">
            <div className="checkout-info">
              <div className="checkout-seats">
                <ShoppingCart size={18} style={{ color: 'var(--accent-light)' }} />
                <strong>{selected.size} kursi</strong>
                <span style={{ color: 'var(--text-muted)', fontSize: '0.82rem' }}>
                  ({[...selected].map(id => seats.find(s => s.id === id)?.seat_number).filter(Boolean).join(', ')})
                </span>
              </div>
              <div className="checkout-price">{formatIDR(selected.size * TICKET_PRICE)}</div>
            </div>
            <button
              className="btn btn-primary"
              onClick={handleCheckout}
              disabled={checkingOut}
              style={{ minWidth: 150 }}
            >
              {checkingOut ? 'Memproses...' : 'Bayar Sekarang'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
