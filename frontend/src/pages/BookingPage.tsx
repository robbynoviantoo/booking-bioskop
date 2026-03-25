import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import {
  CheckCircle,
  Film,
  Calendar,
  ArrowLeft,
  Ticket,
  Loader2,
} from "lucide-react";
import api from "../lib/api";
import type { Booking } from "../types";

function formatIDR(amount: number) {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
  }).format(amount);
}
function formatDate(iso: string) {
  return new Date(iso).toLocaleString("id-ID", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function BookingPage() {
  const { id } = useParams<{ id: string }>();
  const [booking, setBooking] = useState<Booking | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    api
      .get(`/bookings/${id}`)
      .then((r) => setBooking(r.data))
      .catch((err) =>
        setError(err.response?.data?.error || "Booking tidak ditemukan"),
      )
      .finally(() => setLoading(false));
  }, [id]);

  if (loading)
    return (
      <div className="text-center py-[120px] flex flex-col items-center">
        <Loader2 size={36} className="animate-spin text-violet-500" />
      </div>
    );

  if (error || !booking)
    return (
      <div className="w-full max-w-[1200px] mx-auto px-6 py-20 text-center">
        <p className="text-red-600 dark:text-red-400 font-semibold mb-4 text-lg">
          {error || "Booking tidak ditemukan"}
        </p>
        <Link
          to="/"
          className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl border border-black/5 dark:border-white/10 text-slate-600 dark:text-[#9090aa] hover:bg-slate-100 dark:hover:bg-[#22222f] hover:text-slate-900 dark:hover:text-[#f0f0ff] font-semibold transition-all"
        >
          Kembali ke Home
        </Link>
      </div>
    );

  return (
    <div className="page-enter py-8 pb-20">
      <div className="w-full max-w-[1200px] mx-auto px-6">
        <Link
          to="/"
          className="inline-flex items-center gap-1.5 mb-6 text-[0.875rem] font-semibold transition-colors text-slate-600 dark:text-[#9090aa] hover:text-slate-900 dark:hover:text-[#f0f0ff]"
        >
          <ArrowLeft size={16} /> Home
        </Link>

        {/* Success Header */}
        <div className="bg-white dark:bg-[#16161f] border border-green-500/20 rounded-2xl p-10 text-center mb-6 shadow-sm dark:shadow-none">
          <div className="mb-4 text-green-500 dark:text-green-400 flex justify-center">
            <CheckCircle size={48} />
          </div>
          <h1 className="text-[1.5rem] font-extrabold mb-1.5 text-slate-900 dark:text-[#f0f0ff]">
            Booking Berhasil! 🎉
          </h1>
          <p className="font-medium text-slate-600 dark:text-[#9090aa]">
            Tiket Anda sudah siap di bawah ini
          </p>
        </div>

        {/* Ticket Card */}
        <div className="bg-white dark:bg-[#16161f] border border-black/5 dark:border-white/10 rounded-3xl overflow-hidden shadow-xl dark:shadow-[0_4px_32px_rgba(0,0,0,0.4)] mb-8 relative">
          <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-violet-600 via-violet-500 to-pink-500" />

          {/* Top section */}
          <div className="flex items-start justify-between gap-4 p-7">
            <div className="flex items-center gap-5">
              <Film
                size={34}
                className="text-violet-600 dark:text-violet-400 opacity-80"
              />
              <div>
                <div className="text-[1.3rem] font-extrabold tracking-tight text-slate-900 dark:text-[#f0f0ff]">
                  Booking #{booking.id}
                </div>
                <div className="flex items-center gap-1.5 mt-1.5 text-[0.82rem] font-medium text-slate-600 dark:text-[#9090aa]">
                  <Calendar size={14} />
                  {formatDate(booking.created_at)}
                </div>
              </div>
            </div>
            {booking.status === "paid" && (
              <span className="inline-flex px-3.5 py-1.5 rounded-full text-xs font-extrabold tracking-wider bg-green-100 dark:bg-green-500/15 text-green-700 dark:text-green-400">
                PAID
              </span>
            )}
            {booking.status === "pending" && (
              <span className="inline-flex px-3.5 py-1.5 rounded-full text-xs font-extrabold tracking-wider bg-amber-100 dark:bg-amber-500/15 text-amber-700 dark:text-amber-400">
                PENDING
              </span>
            )}
            {booking.status === "expired" && (
              <span className="inline-flex px-3.5 py-1.5 rounded-full text-xs font-extrabold tracking-wider bg-red-100 dark:bg-red-500/15 text-red-700 dark:text-red-400">
                EXPIRED
              </span>
            )}
          </div>

          {/* Dashed divider */}
          <div className="relative flex items-center px-4">
            <div className="w-8 h-8 rounded-full shrink-0 -ml-8 bg-slate-50 dark:bg-[#0a0a0f] border border-black/5 dark:border-white/10" />
            <div className="flex-1 border-t-2 border-dashed border-slate-200 dark:border-white/10" />
            <div className="w-8 h-8 rounded-full shrink-0 -mr-8 bg-slate-50 dark:bg-[#0a0a0f] border border-black/5 dark:border-white/10" />
          </div>

          {/* Seats */}
          <div className="p-7">
            <p className="flex items-center gap-1.5 text-[0.8rem] font-bold uppercase tracking-widest mb-4 text-slate-500 dark:text-[#9090aa]">
              <Ticket size={14} /> Kursi Yang Dipesan
            </p>
            <div className="flex flex-wrap gap-2.5">
              {booking.seats?.map((seat) => (
                <div
                  key={seat.id}
                  className="px-4 py-2 rounded-lg text-[0.95rem] font-bold border border-violet-600/30 bg-violet-600/10 text-violet-700 dark:text-violet-400"
                >
                  {seat.seat_number}
                </div>
              ))}
            </div>
          </div>

          {/* Price */}
          <div className="flex justify-between items-center px-7 py-5 bg-slate-50/50 dark:bg-white/5 border-t border-black/5 dark:border-white/10">
            <span className="font-semibold text-slate-500 dark:text-[#9090aa]">
              {booking.seats?.length || 0} Tiket × {formatIDR(50000)}
            </span>
            <span className="text-[1.7rem] font-black bg-gradient-to-br from-violet-600 to-pink-500 bg-clip-text text-transparent">
              {formatIDR(booking.total_price)}
            </span>
          </div>
        </div>

        <div className="text-center">
          <Link
            to="/"
            className="inline-flex items-center justify-center gap-2 px-8 py-4 rounded-xl font-bold transition-all bg-gradient-to-br from-violet-600 to-violet-500 text-white shadow-[0_4px_20px_rgba(124,58,237,0.35)] hover:-translate-y-0.5 hover:shadow-[0_8px_30px_rgba(124,58,237,0.4)]"
          >
            Pesan Lagi
          </Link>
        </div>
      </div>
    </div>
  );
}
