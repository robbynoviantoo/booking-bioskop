import { useEffect, useState, useCallback, useRef } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import {
  ArrowLeft,
  Clock,
  Wifi,
  WifiOff,
  ShoppingCart,
  Loader2,
} from "lucide-react";
import api from "../lib/api";
import type { Seat, Showtime, WsEvent, SeatStatus } from "../types";
import { useAuth } from "../contexts/AuthContext";
import { useToast } from "../contexts/ToastContext";

const TICKET_PRICE = 50000;
const WS_URL = "ws://localhost:8080/ws";

function formatIDR(amount: number) {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
  }).format(amount);
}
function formatTime(iso: string) {
  return new Date(iso).toLocaleString("id-ID", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
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

  const fetchSeats = useCallback(async () => {
    try {
      const [stRes, sRes] = await Promise.all([
        api.get(`/showtimes/${showtimeId}`),
        api.get(`/showtimes/${showtimeId}/seats`),
      ]);
      setShowtime(stRes.data);
      const fetchedSeats: Seat[] = sRes.data || [];
      setSeats(fetchedSeats);

      if (user) {
        const myLockedIds = fetchedSeats
          .filter((s) => s.status === "reserved" && s.locked_by === user.id)
          .map((s) => s.id);
        if (myLockedIds.length > 0) {
          setSelected(new Set(myLockedIds));
        }
      }
    } catch {
      toast("error", "Gagal memuat data kursi");
    } finally {
      setLoading(false);
    }
  }, [showtimeId, user]);

  useEffect(() => {
    fetchSeats();
  }, [fetchSeats]);

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
          s.id === event.seat_id
            ? { ...s, status: event.status as SeatStatus }
            : s,
        ),
      );
      if (event.type === "seat_booked") {
        setSelected((prev) => {
          const next = new Set(prev);
          next.delete(event.seat_id);
          return next;
        });
      }
    };
    return () => ws.close();
  }, []);

  const sortedSeats = [...seats].sort((a, b) =>
    a.seat_number.localeCompare(b.seat_number, undefined, {
      numeric: true,
      sensitivity: "base",
    }),
  );

  const rows = sortedSeats.reduce<Record<string, Seat[]>>((acc, seat) => {
    const row = seat.seat_number.replace(/\d/g, "");
    acc[row] = [...(acc[row] || []), seat];
    return acc;
  }, {});

  const handleSeatClick = async (seat: Seat) => {
    if (!isAuthenticated) {
      toast("info", "Silakan login terlebih dahulu");
      navigate("/login");
      return;
    }
    if (seat.status === "booked") return;
    if (seat.status === "reserved" && !selected.has(seat.id)) {
      toast("error", "Kursi sedang dipilih oleh pengguna lain");
      return;
    }

    const isSelected = selected.has(seat.id);
    try {
      if (isSelected) {
        await api.post("/seats/release", {
          seat_id: seat.id,
          showtime_id: showtimeId,
        });
        setSelected((prev) => {
          const n = new Set(prev);
          n.delete(seat.id);
          return n;
        });
      } else {
        await api.post("/seats/lock", {
          seat_id: seat.id,
          showtime_id: showtimeId,
        });
        setSelected((prev) => new Set([...prev, seat.id]));
        toast(
          "info",
          `Kursi ${seat.seat_number} dikunci — selesaikan dalam 5 menit`,
        );
      }
    } catch (err: any) {
      toast("error", err.response?.data?.error || "Gagal mengubah kursi");
    }
  };

  const handleCheckout = async () => {
    if (selected.size === 0) return;
    setCheckingOut(true);
    try {
      const res = await api.post("/bookings", {
        showtime_id: showtimeId,
        seat_ids: [...selected],
        total_price: selected.size * TICKET_PRICE,
      });
      toast("success", "Booking berhasil! Tiketmu sudah siap 🎉");
      navigate(`/bookings/${res.data.id}`);
    } catch (err: any) {
      toast("error", err.response?.data?.error || "Checkout gagal");
    } finally {
      setCheckingOut(false);
    }
  };

  const isPast = showtime ? new Date(showtime.show_time) < new Date() : false;

  if (loading)
    return (
      <div className="text-center py-[120px] flex flex-col items-center">
        <Loader2 size={36} className="animate-spin text-violet-500" />
      </div>
    );

  return (
    <div className="page-enter py-8 pb-40">
      <div className="w-full max-w-[1200px] mx-auto px-6">
        {/* Back + Header */}
        <Link
          to={`/movies/${showtime?.movie_id}`}
          className="inline-flex items-center gap-1.5 mb-6 text-[0.875rem] font-semibold transition-colors text-slate-600 dark:text-[#9090aa] hover:text-slate-900 dark:hover:text-[#f0f0ff]"
        >
          <ArrowLeft size={16} /> Kembali
        </Link>

        <div className="flex items-start justify-between flex-wrap gap-4 mb-10">
          <div>
            <h1 className="text-[1.7rem] font-extrabold tracking-tight text-slate-900 dark:text-[#f0f0ff]">
              {showtime?.movie?.title}
            </h1>
            <p className="flex items-center gap-1.5 mt-1.5 text-[0.875rem] font-medium text-slate-600 dark:text-[#9090aa]">
              <Clock size={16} />
              {showtime ? formatTime(showtime.show_time) : ""}
            </p>
          </div>
          <div
            className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-[0.8rem] font-bold border`}
            style={
              wsConnected
                ? {
                    background: "rgba(34,197,94,0.12)",
                    color: "#22c55e",
                    borderColor: "rgba(34,197,94,0.25)",
                  }
                : {
                    background: "rgba(239,68,68,0.12)",
                    color: "#ef4444",
                    borderColor: "rgba(239,68,68,0.25)",
                  }
            }
          >
            {wsConnected ? (
              <>
                <Wifi size={14} /> Real-time
              </>
            ) : (
              <>
                <WifiOff size={14} /> Offline
              </>
            )}
          </div>
        </div>

        {/* Screen */}
        <div className="flex justify-center mb-14 relative">
          <div className="w-[min(500px,90%)] h-[10px] rounded bg-gradient-to-r from-transparent via-violet-600 to-transparent shadow-[0_0_30px_rgba(124,58,237,0.35),0_0_80px_rgba(124,58,237,0.15)] relative">
            <span className="absolute -bottom-7 left-1/2 -translate-x-1/2 text-[0.7rem] font-bold tracking-widest text-slate-500 dark:text-[#5a5a70]">
              LAYAR
            </span>
          </div>
        </div>

        {isPast && (
          <div className="text-center py-4 px-5 rounded-xl mb-8 font-bold bg-red-100 dark:bg-red-500/15 text-red-700 dark:text-red-400">
            ⚠️ Waktu tayang film ini sudah lewat. Tidak bisa memesan tiket.
          </div>
        )}

        {/* Seat Map */}
        <div className="w-full overflow-x-auto pb-6 mb-8 scrollbar-hide">
          <div className="flex flex-col gap-4 w-max mx-auto px-4">
            {Object.entries(rows).map(([row, rowSeats]) => (
              <div key={row} className="flex items-center gap-4">
                <span className="w-6 text-right text-[0.8rem] font-extrabold shrink-0 text-slate-500 dark:text-[#5a5a70]">
                  {row}
                </span>
                <div className="flex gap-3 flex-nowrap">
                  {rowSeats.map((seat) => {
                    let baseClass =
                      "w-[42px] h-[42px] rounded-t-xl rounded-b-md text-[0.75rem] font-bold transition-all border-2 relative select-none flex items-center justify-center shrink-0 ";

                    // seat-available logic
                    if (seat.status === "available" && !selected.has(seat.id)) {
                      baseClass +=
                        "bg-slate-100 dark:bg-[#1e1e2a] text-slate-600 dark:text-[#9090aa] border-black/5 dark:border-white/10 hover:border-violet-600 hover:text-violet-600 dark:hover:text-violet-400 hover:scale-110 cursor-pointer";
                    }
                    // seat-selected logic
                    else if (selected.has(seat.id)) {
                      baseClass +=
                        "bg-gradient-to-br from-violet-600 to-violet-500 text-white border-violet-400 shadow-[0_0_16px_rgba(124,58,237,0.35)] scale-105 cursor-pointer";
                    }
                    // seat-reserved logic
                    else if (seat.status === "reserved") {
                      baseClass +=
                        "bg-amber-100 dark:bg-amber-500/10 text-amber-600 dark:text-amber-500 border-amber-300 dark:border-amber-500/30 cursor-not-allowed";
                    }
                    // seat-booked logic
                    else if (seat.status === "booked") {
                      baseClass +=
                        "bg-red-100 dark:bg-red-500/10 text-red-500/60 dark:text-red-500/40 border-red-200 dark:border-red-500/15 cursor-not-allowed";
                    }

                    return (
                      <button
                        key={seat.id}
                        className={baseClass}
                        onClick={() => handleSeatClick(seat)}
                        disabled={seat.status === "booked" || isPast}
                        title={`Kursi ${seat.seat_number} — ${seat.status}`}
                      >
                        <div className="absolute top-[-3px] left-[6px] right-[6px] h-[3px] rounded-t bg-current opacity-30" />
                        {seat.seat_number.replace(/[A-Z]/g, "")}
                      </button>
                    );
                  })}
                </div>
                <span className="w-6 shrink-0" />
              </div>
            ))}
          </div>
        </div>

        {/* Legend */}
        <div className="flex justify-center flex-wrap gap-6 p-5 rounded-2xl border bg-white dark:bg-[#16161f] border-black/5 dark:border-white/10 shadow-sm dark:shadow-none">
          {[
            {
              cls: "bg-slate-100 dark:bg-[#1e1e2a] border-black/5 dark:border-white/10",
              label: "Tersedia",
            },
            {
              cls: "bg-gradient-to-br from-violet-600 to-violet-500 border-violet-400",
              label: "Dipilih",
            },
            {
              cls: "bg-amber-100 dark:bg-amber-500/10 border-amber-300 dark:border-amber-500/30",
              label: "Dipesan Orang Lain",
            },
            {
              cls: "bg-red-100 dark:bg-red-500/10 border-red-200 dark:border-red-500/15",
              label: "Terjual",
            },
          ].map(({ cls, label }) => (
            <div
              key={label}
              className="flex items-center gap-2.5 text-[0.8rem] font-semibold text-slate-600 dark:text-[#9090aa]"
            >
              <div
                className={`w-[24px] h-[24px] rounded-t-md rounded-b-[3px] border-2 flex-shrink-0 ${cls}`}
              />
              {label}
            </div>
          ))}
        </div>
      </div>

      {/* Checkout Drawer */}
      {selected.size > 0 && (
        <div className="fixed bottom-0 left-0 right-0 bg-white dark:bg-[#111118] border-t border-black/5 dark:border-white/10 p-4 sm:p-5 z-[200] shadow-[0_-20px_60px_rgba(0,0,0,0.1)] dark:shadow-[0_-20px_60px_rgba(0,0,0,0.5)] animate-[slideUp_0.3s_ease]">
          <div className="max-w-[1200px] mx-auto flex items-center justify-between gap-4 flex-wrap px-2">
            <div className="flex flex-col gap-1.5">
              <div className="flex items-center gap-2 text-[0.95rem] text-slate-900 dark:text-[#f0f0ff]">
                <ShoppingCart
                  size={20}
                  className="text-violet-600 dark:text-violet-400"
                />
                <strong>{selected.size} kursi</strong>
                <span className="text-[0.82rem] font-medium text-slate-500 dark:text-[#9090aa] ml-1">
                  (
                  {[...selected]
                    .map((id) => seats.find((s) => s.id === id)?.seat_number)
                    .filter(Boolean)
                    .join(", ")}
                  )
                </span>
              </div>
              <div className="text-[1.7rem] font-black bg-gradient-to-br from-violet-600 to-pink-500 bg-clip-text text-transparent leading-none">
                {formatIDR(selected.size * TICKET_PRICE)}
              </div>
            </div>
            <button
              className="inline-flex items-center justify-center gap-2 px-8 py-3.5 rounded-xl font-bold transition-all bg-gradient-to-br from-violet-600 to-violet-500 text-white shadow-[0_4px_20px_rgba(124,58,237,0.35)] hover:-translate-y-0.5 hover:shadow-[0_8px_30px_rgba(124,58,237,0.4)] disabled:opacity-50 disabled:hover:translate-y-0 min-w-[200px]"
              onClick={handleCheckout}
              disabled={checkingOut || isPast}
            >
              {checkingOut ? "Memproses..." : "Bayar Sekarang"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
