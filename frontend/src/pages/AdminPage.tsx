import { useEffect, useState } from "react";
import { Film, Clock, Plus, CheckCircle, Armchair } from "lucide-react";
import api from "../lib/api";
import { useToast } from "../contexts/ToastContext";
import type { Movie, Showtime } from "../types";

const ROWS_OPTIONS = ["A", "B", "C", "D", "E", "F", "G", "H"];

export default function AdminPage() {
  const { toast } = useToast();

  const [movies, setMovies] = useState<Movie[]>([]);
  const [movieTitle, setMovieTitle] = useState("");
  const [movieImage, setMovieImage] = useState<File | null>(null);
  const [savingMovie, setSavingMovie] = useState(false);

  const [showtimes, setShowtimes] = useState<Showtime[]>([]);
  const [selectedMovieId, setSelectedMovieId] = useState("");
  const [showDateTime, setShowDateTime] = useState("");
  const [savingShowtime, setSavingShowtime] = useState(false);

  const [selectedShowtimeId, setSelectedShowtimeId] = useState("");
  const [selectedRows, setSelectedRows] = useState<string[]>(["A", "B", "C"]);
  const [seatsPerRow, setSeatsPerRow] = useState(8);
  const [savingSeats, setSavingSeats] = useState(false);

  const loadMovies = () =>
    api.get("/movies").then((r) => setMovies(r.data || []));
  const loadShowtimes = (movieId: string) => {
    if (!movieId) return;
    api
      .get(`/movies/${movieId}/showtimes`)
      .then((r) => setShowtimes(r.data || []));
  };

  useEffect(() => {
    loadMovies();
  }, []);
  useEffect(() => {
    loadShowtimes(selectedMovieId);
  }, [selectedMovieId]);

  const addMovie = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!movieTitle.trim()) return;
    setSavingMovie(true);
    try {
      const formData = new FormData();
      formData.append("title", movieTitle);
      if (movieImage) formData.append("image", movieImage);

      await api.post("/movies", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      toast("success", `Film "${movieTitle}" berhasil ditambahkan!`);
      setMovieTitle("");
      setMovieImage(null);
      loadMovies();
    } catch (err: any) {
      toast("error", err.response?.data?.error || "Gagal tambah film");
    } finally {
      setSavingMovie(false);
    }
  };

  const addShowtime = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedMovieId || !showDateTime) return;
    setSavingShowtime(true);
    try {
      await api.post("/showtimes", {
        movie_id: Number(selectedMovieId),
        show_time: new Date(showDateTime).toISOString(),
      });
      toast("success", "Jadwal berhasil ditambahkan!");
      setShowDateTime("");
      loadShowtimes(selectedMovieId);
    } catch (err: any) {
      toast("error", err.response?.data?.error || "Gagal tambah jadwal");
    } finally {
      setSavingShowtime(false);
    }
  };

  const addSeats = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedShowtimeId || selectedRows.length === 0) return;
    setSavingSeats(true);
    try {
      await api.post(`/showtimes/${selectedShowtimeId}/seats`, {
        rows: selectedRows,
        seats_per_row: seatsPerRow,
      });
      toast(
        "success",
        `${selectedRows.length * seatsPerRow} kursi berhasil dibuat!`,
      );
      setSelectedShowtimeId("");
    } catch (err: any) {
      toast("error", err.response?.data?.error || "Gagal buat kursi");
    } finally {
      setSavingSeats(false);
    }
  };

  const toggleRow = (r: string) =>
    setSelectedRows((prev) =>
      prev.includes(r) ? prev.filter((x) => x !== r) : [...prev, r].sort(),
    );

  const cardHeader = (icon: React.ReactNode, title: string) => (
    <div className="flex items-center gap-2.5 mb-5 pb-4 border-b border-black/5 dark:border-white/10">
      <span className="text-violet-600 dark:text-violet-400">{icon}</span>
      <h2 className="text-[1.1rem] font-bold text-slate-900 dark:text-[#f0f0ff]">
        {title}
      </h2>
    </div>
  );

  return (
    <div className="page-enter py-8 pb-20">
      <div className="w-full max-w-[1200px] mx-auto px-6">
        <div className="mb-8">
          <h1 className="text-[1.8rem] font-extrabold tracking-tight mb-1.5 text-slate-900 dark:text-[#f0f0ff]">
            ⚙️ Panel Admin
          </h1>
          <p className="text-[0.9rem] font-medium text-slate-500 dark:text-[#9090aa]">
            Kelola film, jadwal, dan kursi bioskop
          </p>
        </div>

        <div
          className="grid gap-5"
          style={{
            gridTemplateColumns: "repeat(auto-fill, minmax(340px, 1fr))",
          }}
        >
          {/* ── Add Movie ── */}
          <section className="bg-white dark:bg-[#16161f] border border-black/5 dark:border-white/10 rounded-2xl p-6 shadow-md dark:shadow-none">
            {cardHeader(<Film size={20} />, "Tambah Film")}
            <form onSubmit={addMovie} className="flex flex-col gap-4">
              <div className="flex flex-col gap-1.5">
                <label className="block text-[0.85rem] font-medium text-slate-600 dark:text-[#9090aa]">
                  Judul Film
                </label>
                <input
                  className="w-full px-4 py-3 bg-slate-100 dark:bg-[#1e1e2a] border border-slate-200 dark:border-white/10 rounded-xl text-slate-900 dark:text-white text-sm transition-all focus:border-violet-600 focus:ring-3 focus:ring-violet-600/20 outline-none"
                  placeholder="Contoh: Inception"
                  value={movieTitle}
                  onChange={(e) => setMovieTitle(e.target.value)}
                  required
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="block text-[0.85rem] font-medium text-slate-600 dark:text-[#9090aa]">
                  Poster / Gambar Film
                </label>
                <input
                  type="file"
                  accept="image/*"
                  className="w-full px-4 py-2 bg-slate-100 dark:bg-[#1e1e2a] border border-slate-200 dark:border-white/10 rounded-xl text-slate-900 dark:text-white text-sm transition-all focus:border-violet-600 focus:ring-3 focus:ring-violet-600/20 outline-none file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-violet-600 file:text-white hover:file:bg-violet-700 cursor-pointer"
                  onChange={(e) => setMovieImage(e.target.files?.[0] || null)}
                />
              </div>
              <button
                className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl font-semibold transition-all bg-gradient-to-br from-violet-600 to-violet-500 text-white shadow-lg hover:-translate-y-0.5"
                type="submit"
                disabled={savingMovie}
              >
                <Plus size={16} />{" "}
                {savingMovie ? "Menyimpan..." : "Tambah Film"}
              </button>
            </form>

            {movies.length > 0 && (
              <div className="mt-5 pt-4 border-t border-black/5 dark:border-white/10">
                <p className="text-[0.78rem] font-extrabold uppercase tracking-widest mb-3 text-slate-500 dark:text-[#5a5a70]">
                  Film Terdaftar ({movies.length})
                </p>
                {movies.map((m) => (
                  <div
                    key={m.id}
                    className="flex items-center gap-2 px-3 py-2 rounded-lg text-[0.87rem] font-medium mb-1.5 bg-slate-100 dark:bg-[#1e1e2a] text-slate-700 dark:text-[#9090aa]"
                  >
                    <Film
                      size={14}
                      className="text-violet-600 dark:text-violet-400"
                    />
                    {m.title}
                  </div>
                ))}
              </div>
            )}
          </section>

          {/* ── Add Showtime ── */}
          <section className="bg-white dark:bg-[#16161f] border border-black/5 dark:border-white/10 rounded-2xl p-6 shadow-md dark:shadow-none">
            {cardHeader(<Clock size={20} />, "Tambah Jadwal Tayang")}
            <form onSubmit={addShowtime} className="flex flex-col gap-4">
              <div className="flex flex-col gap-1.5">
                <label className="block text-[0.85rem] font-medium text-slate-600 dark:text-[#9090aa]">
                  Pilih Film
                </label>
                <select
                  className="w-full px-4 py-3 bg-slate-100 dark:bg-[#1e1e2a] border border-slate-200 dark:border-white/10 rounded-xl text-slate-900 dark:text-white text-sm transition-all focus:border-violet-600 focus:ring-3 focus:ring-violet-600/20 outline-none appearance-none"
                  value={selectedMovieId}
                  onChange={(e) => setSelectedMovieId(e.target.value)}
                  style={{
                    backgroundImage:
                      "url(\"data:image/svg+xml;charset=UTF-8,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='%239090aa' stroke-width='2'%3E%3Cpolyline points='6 9 12 15 18 9'/%3E%3C/svg%3E\")",
                    backgroundRepeat: "no-repeat",
                    backgroundPosition: "right 12px center",
                    backgroundSize: "16px",
                  }}
                  required
                >
                  <option value="" className="bg-white dark:bg-[#111118]">
                    -- Pilih Film --
                  </option>
                  {movies.map((m) => (
                    <option
                      key={m.id}
                      value={m.id}
                      className="bg-white dark:bg-[#111118]"
                    >
                      {m.title}
                    </option>
                  ))}
                </select>
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="block text-[0.85rem] font-medium text-slate-600 dark:text-[#9090aa]">
                  Tanggal &amp; Waktu Tayang
                </label>
                <input
                  type="datetime-local"
                  className="w-full px-4 py-3 bg-slate-100 dark:bg-[#1e1e2a] border border-slate-200 dark:border-white/10 rounded-xl text-slate-900 dark:text-white text-sm transition-all focus:border-violet-600 focus:ring-3 focus:ring-violet-600/20 outline-none"
                  value={showDateTime}
                  onChange={(e) => setShowDateTime(e.target.value)}
                  required
                />
              </div>
              <button
                className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl font-semibold transition-all bg-gradient-to-br from-violet-600 to-violet-500 text-white shadow-lg hover:-translate-y-0.5 disabled:opacity-50"
                type="submit"
                disabled={savingShowtime || !selectedMovieId}
              >
                <Plus size={16} />{" "}
                {savingShowtime ? "Menyimpan..." : "Tambah Jadwal"}
              </button>
            </form>

            {showtimes.length > 0 && (
              <div className="mt-5 pt-4 border-t border-black/5 dark:border-white/10">
                <p className="text-[0.78rem] font-extrabold uppercase tracking-widest mb-3 text-slate-500 dark:text-[#5a5a70]">
                  Jadwal ({showtimes.length})
                </p>
                {showtimes.map((st) => (
                  <div
                    key={st.id}
                    className="flex items-center gap-2 px-3 py-2 rounded-lg text-[0.87rem] font-medium mb-1.5 bg-slate-100 dark:bg-[#1e1e2a] text-slate-700 dark:text-[#9090aa]"
                  >
                    <Clock
                      size={14}
                      className="text-violet-600 dark:text-violet-400"
                    />
                    {new Date(st.show_time).toLocaleString("id-ID", {
                      weekday: "short",
                      day: "numeric",
                      month: "short",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                    <span className="text-[0.75rem] text-slate-400 dark:text-[#5a5a70] ml-auto">
                      ID: {st.id}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </section>

          {/* ── Add Seats ── (full width) */}
          <section
            className="bg-white dark:bg-[#16161f] border border-black/5 dark:border-white/10 rounded-2xl p-6 shadow-md dark:shadow-none"
            style={{ gridColumn: "1 / -1" }}
          >
            {cardHeader(<Armchair size={20} />, "Tambah Kursi")}
            <form
              onSubmit={addSeats}
              className="flex flex-wrap gap-5 items-start"
            >
              <div className="flex flex-col gap-1.5 flex-1 min-w-[200px]">
                <label className="block text-[0.85rem] font-medium text-slate-600 dark:text-[#9090aa]">
                  Pilih Jadwal Tayang
                </label>
                <select
                  className="w-full px-4 py-3 bg-slate-100 dark:bg-[#1e1e2a] border border-slate-200 dark:border-white/10 rounded-xl text-slate-900 dark:text-white text-sm transition-all focus:border-violet-600 focus:ring-3 focus:ring-violet-600/20 outline-none appearance-none"
                  value={selectedShowtimeId}
                  onChange={(e) => setSelectedShowtimeId(e.target.value)}
                  style={{
                    backgroundImage:
                      "url(\"data:image/svg+xml;charset=UTF-8,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='%239090aa' stroke-width='2'%3E%3Cpolyline points='6 9 12 15 18 9'/%3E%3C/svg%3E\")",
                    backgroundRepeat: "no-repeat",
                    backgroundPosition: "right 12px center",
                    backgroundSize: "16px",
                  }}
                  required
                >
                  <option value="" className="bg-white dark:bg-[#111118]">
                    -- Pilih Jadwal (pilih film dulu di atas) --
                  </option>
                  {showtimes.map((st) => (
                    <option
                      key={st.id}
                      value={st.id}
                      className="bg-white dark:bg-[#111118]"
                    >
                      ID {st.id} —{" "}
                      {new Date(st.show_time).toLocaleString("id-ID", {
                        weekday: "short",
                        day: "numeric",
                        month: "short",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="block text-[0.85rem] font-medium text-slate-600 dark:text-[#9090aa]">
                  Kursi / Baris
                </label>
                <input
                  type="number"
                  min={1}
                  max={20}
                  className="w-[120px] px-4 py-3 bg-slate-100 dark:bg-[#1e1e2a] border border-slate-200 dark:border-white/10 rounded-xl text-slate-900 dark:text-white text-sm transition-all focus:border-violet-600 focus:ring-3 focus:ring-violet-600/20 outline-none"
                  value={seatsPerRow}
                  onChange={(e) => setSeatsPerRow(Number(e.target.value))}
                />
              </div>

              <div className="flex flex-col gap-1.5 flex-1 min-w-[200px]">
                <label className="block text-[0.85rem] font-medium text-slate-600 dark:text-[#9090aa]">
                  Pilih Baris ({selectedRows.join(", ")} —{" "}
                  {selectedRows.length * seatsPerRow} kursi)
                </label>
                <div className="flex gap-2.5 flex-wrap mt-1">
                  {ROWS_OPTIONS.map((r) => (
                    <button
                      key={r}
                      type="button"
                      className="w-10 h-10 rounded-xl font-extrabold text-[0.95rem] border-2 transition-all flex items-center justify-center cursor-pointer hover:border-violet-400"
                      style={
                        selectedRows.includes(r)
                          ? {
                              background: "var(--color-violet-600)",
                              borderColor: "var(--color-violet-500)",
                              color: "white",
                              backgroundColor: "#7c3aed",
                            }
                          : { background: "transparent" }
                      }
                      onClick={() => toggleRow(r)}
                    >
                      {r}
                    </button>
                  ))}
                </div>
              </div>

              <button
                className="inline-flex items-center justify-center gap-2 px-8 py-3.5 mt-auto rounded-xl font-bold transition-all bg-gradient-to-br from-violet-600 to-violet-500 text-white shadow-lg hover:-translate-y-0.5 disabled:opacity-50"
                type="submit"
                disabled={
                  savingSeats ||
                  !selectedShowtimeId ||
                  selectedRows.length === 0
                }
              >
                <CheckCircle size={18} />
                {savingSeats ? "Membuat..." : `Buat Kursi`}
              </button>
            </form>

            {selectedRows.length > 0 && seatsPerRow > 0 && (
              <div className="mt-6 pt-5 border-t border-black/5 dark:border-white/10">
                <p className="text-[0.8rem] font-extrabold uppercase tracking-widest mb-4 text-slate-500 dark:text-[#5a5a70]">
                  Preview Kursi
                </p>
                <div className="flex flex-col gap-3">
                  {selectedRows.map((row) => (
                    <div key={row} className="flex gap-2 flex-wrap">
                      {Array.from({ length: seatsPerRow }, (_, i) => (
                        <span
                          key={`${row}${i + 1}`}
                          className="px-3 py-1.5 rounded-lg border text-[0.8rem] font-bold bg-slate-100 dark:bg-[#1e1e2a] border-slate-200 dark:border-white/10 text-slate-600 dark:text-[#9090aa]"
                        >
                          {row}
                          {i + 1}
                        </span>
                      ))}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </section>
        </div>
      </div>
    </div>
  );
}
