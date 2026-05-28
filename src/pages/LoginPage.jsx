import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { db } from "../firebase";
import { doc, getDoc, collection, getDocs } from "firebase/firestore";
import { signInWithEmailAndPassword } from "firebase/auth";
import { auth } from "../firebase";
import toast from "react-hot-toast";

const EMOJIS = ["🌟", "🎉", "🌈", "🎓", "⭐", "🏆", "🌺", "🎈"];

export default function LoginPage() {
  const navigate = useNavigate();
  const [mode, setMode] = useState("siswa");
  const [nisn, setNisn] = useState("");
  const [tahunAjaran, setTahunAjaran] = useState("");
  const [tahunList, setTahunList] = useState([]);
  const [loadingTahun, setLoadingTahun] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [schoolInfo, setSchoolInfo] = useState({ nama: "Sekolah Dasar", logo: null });
  const [confetti, setConfetti] = useState([]);

  useEffect(() => {
    fetchSchoolInfo();
    fetchTahunAjaran();
  }, []); // eslint-disable-line

  async function fetchSchoolInfo() {
    try {
      const snap = await getDoc(doc(db, "settings", "sekolah"));
      if (snap.exists()) setSchoolInfo(snap.data());
    } catch (e) {}
  }

  async function fetchTahunAjaran() {
    setLoadingTahun(true);
    try {
      const snap = await getDocs(collection(db, "tahunAjaran"));
      const list = snap.docs.map((d) => d.id).sort().reverse();
      setTahunList(list);
      if (list.length > 0) setTahunAjaran(list[0]);
    } catch (e) {}
    setLoadingTahun(false);
  }

  async function handleLoginSiswa(e) {
    e.preventDefault();
    if (!nisn.trim()) {
      toast.error("Masukkan NISN dulu ya! 😊");
      return;
    }
    if (!tahunAjaran) {
      toast.error("Pilih tahun ajaran dulu!");
      return;
    }
    setLoading(true);
    try {
      const ref = doc(db, `tahunAjaran/${tahunAjaran}/siswa`, nisn.trim());
      const snap = await getDoc(ref);
      if (!snap.exists()) {
        toast.error("NISN tidak ditemukan! Cek kembali ya 😊");
        setLoading(false);
        return;
      }
      const data = snap.data();
      sessionStorage.setItem("siswaData", JSON.stringify({ ...data, nisn: nisn.trim(), tahunAjaran }));
      launchConfetti();
      setTimeout(() => navigate("/siswa"), 1000);
    } catch (err) {
      toast.error("Terjadi kesalahan. Coba lagi!");
    }
    setLoading(false);
  }

  async function handleLoginAdmin(e) {
    e.preventDefault();
    setLoading(true);
    try {
      await signInWithEmailAndPassword(auth, email, password);
      toast.success("Selamat datang, Admin! 👋");
      navigate("/admin");
    } catch (err) {
      toast.error("Email atau password salah!");
    }
    setLoading(false);
  }

  function launchConfetti() {
    const pieces = Array.from({ length: 30 }, (_, i) => ({
      id: i,
      left: Math.random() * 100,
      color: ["#FF6B6B", "#4ECDC4", "#FFE66D", "#845EF7", "#51CF66"][Math.floor(Math.random() * 5)],
      delay: Math.random() * 1,
      size: 8 + Math.random() * 8,
    }));
    setConfetti(pieces);
    setTimeout(() => setConfetti([]), 3000);
  }

  return (
    <div className="page-container">
      {/* Confetti */}
      {confetti.length > 0 && (
        <div className="confetti-container">
          {confetti.map((p) => (
            <div key={p.id} className="confetti-piece" style={{
              left: `${p.left}%`, background: p.color,
              width: p.size, height: p.size,
              animationDelay: `${p.delay}s`, animationDuration: "2.5s",
            }} />
          ))}
        </div>
      )}

      {/* Background */}
      <div style={{
        position: "fixed", top: 0, left: "50%", transform: "translateX(-50%)",
        width: "430px", maxWidth: "100vw", height: "100vh",
        background: "linear-gradient(180deg, #FF6B6B15 0%, #4ECDC420 50%, #FFE66D15 100%)",
        pointerEvents: "none", zIndex: 0
      }} />

      {/* Floating emojis */}
      {EMOJIS.map((e, i) => (
        <div key={i} style={{
          position: "fixed", fontSize: "24px", opacity: 0.15,
          top: `${10 + i * 11}%`, left: i % 2 === 0 ? "5%" : "88%",
          animation: `bounce ${2 + i * 0.3}s ease infinite`,
          animationDelay: `${i * 0.2}s`, pointerEvents: "none", zIndex: 0,
        }}>{e}</div>
      ))}

      <div style={{ position: "relative", zIndex: 1, padding: "32px 20px 40px" }}>
        {/* Header */}
        <div className="animate-fadeIn" style={{ textAlign: "center", marginBottom: "28px" }}>
          {schoolInfo.logo ? (
            <img src={schoolInfo.logo} alt="Logo Sekolah" style={{
              width: 80, height: 80, borderRadius: "50%", objectFit: "cover",
              border: "4px solid var(--primary)", marginBottom: 12,
              boxShadow: "0 4px 16px rgba(255,107,107,0.3)"
            }} />
          ) : (
            <div style={{ fontSize: 64, marginBottom: 8 }} className="animate-bounce">🎓</div>
          )}
          <h1 style={{ fontSize: 28, color: "var(--primary)", marginBottom: 4 }}>Cek Kelulusan</h1>
          <p style={{ fontSize: 14, color: "var(--text-light)", fontWeight: 600 }}>
            {schoolInfo.nama || "Sekolah Dasar"}
          </p>
        </div>

        {/* Mode Toggle */}
        <div className="animate-fadeIn" style={{
          display: "flex", background: "white", borderRadius: "var(--radius-sm)",
          padding: 4, marginBottom: 24, border: "2px solid var(--border)",
          boxShadow: "0 2px 10px rgba(0,0,0,0.05)"
        }}>
          {["siswa", "admin"].map((m) => (
            <button key={m} onClick={() => setMode(m)} style={{
              flex: 1, padding: "12px 0", borderRadius: 10,
              background: mode === m ? "linear-gradient(135deg, var(--primary), var(--primary-dark))" : "transparent",
              color: mode === m ? "white" : "var(--text-light)",
              fontSize: 15, fontWeight: 800,
              boxShadow: mode === m ? "0 3px 10px rgba(255,107,107,0.35)" : "none",
              transition: "all 0.3s ease",
            }}>
              {m === "siswa" ? "👦 Siswa" : "👨‍💼 Admin"}
            </button>
          ))}
        </div>

        {/* Siswa Form */}
        {mode === "siswa" && (
          <div className="card animate-slideIn">
            <h2 style={{ fontSize: 22, color: "var(--text)", marginBottom: 6 }}>Halo, Siswa! 👋</h2>
            <p style={{ fontSize: 13, color: "var(--text-light)", marginBottom: 20, fontWeight: 600 }}>
              Masukkan NISN kamu untuk cek kelulusan
            </p>
            <form onSubmit={handleLoginSiswa}>
              <div style={{ marginBottom: 16 }}>
                <label style={labelStyle}>📋 NISN (Nomor Induk Siswa)</label>
                <input className="input-field" type="text"
                  placeholder="Contoh: 0123456789"
                  value={nisn} onChange={(e) => setNisn(e.target.value)} maxLength={10} />
              </div>

              <div style={{ marginBottom: 24 }}>
                <label style={labelStyle}>📅 Tahun Ajaran</label>
                {loadingTahun ? (
                  <div style={{
                    padding: "14px 18px", border: "2.5px solid var(--border)",
                    borderRadius: "var(--radius-sm)", background: "#FFFAF5",
                    color: "var(--text-muted)", fontWeight: 600, fontSize: 14,
                  }}>
                    ⏳ Memuat tahun ajaran...
                  </div>
                ) : tahunList.length > 0 ? (
                  <select className="input-field" value={tahunAjaran}
                    onChange={(e) => setTahunAjaran(e.target.value)}>
                    <option value="">-- Pilih Tahun Ajaran --</option>
                    {tahunList.map((t) => (
                      <option key={t} value={t}>{t}</option>
                    ))}
                  </select>
                ) : (
                  <div style={{
                    padding: "14px 18px", border: "2.5px solid #FFE66D",
                    borderRadius: "var(--radius-sm)", background: "#FFFBF0",
                    color: "#E67E22", fontWeight: 700, fontSize: 13,
                    display: "flex", alignItems: "center", gap: 8,
                  }}>
                    ⚠️ Belum ada tahun ajaran. Hubungi admin sekolah.
                  </div>
                )}
              </div>

              <button className="btn-primary" type="submit"
                disabled={loading || tahunList.length === 0 || !tahunAjaran}>
                {loading ? "Memeriksa..." : "🔍 Cek Kelulusan"}
              </button>
            </form>
          </div>
        )}

        {/* Admin Form */}
        {mode === "admin" && (
          <div className="card animate-slideIn">
            <h2 style={{ fontSize: 22, color: "var(--text)", marginBottom: 6 }}>Login Admin 🔐</h2>
            <p style={{ fontSize: 13, color: "var(--text-light)", marginBottom: 20, fontWeight: 600 }}>
              Khusus untuk guru dan staff sekolah
            </p>
            <form onSubmit={handleLoginAdmin}>
              <div style={{ marginBottom: 16 }}>
                <label style={labelStyle}>📧 Email</label>
                <input className="input-field" type="email" placeholder="admin@sekolah.com"
                  value={email} onChange={(e) => setEmail(e.target.value)} />
              </div>
              <div style={{ marginBottom: 24 }}>
                <label style={labelStyle}>🔑 Password</label>
                <input className="input-field" type="password" placeholder="••••••••"
                  value={password} onChange={(e) => setPassword(e.target.value)} />
              </div>
              <button className="btn-primary" type="submit" disabled={loading}>
                {loading ? "Masuk..." : "🚀 Masuk"}
              </button>
            </form>
          </div>
        )}

        <p style={{ textAlign: "center", marginTop: 28, fontSize: 12, color: "var(--text-muted)", fontWeight: 600 }}>
          Made with ❤️ untuk siswa berprestasi
        </p>
      </div>
    </div>
  );
}

const labelStyle = {
  fontSize: 13, fontWeight: 700, color: "var(--text-light)", display: "block", marginBottom: 6
};
