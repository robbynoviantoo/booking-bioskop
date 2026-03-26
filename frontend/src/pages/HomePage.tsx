import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Film, ChevronRight, Clapperboard, Loader2 } from "lucide-react";
import api from "../lib/api";
import type { Movie } from "../types";

const COLORS = [
  ["#7c3aed", "#9d63f5"],
  ["#db2777", "#ec4899"],
  ["#0891b2", "#06b6d4"],
  ["#059669", "#34d399"],
  ["#d97706", "#f59e0b"],
  ["#dc2626", "#ef4444"],
];

export default function HomePage() {
  const [movies, setMovies] = useState<Movie[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .get("/movies")
      .then((r) => setMovies(r.data || []))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="page-enter">
      {/* Hero */}
      <div className="relative py-20 overflow-hidden">
        {/* Glow */}
        <div
          className="absolute -top-24 left-1/2 -translate-x-1/2 w-[700px] h-[700px] rounded-full pointer-events-none"
          style={{
            background:
              "radial-gradient(circle, rgba(124,58,237,0.2) 0%, transparent 65%)",
          }}
        />

        <div className="w-full max-w-[1200px] mx-auto px-6 relative z-10">
          <div className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-[0.8rem] font-semibold mb-5 bg-violet-600/10 border border-violet-600/30 text-violet-600 dark:text-violet-400">
            <Clapperboard size={14} />
            Real-time seat booking
          </div>
          <h1 className="font-extrabold leading-[1.1] tracking-[-0.04em] mb-4 text-[clamp(2rem,5vw,3.5rem)] text-slate-900 dark:text-[#f0f0ff]">
            Pesan Tiket Bioskop
            <br />
            <span className="bg-gradient-to-br from-violet-600 to-pink-500 bg-clip-text text-transparent">
              Tanpa Antri
            </span>
          </h1>
          <p className="text-[1.1rem] max-w-[480px] text-slate-600 dark:text-[#9090aa]">
            Pilih film, jadwal, dan kursi favorit — semua secara real-time.
          </p>
        </div>
      </div>

      {/* Movie Grid */}
      <div className="w-full max-w-[1200px] mx-auto px-6 py-12">
        <div className="flex flex-wrap items-center gap-3 mb-7">
          <h2 className="text-[1.4rem] font-bold tracking-[-0.02em] text-slate-900 dark:text-[#f0f0ff]">
            Film Sedang Tayang
          </h2>
          <span className="px-2.5 py-0.5 rounded-full text-[0.8rem] border bg-slate-100 dark:bg-[#1e1e2a] text-slate-500 dark:text-[#5a5a70] border-black/5 dark:border-white/10">
            {movies.length} film
          </span>
        </div>

        {loading ? (
          <div className="text-center py-20 flex flex-col items-center">
            <Loader2 size={36} className="animate-spin text-violet-500" />
            <p className="mt-4 text-slate-500 dark:text-[#5a5a70]">
              Memuat film...
            </p>
          </div>
        ) : movies.length === 0 ? (
          <div className="flex flex-col items-center gap-3 py-20 text-slate-500 dark:text-[#5a5a70]">
            <Film size={48} />
            <p>Belum ada film tersedia</p>
          </div>
        ) : (
          <div
            className="grid gap-5"
            style={{
              gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))",
            }}
          >
            {movies.map((movie, i) => {
              const [c1, c2] = COLORS[i % COLORS.length];
              return (
                <Link
                  to={`/movies/${movie.id}`}
                  key={movie.id}
                  className="block rounded-2xl overflow-hidden border bg-white dark:bg-[#16161f] border-black/5 dark:border-white/10 transition-all duration-300 hover:border-violet-300 dark:hover:border-violet-600/40 hover:-translate-y-1 hover:shadow-xl dark:hover:shadow-[0_0_30px_rgba(124,58,237,0.15)] group"
                >
                  <div className="h-[280px] w-full relative overflow-hidden flex items-center justify-center bg-slate-100 dark:bg-[#1e1e2a]">
                    {movie.img_url ? (
                      <img
                        src={`http://localhost:8080${movie.img_url}`}
                        alt={movie.title}
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                        onError={(e) => {
                          (e.target as HTMLImageElement).src = "";
                          (e.target as HTMLImageElement).className = "hidden";
                        }}
                      />
                    ) : (
                      <div
                        className="w-full h-full flex items-center justify-center text-white"
                        style={{
                          background: `linear-gradient(135deg, ${c1}, ${c2})`,
                        }}
                      >
                        <Film
                          size={48}
                          className="opacity-40 group-hover:scale-110 transition-transform duration-500"
                        />
                      </div>
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-60 group-hover:opacity-40 transition-opacity" />
                  </div>
                  <div className="p-5">
                    <h3 className="line-clamp-2 text-base font-bold leading-tight mb-3 text-slate-900 dark:text-[#f0f0ff]">
                      {movie.title}
                    </h3>
                    <div className="flex items-center justify-between text-[0.82rem] font-bold text-violet-600 dark:text-violet-400 group-hover:text-violet-700 dark:group-hover:text-violet-300 transition-colors">
                      <span>Lihat Jadwal</span>
                      <ChevronRight
                        size={16}
                        className="group-hover:translate-x-1 transition-transform"
                      />
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
