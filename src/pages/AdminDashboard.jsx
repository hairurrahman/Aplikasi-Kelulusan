import React, { useState, useEffect } from "react";
import { Routes, Route, useNavigate, useLocation } from "react-router-dom";
import { auth, db } from "../firebase";
import { onAuthStateChanged, signOut } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import toast from "react-hot-toast";
import AdminSiswa from "../components/AdminSiswa";
import AdminNilai from "../components/AdminNilai";
import AdminDokumen from "../components/AdminDokumen";
import AdminPengaturan from "../components/AdminPengaturan";
import AdminHome from "../components/AdminHome";

const NAV_ITEMS = [
  { path: "", icon: "🏠", label: "Beranda" },
  { path: "siswa", icon: "👦", label: "Siswa" },
  { path: "nilai", icon: "📊", label: "Nilai" },
  { path: "dokumen", icon: "📄", label: "Dokumen" },
  { path: "pengaturan", icon: "⚙️", label: "Pengaturan" },
];

export default function AdminDashboard() {
  const navigate = useNavigate();
  const location = useLocation();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [tahunAjaran, setTahunAjaran] = useState("");

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (u) => {
      if (!u) {
        navigate("/");
        return;
      }
      // Verify admin
      const snap = await getDoc(doc(db, "admins", u.uid));
      if (!snap.exists()) {
        toast.error("Akses ditolak!");
        await signOut(auth);
        navigate("/");
        return;
      }
      setUser(u);
      setLoading(false);
    });
    return unsub;
  }, []); // eslint-disable-line

  // Load saved tahun ajaran
  useEffect(() => {
    const saved = localStorage.getItem("adminTahunAjaran");
    if (saved) setTahunAjaran(saved);
  }, []);

  function handleTahunAjaran(t) {
    setTahunAjaran(t);
    localStorage.setItem("adminTahunAjaran", t);
  }

  async function handleLogout() {
    await signOut(auth);
    navigate("/");
  }

  if (loading) {
    return (
      <div className="page-container" style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: "100vh" }}>
        <div style={{ textAlign: "center" }}>
          <div className="spinner" style={{ margin: "0 auto 16px" }} />
          <p style={{ color: "var(--text-light)", fontWeight: 700 }}>Memuat...</p>
        </div>
      </div>
    );
  }

  const currentPath = location.pathname.replace("/admin/", "").replace("/admin", "");

  return (
    <div className="page-container" style={{ paddingBottom: 80 }}>
      {/* Top Header */}
      <div style={{
        background: "linear-gradient(135deg, #2D3436, #636E72)",
        padding: "16px 20px",
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        boxShadow: "0 2px 10px rgba(0,0,0,0.15)",
        position: "sticky",
        top: 0,
        zIndex: 100,
      }}>
        <div>
          <h1 style={{ color: "white", fontSize: 18, marginBottom: 2 }}>Panel Admin</h1>
          <p style={{ color: "rgba(255,255,255,0.6)", fontSize: 12, fontWeight: 600 }}>
            {user?.email}
          </p>
        </div>
        <button onClick={handleLogout} style={{
          background: "rgba(255,255,255,0.15)",
          color: "white", padding: "8px 14px",
          borderRadius: 20, fontSize: 13, fontWeight: 700,
          border: "1.5px solid rgba(255,255,255,0.2)",
        }}>
          Keluar 👋
        </button>
      </div>

      {/* Content */}
      <div style={{ padding: "20px 20px 20px" }}>
        <Routes>
          <Route path="/" element={
            <AdminHome
              tahunAjaran={tahunAjaran}
              onChangeTahun={handleTahunAjaran}
              onLogout={handleLogout}
            />
          } />
          <Route path="/siswa" element={<AdminSiswa tahunAjaran={tahunAjaran} onChangeTahun={handleTahunAjaran} />} />
          <Route path="/nilai" element={<AdminNilai tahunAjaran={tahunAjaran} onChangeTahun={handleTahunAjaran} />} />
          <Route path="/dokumen" element={<AdminDokumen tahunAjaran={tahunAjaran} onChangeTahun={handleTahunAjaran} />} />
          <Route path="/pengaturan" element={<AdminPengaturan />} />
        </Routes>
      </div>

      {/* Bottom Navigation */}
      <div style={{
        position: "fixed",
        bottom: 0,
        left: "50%",
        transform: "translateX(-50%)",
        width: "430px",
        maxWidth: "100vw",
        background: "white",
        borderTop: "2px solid var(--border)",
        display: "flex",
        boxShadow: "0 -4px 20px rgba(0,0,0,0.1)",
        zIndex: 100,
      }}>
        {NAV_ITEMS.map((item) => {
          const isActive = currentPath === item.path;
          return (
            <button
              key={item.path}
              onClick={() => navigate(`/admin/${item.path}`)}
              style={{
                flex: 1,
                padding: "10px 0 12px",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: 3,
                background: "transparent",
                color: isActive ? "var(--primary)" : "var(--text-muted)",
                position: "relative",
              }}
            >
              {isActive && (
                <div style={{
                  position: "absolute",
                  top: 0, left: "20%", right: "20%",
                  height: 3,
                  background: "var(--primary)",
                  borderRadius: "0 0 4px 4px",
                }} />
              )}
              <span style={{ fontSize: 20 }}>{item.icon}</span>
              <span style={{ fontSize: 10, fontWeight: isActive ? 800 : 600 }}>{item.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
