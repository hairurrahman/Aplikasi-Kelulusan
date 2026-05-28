import React, { useState, useEffect, useRef } from "react";
import { db, storage } from "../firebase";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { ref, uploadBytesResumable, getDownloadURL } from "firebase/storage";
import { auth } from "../firebase";
import { createUserWithEmailAndPassword } from "firebase/auth";
import toast from "react-hot-toast";

export default function AdminPengaturan() {
  const [namaSekolah, setNamaSekolah] = useState("");
  const [logoUrl, setLogoUrl] = useState("");
  const [logoFile, setLogoFile] = useState(null);
  const [logoPreview, setLogoPreview] = useState("");
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [newAdminEmail, setNewAdminEmail] = useState("");
  const [newAdminPass, setNewAdminPass] = useState("");
  const [addingAdmin, setAddingAdmin] = useState(false);
  const [showAddAdmin, setShowAddAdmin] = useState(false);
  const fileRef = useRef();

  useEffect(() => { fetchSettings(); }, []);

  async function fetchSettings() {
    try {
      const snap = await getDoc(doc(db, "settings", "sekolah"));
      if (snap.exists()) {
        const data = snap.data();
        setNamaSekolah(data.nama || "");
        setLogoUrl(data.logo || "");
        if (data.logo) setLogoPreview(data.logo);
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
    if (file.size > 2 * 1024 * 1024) {
      toast.error("Ukuran logo maksimal 2MB");
      return;
    }
    setLogoFile(file);
    setLogoPreview(URL.createObjectURL(file));
  }

  async function uploadLogo() {
    if (!logoFile) return logoUrl;
    setUploading(true);
    setUploadProgress(0);
    return new Promise((resolve, reject) => {
      const ext = logoFile.name.split(".").pop().toLowerCase();
      const storageRef = ref(storage, `settings/logo_sekolah.${ext}`);
      const uploadTask = uploadBytesResumable(storageRef, logoFile);
      uploadTask.on("state_changed",
        (s) => {
          setUploadProgress(Math.round((s.bytesTransferred / s.totalBytes) * 100));
        },
        (err) => {
          setUploading(false);
          reject(err);
        },
        async () => {
          const url = await getDownloadURL(uploadTask.snapshot.ref);
          setUploading(false);
          setLogoUrl(url);
          resolve(url);
        }
      );
    });
  }

  async function saveSettings() {
    if (!namaSekolah.trim()) {
      toast.error("Nama sekolah wajib diisi!");
      return;
    }
    setSaving(true);
    try {
      let finalLogo = logoUrl;
      if (logoFile) {
        finalLogo = await uploadLogo();
      }
      await setDoc(doc(db, "settings", "sekolah"), {
        nama: namaSekolah.trim(),
        logo: finalLogo,
        updatedAt: new Date().toISOString(),
      });
      toast.success("Pengaturan berhasil disimpan! 🎉");
      setLogoFile(null);
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
          <label style={labelStyle}>🖼️ Logo Sekolah (WEBP/PNG/JPG, maks 2MB)</label>
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
                style={{ marginBottom: 6 }}>
                {logoPreview ? "🔄 Ganti Logo" : "📤 Pilih Logo"}
              </button>
              {logoFile && (
                <p style={{ fontSize: 11, color: "var(--success)", fontWeight: 700 }}>
                  ✅ {logoFile.name}
                </p>
              )}
            </div>
          </div>
          {uploading && (
            <div>
              <div style={{ background: "var(--border)", borderRadius: 10, height: 8, overflow: "hidden" }}>
                <div style={{
                  width: `${uploadProgress}%`, height: "100%",
                  background: "linear-gradient(90deg, var(--secondary), var(--primary))",
                  borderRadius: 10, transition: "width 0.3s ease",
                }} />
              </div>
              <p style={{ fontSize: 12, color: "var(--text-light)", fontWeight: 700, marginTop: 4 }}>
                Mengupload logo... {uploadProgress}%
              </p>
            </div>
          )}
        </div>

        {/* Nama Sekolah */}
        <div style={{ marginBottom: 16 }}>
          <label style={labelStyle}>🏷️ Nama Sekolah *</label>
          <input className="input-field" placeholder="Contoh: SDN 1 Surabaya"
            value={namaSekolah} onChange={(e) => setNamaSekolah(e.target.value)} />
        </div>

        <button className="btn-primary" onClick={saveSettings} disabled={saving || uploading}>
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
            <p style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 8, fontWeight: 600, textAlign: "center" }}>
              ⚠️ Setelah dibuat, admin baru bisa login dari halaman utama
            </p>
          </div>
        )}
      </div>

      {/* Info Firebase */}
      <div className="card animate-fadeIn" style={{ background: "#F8F9FA", border: "2px solid var(--border)" }}>
        <h3 style={{ fontSize: 14, color: "var(--text-light)", marginBottom: 10 }}>🔧 Info Teknis</h3>
        <div style={{ fontSize: 12, color: "var(--text-muted)", fontWeight: 600, lineHeight: 1.8 }}>
          <p>📦 Project: aplikasi-kelulusan-sd</p>
          <p>🔑 Auth: Firebase Authentication</p>
          <p>🗄️ Database: Firestore</p>
          <p>📁 Storage: Firebase Storage</p>
        </div>
      </div>
    </div>
  );
}

const labelStyle = { fontSize: 12, fontWeight: 700, color: "var(--text-light)", display: "block", marginBottom: 6 };
