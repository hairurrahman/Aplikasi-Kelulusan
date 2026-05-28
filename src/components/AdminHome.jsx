import React, { useState, useEffect } from "react";
import { db } from "../firebase";
import { collection, getDocs, getDoc, doc } from "firebase/firestore";

export default function AdminHome({ tahunAjaran, onChangeTahun }) {
  const [stats, setStats] = useState({ siswa: 0, nilai: 0, dokumen: 0, lulus: 0 });
  const [tahunList, setTahunList] = useState([]);
  const [schoolInfo, setSchoolInfo] = useState({});
  const [loading, setLoading] = useState(false);

  useEffect(() => { fetchTahunList(); }, []); // eslint-disable-line
  useEffect(() => { fetchSchool(); }, []); // eslint-disable-line

  useEffect(() => { if (tahunAjaran) fetchStats(); }, [tahunAjaran]); // eslint-disable-line

  async function fetchSchool() {
    try {
      const snap = await getDoc(doc(db, "settings", "sekolah"));
      if (snap.exists()) setSchoolInfo(snap.data());
    } catch (e) {}
  }

  async function fetchTahunList() {
    try {
      const snap = await getDocs(collection(db, "tahunAjaran"));
      const list = snap.docs.map((d) => d.id).sort().reverse();
      setTahunList(list);
    } catch (e) {}
  }

  async function fetchStats() {
    if (!tahunAjaran) return;
    setLoading(true);
    try {
      const [siswaSnap, nilaiSnap, dokSnap] = await Promise.all([
        getDocs(collection(db, `tahunAjaran/${tahunAjaran}/siswa`)),
        getDocs(collection(db, `tahunAjaran/${tahunAjaran}/nilai`)),
        getDocs(collection(db, `tahunAjaran/${tahunAjaran}/dokumen`)),
      ]);
      const lulusCount = nilaiSnap.docs.filter((d) => d.data().status === "LULUS").length;
      setStats({
        siswa: siswaSnap.size,
        nilai: nilaiSnap.size,
        dokumen: dokSnap.size,
        lulus: lulusCount,
      });
    } catch (e) {}
    setLoading(false);
  }

  const statCards = [
    { label: "Total Siswa", value: stats.siswa, icon: "👦", color: "var(--blue)", bg: "#E8F4FD" },
    { label: "Data Nilai", value: stats.nilai, icon: "📊", color: "var(--purple)", bg: "#F3EEFF" },
    { label: "Lulus", value: stats.lulus, icon: "🎉", color: "var(--success)", bg: "#EDFFF4" },
    { label: "SKL Upload", value: stats.dokumen, icon: "📄", color: "var(--secondary)", bg: "#E6FFFE" },
  ];

  return (
    <div>
      {/* School Info */}
      <div className="card animate-fadeIn" style={{
        marginBottom: 20,
        background: "linear-gradient(135deg, var(--primary), #FF922B)",
        border: "none",
        display: "flex",
        alignItems: "center",
        gap: 16,
      }}>
        {schoolInfo.logo ? (
          <img src={schoolInfo.logo} alt="Logo" style={{
            width: 56, height: 56, borderRadius: "50%", objectFit: "cover",
            border: "3px solid rgba(255,255,255,0.5)",
            flexShrink: 0,
          }} />
        ) : (
          <div style={{ fontSize: 44, flexShrink: 0 }}>🏫</div>
        )}
        <div>
          <h2 style={{ color: "white", fontSize: 18, marginBottom: 2 }}>
            {schoolInfo.nama || "Nama Sekolah"}
          </h2>
          <p style={{ color: "rgba(255,255,255,0.8)", fontSize: 12, fontWeight: 600 }}>
            Panel Administrasi Kelulusan
          </p>
        </div>
      </div>

      {/* Tahun Ajaran Selector */}
      <div className="card animate-fadeIn" style={{ marginBottom: 20 }}>
        <label style={{ fontSize: 13, fontWeight: 700, color: "var(--text-light)", display: "block", marginBottom: 8 }}>
          📅 Tahun Ajaran Aktif
        </label>
        <div style={{ display: "flex", gap: 8 }}>
          <select
            className="input-field"
            value={tahunAjaran}
            onChange={(e) => onChangeTahun(e.target.value)}
            style={{ flex: 1 }}
          >
            <option value="">-- Pilih Tahun Ajaran --</option>
            {tahunList.map((t) => <option key={t} value={t}>{t}</option>)}
          </select>
        </div>
        <p style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 6, fontWeight: 600 }}>
          💡 Tambah tahun ajaran baru di menu Siswa
        </p>
      </div>

      {/* Stats Grid */}
      {tahunAjaran && (
        <div className="animate-fadeIn" style={{ marginBottom: 20 }}>
          <h3 style={{ fontSize: 16, color: "var(--text)", marginBottom: 14 }}>
            📈 Statistik {tahunAjaran}
          </h3>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            {statCards.map((s, i) => (
              <div key={i} style={{
                background: s.bg,
                borderRadius: "var(--radius-sm)",
                padding: "16px",
                border: `2px solid ${s.color}30`,
                textAlign: "center",
              }}>
                <div style={{ fontSize: 32, marginBottom: 6 }}>{s.icon}</div>
                <div style={{ fontSize: 28, fontWeight: 900, color: s.color, fontFamily: "Fredoka One, cursive" }}>
                  {loading ? "..." : s.value}
                </div>
                <div style={{ fontSize: 12, color: "var(--text-light)", fontWeight: 700 }}>{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Quick Tips */}
      <div className="card animate-fadeIn" style={{ background: "#FFFBF0", border: "2px solid var(--accent)" }}>
        <h3 style={{ fontSize: 15, marginBottom: 12, color: "#E67E22" }}>💡 Panduan Cepat</h3>
        {[
          "Tambah data siswa di menu 👦 Siswa",
          "Input nilai kelulusan di menu 📊 Nilai",
          "Upload SKL di menu 📄 Dokumen",
          "Atur nama & logo sekolah di ⚙️ Pengaturan",
        ].map((tip, i) => (
          <div key={i} style={{
            fontSize: 13, fontWeight: 600, color: "var(--text)",
            padding: "6px 0",
            borderBottom: i < 3 ? "1px dashed var(--border)" : "none",
          }}>
            {i + 1}. {tip}
          </div>
        ))}
      </div>
    </div>
  );
}
