import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  Ticket,
  Calendar,
  ChevronRight,
  ArrowLeft,
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
    day: "numeric",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function MyBookingsPage() {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .get("/bookings")
      .then((r) => setBookings(r.data || []))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading)
    return (
      <div className="text-center py-[120px] flex flex-col items-center">
        <Loader2 size={36} className="animate-spin text-violet-500" />
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

        <div className="flex flex-wrap items-center gap-3 mb-7">
          <h1 className="text-[1.4rem] font-bold tracking-tight text-slate-900 dark:text-[#f0f0ff]">
            Tiket Saya
          </h1>
          <span className="px-2.5 py-0.5 rounded-full text-[0.8rem] border bg-slate-100 dark:bg-[#1e1e2a] text-slate-500 dark:text-[#5a5a70] border-black/5 dark:border-white/10">
            {bookings.length} booking
          </span>
        </div>

        {bookings.length === 0 ? (
          <div className="flex flex-col items-center gap-3 py-20 text-slate-500 dark:text-[#5a5a70]">
            <Ticket size={48} />
            <p>Belum ada booking</p>
            <Link
              to="/"
              className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl font-semibold transition-all bg-gradient-to-br from-violet-600 to-violet-500 text-white shadow-lg hover:-translate-y-0.5 hover:shadow-xl mt-3"
            >
              Pesan Sekarang
            </Link>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {bookings.map((b) => (
              <Link
                to={`/bookings/${b.id}`}
                key={b.id}
                className="bg-white dark:bg-[#16161f] border border-black/5 dark:border-white/10 rounded-2xl p-5 shadow-sm dark:shadow-none flex items-center justify-between gap-4 flex-wrap transition-all duration-300 hover:border-violet-300 dark:hover:border-violet-600/40 hover:-translate-y-1 hover:shadow-lg dark:hover:shadow-[0_0_30px_rgba(124,58,237,0.15)] group"
              >
                <div className="flex flex-col gap-2">
                  <div className="flex items-center gap-2 font-extrabold text-[1rem] text-slate-900 dark:text-[#f0f0ff]">
                    <Ticket
                      size={18}
                      className="text-violet-600 dark:text-violet-400"
                    />
                    Booking #{b.id}
                  </div>
                  <div className="flex items-center gap-1.5 text-[0.82rem] font-medium text-slate-600 dark:text-[#9090aa]">
                    <Calendar size={14} />
                    {formatDate(b.created_at)}
                  </div>
                </div>
                <div className="flex items-center gap-4 flex-wrap">
                  <div className="text-[1.1rem] font-extrabold text-violet-600 dark:text-violet-400">
                    {formatIDR(b.total_price)}
                  </div>
                  {b.status === "paid" && (
                    <span className="inline-flex px-3 py-1 rounded-full text-xs font-semibold bg-green-100 dark:bg-green-500/15 text-green-700 dark:text-green-400">
                      PAID
                    </span>
                  )}
                  {b.status === "pending" && (
                    <span className="inline-flex px-3 py-1 rounded-full text-xs font-semibold bg-amber-100 dark:bg-amber-500/15 text-amber-700 dark:text-amber-400">
                      PENDING
                    </span>
                  )}
                  {b.status === "expired" && (
                    <span className="inline-flex px-3 py-1 rounded-full text-xs font-semibold bg-red-100 dark:bg-red-500/15 text-red-700 dark:text-red-400">
                      EXPIRED
                    </span>
                  )}
                  <ChevronRight
                    size={20}
                    className="text-slate-400 dark:text-[#5a5a70] group-hover:text-violet-500 group-hover:translate-x-1 transition-all"
                  />
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
