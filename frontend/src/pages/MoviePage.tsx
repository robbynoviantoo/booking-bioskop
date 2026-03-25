import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import {
  Film,
  Calendar,
  Clock,
  ChevronRight,
  ArrowLeft,
  Loader2,
} from "lucide-react";
import api from "../lib/api";
import type { Movie, Showtime } from "../types";

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("id-ID", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}
function formatTime(iso: string) {
  return new Date(iso).toLocaleTimeString("id-ID", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function MoviePage() {
  const { id } = useParams<{ id: string }>();
  const [movie, setMovie] = useState<Movie | null>(null);
  const [showtimes, setShowtimes] = useState<Showtime[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([api.get(`/movies/${id}`), api.get(`/movies/${id}/showtimes`)])
      .then(([mRes, sRes]) => {
        setMovie(mRes.data);
        setShowtimes(sRes.data || []);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [id]);

  if (loading)
    return (
      <div className="text-center py-[120px] flex flex-col items-center">
        <Loader2 size={36} className="animate-spin text-violet-500" />
      </div>
    );

  if (!movie)
    return (
      <div className="w-full max-w-[1200px] mx-auto px-6 py-20 text-center text-slate-500 dark:text-[#5a5a70]">
        Film tidak ditemukan
      </div>
    );

  return (
    <div className="page-enter py-8 pb-20">
      <div className="w-full max-w-[1200px] mx-auto px-6">
        <Link
          to="/"
          className="inline-flex items-center gap-1.5 mb-6 text-[0.875rem] font-semibold transition-colors text-slate-600 dark:text-[#9090aa] hover:text-slate-900 dark:hover:text-[#f0f0ff]"
        >
          <ArrowLeft size={16} /> Semua Film
        </Link>

        {/* Movie Header */}
        <div className="bg-white dark:bg-[#16161f] border border-black/5 dark:border-white/10 rounded-2xl p-6 shadow-md dark:shadow-none flex items-center gap-5 mb-6">
          <div className="w-[72px] h-[72px] shrink-0 rounded-xl flex items-center justify-center border bg-violet-600/10 border-violet-600/30">
            <Film
              size={40}
              className="opacity-60 text-violet-600 dark:text-violet-400"
            />
          </div>
          <div>
            <h1 className="text-[1.7rem] font-extrabold tracking-tight text-slate-900 dark:text-[#f0f0ff]">
              {movie.title}
            </h1>
            <p className="text-[0.9rem] mt-1 text-slate-600 dark:text-[#9090aa]">
              {showtimes.length} jadwal tersedia
            </p>
          </div>
        </div>

        {/* Showtimes */}
        <div>
          <h2 className="text-[1.4rem] font-bold tracking-tight mb-4 text-slate-900 dark:text-[#f0f0ff]">
            Pilih Jadwal Tayang
          </h2>

          {showtimes.length === 0 ? (
            <div className="flex flex-col items-center gap-3 py-16 text-slate-500 dark:text-[#5a5a70]">
              <Calendar size={40} />
              <p>Belum ada jadwal tayang</p>
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              {showtimes.map((st) => {
                const isPast = new Date(st.show_time) < new Date();
                return (
                  <Link
                    to={isPast ? "#" : `/showtimes/${st.id}/seats`}
                    key={st.id}
                    className="bg-white dark:bg-[#16161f] border border-black/5 dark:border-white/10 rounded-2xl p-5 shadow-sm dark:shadow-none flex items-center justify-between transition-all duration-300 hover:border-violet-300 dark:hover:border-violet-600/40 hover:-translate-y-1 hover:shadow-lg dark:hover:shadow-[0_0_30px_rgba(124,58,237,0.15)] group"
                    style={{
                      opacity: isPast ? 0.5 : 1,
                      pointerEvents: isPast ? "none" : "auto",
                      cursor: isPast ? "default" : "pointer",
                    }}
                  >
                    <div className="flex flex-col gap-2">
                      <div className="flex flex-wrap items-center gap-2 text-xl sm:text-[1.3rem] font-extrabold text-slate-900 dark:text-[#f0f0ff]">
                        <Clock
                          size={20}
                          className={
                            isPast
                              ? "text-slate-400 dark:text-[#5a5a70]"
                              : "text-violet-600 dark:text-violet-400"
                          }
                        />
                        {formatTime(st.show_time)}
                      </div>
                      <div className="flex items-center gap-1.5 text-[0.82rem] font-medium text-slate-600 dark:text-[#9090aa]">
                        <Calendar size={14} />
                        {formatDate(st.show_time)}
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      {isPast ? (
                        <span className="inline-flex items-center gap-[5px] px-3 py-1 rounded-full text-xs font-semibold bg-red-100 dark:bg-red-500/15 text-red-600 dark:text-red-400">
                          Lewat
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-[5px] px-3 py-1 rounded-full text-xs font-semibold bg-green-100 dark:bg-green-500/15 text-green-700 dark:text-green-400">
                          Tersedia
                        </span>
                      )}
                      <ChevronRight
                        size={20}
                        className="text-slate-400 dark:text-[#5a5a70] group-hover:text-violet-500 group-hover:translate-x-1 transition-all"
                      />
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
