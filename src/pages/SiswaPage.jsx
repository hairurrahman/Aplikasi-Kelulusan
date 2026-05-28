import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { db } from "../firebase";
import { doc, getDoc } from "firebase/firestore";

const MAPEL_URUTAN = [
  "Pendidikan Agama Islam dan Budi Pekerti",
  "Pendidikan Pancasila",
  "Bahasa Indonesia",
  "Matematika",
  "Ilmu Pengetahuan Alam dan Sosial",
  "Pendidikan Jasmani Olahraga dan Kesehatan",
  "Seni dan Budaya",
  "Bahasa Inggris",
  "Bahasa Madura",
];

const STARS = Array.from({ length: 12 }, (_, i) => ({
  id: i, size: 8 + Math.random() * 16,
  top: Math.random() * 90, left: Math.random() * 90,
  delay: Math.random() * 3, duration: 2 + Math.random() * 2,
}));

export default function SiswaPage() {
  const navigate = useNavigate();
  const [siswa, setSiswa] = useState(null);
  const [nilai, setNilai] = useState(null);
  const [dokumen, setDokumen] = useState(null);
  const [schoolInfo, setSchoolInfo] = useState({});
  const [loading, setLoading] = useState(true);
  const [confetti, setConfetti] = useState([]);

  useEffect(() => {
    const raw = sessionStorage.getItem("siswaData");
    if (!raw) { navigate("/"); return; }
    const data = JSON.parse(raw);
    setSiswa(data);
    fetchData(data);
    fetchSchoolInfo();
  }, []); // eslint-disable-line

  async function fetchSchoolInfo() {
    try {
      const snap = await getDoc(doc(db, "settings", "sekolah"));
      if (snap.exists()) setSchoolInfo(snap.data());
    } catch (e) {}
  }

  async function fetchData(data) {
    setLoading(true);
    try {
      const nilaiRef = doc(db, `tahunAjaran/${data.tahunAjaran}/nilai`, data.nisn);
      const nilaiSnap = await getDoc(nilaiRef);
      if (nilaiSnap.exists()) setNilai(nilaiSnap.data());
      const dokRef = doc(db, `tahunAjaran/${data.tahunAjaran}/dokumen`, data.nisn);
      const dokSnap = await getDoc(dokRef);
      if (dokSnap.exists()) setDokumen(dokSnap.data());
    } catch (e) {}
    setLoading(false);
  }

  function handleLogout() {
    sessionStorage.removeItem("siswaData");
    navigate("/");
  }

  function launchConfetti() {
    const pieces = Array.from({ length: 40 }, (_, i) => ({
      id: i, left: Math.random() * 100,
      color: ["#FF6B6B", "#4ECDC4", "#FFE66D", "#845EF7", "#51CF66", "#FF922B"][Math.floor(Math.random() * 6)],
      delay: Math.random() * 2, size: 8 + Math.random() * 10, duration: 2.5 + Math.random() * 1.5,
    }));
    setConfetti(pieces);
    setTimeout(() => setConfetti([]), 5000);
  }

  useEffect(() => {
    if (!loading && siswa && nilai?.status === "LULUS") setTimeout(launchConfetti, 500);
  }, [loading, siswa, nilai]); // eslint-disable-line

  if (loading) {
    return (
      <div className="page-container" style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: "100vh" }}>
        <div style={{ textAlign: "center" }}>
          <div className="spinner" style={{ margin: "0 auto 16px" }} />
          <p style={{ color: "var(--text-light)", fontWeight: 700 }}>Mencari data kamu...</p>
        </div>
      </div>
    );
  }

  const isLulus = nilai?.status === "LULUS";

  // Susun nilai sesuai urutan MAPEL_URUTAN
  const nilaiTerurut = MAPEL_URUTAN.map((m) => ({
    mapel: m,
    val: nilai?.mapel?.[m] ?? null,
  })).filter((item) => item.val !== null);

  return (
    <div className="page-container">
      {/* Confetti */}
      {confetti.length > 0 && (
        <div className="confetti-container">
          {confetti.map((p) => (
            <div key={p.id} className="confetti-piece" style={{
              left: `${p.left}%`, background: p.color,
              width: p.size, height: p.size,
              animationDelay: `${p.delay}s`, animationDuration: `${p.duration}s`,
            }} />
          ))}
        </div>
      )}

      {/* Stars */}
      <div style={{ position: "fixed", top: 0, left: "50%", transform: "translateX(-50%)", width: "430px", maxWidth: "100vw", height: "100vh", pointerEvents: "none", zIndex: 0, overflow: "hidden" }}>
        {STARS.map((s) => (
          <div key={s.id} style={{
            position: "absolute", width: s.size, height: s.size,
            top: `${s.top}%`, left: `${s.left}%`,
            background: isLulus ? "#FFE66D" : "#B2BEC3",
            borderRadius: "50%", opacity: 0.3,
            animation: `twinkle ${s.duration}s infinite alternate`,
            animationDelay: `${s.delay}s`,
          }} />
        ))}
      </div>

      <div style={{ position: "relative", zIndex: 1, paddingBottom: 40 }}>
        {/* Top Bar */}
        <div style={{
          background: isLulus ? "linear-gradient(135deg, #FF6B6B, #FF922B)" : "linear-gradient(135deg, #636E72, #2D3436)",
          padding: "24px 20px 60px", borderRadius: "0 0 40px 40px", marginBottom: -40,
          boxShadow: "0 4px 20px rgba(0,0,0,0.15)",
        }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              {schoolInfo.logo && (
                <img src={schoolInfo.logo} alt="Logo" style={{ width: 36, height: 36, objectFit: "cover" }} />
              )}
              <div>
                <p style={{ fontSize: 11, color: "rgba(255,255,255,0.7)", fontWeight: 700 }}>Hasil Kelulusan</p>
                <p style={{ fontSize: 13, color: "white", fontWeight: 800 }}>{schoolInfo.nama || "Sekolah Dasar"}</p>
              </div>
            </div>
            <button onClick={handleLogout} style={{ background: "rgba(255,255,255,0.2)", color: "white", padding: "8px 16px", borderRadius: 20, fontSize: 13, fontWeight: 700 }}>
              Keluar
            </button>
          </div>
          <p style={{ color: "rgba(255,255,255,0.85)", fontSize: 13, fontWeight: 600 }}>
            Tahun Ajaran: <strong>{siswa?.tahunAjaran}</strong>
          </p>
        </div>

        <div style={{ padding: "0 20px" }}>
          {/* Status */}
          <div className="card animate-popIn" style={{
            textAlign: "center", marginBottom: 20,
            border: `3px solid ${isLulus ? "var(--success)" : "#FF6B6B"}`,
            background: isLulus ? "linear-gradient(135deg, #F0FFF4, #E6FFFA)" : "linear-gradient(135deg, #FFF5F5, #FFF0F0)",
          }}>
            <div style={{ fontSize: 72, marginBottom: 8 }} className="animate-bounce">{isLulus ? "🎉" : "😔"}</div>
            <h1 style={{ fontSize: 32, marginBottom: 4, color: isLulus ? "#2ECC71" : "#E74C3C" }}>
              {isLulus ? "LULUS!" : "BELUM LULUS"}
            </h1>
            {isLulus && <p style={{ fontSize: 14, color: "var(--text-light)", fontWeight: 700 }}>🌟 Selamat! Kamu berhasil! 🌟</p>}
          </div>

          {/* Data Siswa */}
          <div className="card animate-fadeIn" style={{ marginBottom: 16 }}>
            <h3 style={{ fontSize: 16, color: "var(--primary)", marginBottom: 14 }}>👤 Data Siswa</h3>
            {[
              { label: "Nama Lengkap", value: siswa?.nama || "-", icon: "📛" },
              { label: "NISN", value: siswa?.nisn, icon: "🔢" },
              { label: "Kelas", value: siswa?.kelas || "-", icon: "🏫" },
              { label: "Jenis Kelamin", value: siswa?.jenisKelamin || "-", icon: "👦" },
              { label: "Tempat, Tgl Lahir", value: siswa?.ttl || "-", icon: "📅" },
            ].map((item, i) => (
              <div key={i} style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", padding: "8px 0", borderBottom: i < 4 ? "1.5px dashed var(--border)" : "none" }}>
                <span style={{ fontSize: 13, color: "var(--text-light)", fontWeight: 600, display: "flex", gap: 6 }}>
                  <span>{item.icon}</span>{item.label}
                </span>
                <span style={{ fontSize: 13, fontWeight: 800, color: "var(--text)", textAlign: "right", maxWidth: "55%" }}>{item.value}</span>
              </div>
            ))}
          </div>

          {/* Nilai — urutan benar */}
          {nilaiTerurut.length > 0 && (
            <div className="card animate-fadeIn" style={{ marginBottom: 16 }}>
              <h3 style={{ fontSize: 16, color: "var(--secondary)", marginBottom: 14 }}>📊 Nilai Kelulusan</h3>
              {nilaiTerurut.map((item, i) => (
                <div key={i} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "8px 0", borderBottom: i < nilaiTerurut.length - 1 ? "1.5px dashed var(--border)" : "none", gap: 8 }}>
                  <span style={{ fontSize: 12, color: "var(--text)", fontWeight: 700, flex: 1, lineHeight: 1.3 }}>
                    {i + 1}. {item.mapel}
                  </span>
                  <div style={{
                    background: item.val >= 70 ? "linear-gradient(135deg, var(--success), #3ECC61)" : "linear-gradient(135deg, #FF6B6B, #E05555)",
                    color: "white", padding: "4px 14px", borderRadius: 20,
                    fontWeight: 800, fontSize: 14, minWidth: 52, textAlign: "center", flexShrink: 0,
                  }}>{item.val}</div>
                </div>
              ))}
              {nilai?.rataRata !== undefined && (
                <div style={{ marginTop: 12, padding: "12px 16px", background: "linear-gradient(135deg, var(--accent), #FFD700)", borderRadius: "var(--radius-sm)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <span style={{ fontWeight: 800, fontSize: 14 }}>⭐ Rata-rata</span>
                  <span style={{ fontWeight: 900, fontSize: 18 }}>{nilai.rataRata}</span>
                </div>
              )}
            </div>
          )}

          {/* Catatan */}
          {nilai?.catatan && (
            <div className="card animate-fadeIn" style={{ marginBottom: 16, background: "#FFF9E6", border: "2px solid var(--accent)" }}>
              <h3 style={{ fontSize: 14, color: "#E67E22", marginBottom: 8 }}>📝 Catatan</h3>
              <p style={{ fontSize: 13, color: "var(--text)", fontWeight: 600, lineHeight: 1.6 }}>{nilai.catatan}</p>
            </div>
          )}

          {/* SKL */}
          {dokumen?.url && (
            <div className="card animate-fadeIn" style={{ marginBottom: 16, background: "linear-gradient(135deg, #F0F7FF, #E8F4FD)", border: "2px solid var(--blue)" }}>
              <h3 style={{ fontSize: 16, color: "var(--blue)", marginBottom: 12 }}>📄 Surat Keterangan Kelulusan</h3>
              <p style={{ fontSize: 13, color: "var(--text-light)", fontWeight: 600, marginBottom: 14 }}>SKL kamu sudah tersedia!</p>
              <a href={dokumen.url} target="_blank" rel="noopener noreferrer" style={{
                display: "block", textAlign: "center",
                background: "linear-gradient(135deg, var(--blue), #1E8FD5)",
                color: "white", padding: "14px", borderRadius: "var(--radius-sm)",
                fontWeight: 800, fontSize: 15, textDecoration: "none",
                boxShadow: "0 4px 12px rgba(51,154,240,0.4)",
              }}>📥 Unduh / Lihat SKL</a>
            </div>
          )}

          {/* Motivasi */}
          <div className="card animate-fadeIn" style={{ background: "linear-gradient(135deg, var(--primary), #FF8E8E)", border: "none", textAlign: "center" }}>
            <div style={{ fontSize: 36, marginBottom: 8 }}>{isLulus ? "🚀" : "💪"}</div>
            <p style={{ color: "white", fontWeight: 700, fontSize: 14, lineHeight: 1.6 }}>
              {isLulus ? "Selamat! Kamu telah menyelesaikan pendidikan dasar dengan baik. Semangat terus meraih impian! 🌟" : "Jangan menyerah! Setiap usaha pasti ada hasilnya. Terus belajar dan berkembang! 💪"}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
