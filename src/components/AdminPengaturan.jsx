import React, { useState, useEffect, useRef } from "react";
import { db } from "../firebase";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { auth } from "../firebase";
import { createUserWithEmailAndPassword } from "firebase/auth";
import toast from "react-hot-toast";

export default function AdminPengaturan() {
  const [namaSekolah, setNamaSekolah] = useState("");
  const [logoPreview, setLogoPreview] = useState("");
  const [logoBase64, setLogoBase64] = useState("");
  const [saving, setSaving] = useState(false);
  const [converting, setConverting] = useState(false);
  const [newAdminEmail, setNewAdminEmail] = useState("");
  const [newAdminPass, setNewAdminPass] = useState("");
  const [addingAdmin, setAddingAdmin] = useState(false);
  const [showAddAdmin, setShowAddAdmin] = useState(false);
  const fileRef = useRef();

  useEffect(() => { fetchSettings(); }, []); // eslint-disable-line

  async function fetchSettings() {
    try {
      const snap = await getDoc(doc(db, "settings", "sekolah"));
      if (snap.exists()) {
        const data = snap.data();
        setNamaSekolah(data.nama || "");
        if (data.logo) {
          setLogoBase64(data.logo);
          setLogoPreview(data.logo);
        }
      }
    } catch (e) {}
  }

  function handleLogoSelect(e) {
    const file = e.target.files[0];
    if (!file) return;
    const allowed = ["webp", "png", "jpg", "jpeg"];
    const ext = file.name.split(".").pop().toLowerCase();
    if (!allowed.includes(ext)) {
      toast.error("Format logo: WEBP, PNG, JPG");
      return;
    }
    if (file.size > 200 * 1024) {
      toast.error("Ukuran logo maksimal 200KB agar bisa disimpan di Firestore!");
      return;
    }
    setConverting(true);
    const reader = new FileReader();
    reader.onload = (ev) => {
      const base64 = ev.target.result;
      setLogoBase64(base64);
      setLogoPreview(base64);
      setConverting(false);
      toast.success("Logo siap disimpan! ✅");
    };
    reader.readAsDataURL(file);
  }

  async function saveSettings() {
    if (!namaSekolah.trim()) {
      toast.error("Nama sekolah wajib diisi!");
      return;
    }
    setSaving(true);
    try {
      await setDoc(doc(db, "settings", "sekolah"), {
        nama: namaSekolah.trim(),
        logo: logoBase64,
        updatedAt: new Date().toISOString(),
      });
      toast.success("Pengaturan berhasil disimpan! 🎉");
    } catch (e) {
      toast.error("Gagal menyimpan: " + e.message);
    }
    setSaving(false);
  }

  async function addAdmin() {
    if (!newAdminEmail || !newAdminPass) {
      toast.error("Email dan password wajib diisi!");
      return;
    }
    if (newAdminPass.length < 6) {
      toast.error("Password minimal 6 karakter!");
      return;
    }
    setAddingAdmin(true);
    try {
      const userCred = await createUserWithEmailAndPassword(auth, newAdminEmail, newAdminPass);
      await setDoc(doc(db, "admins", userCred.user.uid), {
        email: newAdminEmail,
        createdAt: new Date().toISOString(),
      });
      toast.success("Admin baru berhasil ditambahkan!");
      setNewAdminEmail("");
      setNewAdminPass("");
      setShowAddAdmin(false);
    } catch (e) {
      if (e.code === "auth/email-already-in-use") {
        toast.error("Email sudah terdaftar!");
      } else {
        toast.error("Gagal: " + e.message);
      }
    }
    setAddingAdmin(false);
  }

  return (
    <div>
      <h2 style={{ fontSize: 22, color: "var(--text)", marginBottom: 16 }}>⚙️ Pengaturan</h2>

      {/* Info Sekolah */}
      <div className="card animate-fadeIn" style={{ marginBottom: 16 }}>
        <h3 style={{ fontSize: 16, color: "var(--primary)", marginBottom: 14 }}>🏫 Informasi Sekolah</h3>

        {/* Logo */}
        <div style={{ marginBottom: 16 }}>
          <label style={labelStyle}>🖼️ Logo Sekolah (WEBP/PNG/JPG, maks 200KB)</label>
          <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 10 }}>
            {logoPreview ? (
              <img src={logoPreview} alt="Preview Logo"
                style={{
                  width: 72, height: 72, borderRadius: "50%", objectFit: "cover",
                  border: "3px solid var(--primary)",
                  boxShadow: "0 4px 12px rgba(255,107,107,0.3)",
                }} />
            ) : (
              <div style={{
                width: 72, height: 72, borderRadius: "50%",
                background: "linear-gradient(135deg, #f0f0f0, #e0e0e0)",
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: 32, border: "3px dashed var(--border)",
              }}>🏫</div>
            )}
            <div style={{ flex: 1 }}>
              <input type="file" ref={fileRef} style={{ display: "none" }}
                onChange={handleLogoSelect} accept=".webp,.png,.jpg,.jpeg" />
              <button onClick={() => fileRef.current?.click()} className="btn-secondary"
                style={{ marginBottom: 6 }} disabled={converting}>
                {converting ? "Memproses..." : logoPreview ? "🔄 Ganti Logo" : "📤 Pilih Logo"}
              </button>
              <p style={{ fontSize: 11, color: "var(--text-muted)", fontWeight: 600 }}>
                💡 Logo disimpan langsung ke database, tidak perlu Storage
              </p>
            </div>
          </div>
        </div>

        {/* Nama Sekolah */}
        <div style={{ marginBottom: 16 }}>
          <label style={labelStyle}>🏷️ Nama Sekolah *</label>
          <input className="input-field" placeholder="Contoh: SDN 1 Surabaya"
            value={namaSekolah} onChange={(e) => setNamaSekolah(e.target.value)} />
        </div>

        <button className="btn-primary" onClick={saveSettings} disabled={saving}>
          {saving ? "Menyimpan..." : "💾 Simpan Pengaturan"}
        </button>
      </div>

      {/* Preview */}
      {(namaSekolah || logoPreview) && (
        <div className="card animate-fadeIn" style={{
          marginBottom: 16,
          background: "linear-gradient(135deg, #FF6B6B15, #4ECDC420)",
          border: "2px dashed var(--primary)",
        }}>
          <p style={{ fontSize: 13, fontWeight: 700, color: "var(--text-light)", marginBottom: 10 }}>
            👁️ Preview Tampilan Login:
          </p>
          <div style={{ textAlign: "center", padding: "12px 0" }}>
            {logoPreview && (
              <img src={logoPreview} alt="Logo"
                style={{ width: 60, height: 60, borderRadius: "50%", objectFit: "cover", border: "3px solid var(--primary)", marginBottom: 8 }} />
            )}
            <p style={{ fontFamily: "Fredoka One, cursive", fontSize: 22, color: "var(--primary)", marginBottom: 2 }}>Cek Kelulusan</p>
            <p style={{ fontSize: 12, color: "var(--text-light)", fontWeight: 600 }}>{namaSekolah}</p>
          </div>
        </div>
      )}

      {/* Tambah Admin */}
      <div className="card animate-fadeIn" style={{ marginBottom: 16 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: showAddAdmin ? 14 : 0 }}>
          <h3 style={{ fontSize: 16, color: "var(--purple)" }}>👤 Tambah Admin</h3>
          <button onClick={() => setShowAddAdmin(!showAddAdmin)} style={{
            background: showAddAdmin ? "#f0f0f0" : "linear-gradient(135deg, var(--purple), #6B4CE0)",
            color: showAddAdmin ? "var(--text)" : "white",
            padding: "8px 14px", borderRadius: 20, fontSize: 12, fontWeight: 700,
          }}>
            {showAddAdmin ? "Tutup" : "+ Tambah"}
          </button>
        </div>
        {showAddAdmin && (
          <div className="animate-fadeIn">
            <div style={{ marginBottom: 12 }}>
              <label style={labelStyle}>📧 Email Admin Baru</label>
              <input className="input-field" type="email" placeholder="admin@sekolah.com"
                value={newAdminEmail} onChange={(e) => setNewAdminEmail(e.target.value)} />
            </div>
            <div style={{ marginBottom: 14 }}>
              <label style={labelStyle}>🔑 Password (min. 6 karakter)</label>
              <input className="input-field" type="password" placeholder="Password"
                value={newAdminPass} onChange={(e) => setNewAdminPass(e.target.value)} />
            </div>
            <button onClick={addAdmin} disabled={addingAdmin}
              style={{
                width: "100%", padding: "12px",
                background: "linear-gradient(135deg, var(--purple), #6B4CE0)",
                color: "white", borderRadius: "var(--radius-sm)",
                fontWeight: 800, fontSize: 15,
                boxShadow: "0 4px 12px rgba(132,94,247,0.4)",
              }}>
              {addingAdmin ? "Membuat akun..." : "👤 Buat Akun Admin"}
            </button>
          </div>
        )}
      </div>

      {/* Info */}
      <div className="card animate-fadeIn" style={{ background: "#F0FFF4", border: "2px solid var(--success)" }}>
        <h3 style={{ fontSize: 14, color: "var(--success)", marginBottom: 10 }}>✅ Mode Gratis</h3>
        <div style={{ fontSize: 12, color: "var(--text-light)", fontWeight: 600, lineHeight: 1.8 }}>
          <p>🖼️ Logo → disimpan sebagai base64 di Firestore</p>
          <p>📄 SKL → pakai link URL Google Drive</p>
          <p>🗄️ Database → Firestore (gratis)</p>
          <p>🔑 Auth → Firebase Authentication (gratis)</p>
        </div>
      </div>
    </div>
  );
}

const labelStyle = { fontSize: 12, fontWeight: 700, color: "var(--text-light)", display: "block", marginBottom: 6 };
