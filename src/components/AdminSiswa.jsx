import React, { useState, useEffect } from "react";
import { db } from "../firebase";
import { collection, getDocs, doc, setDoc, deleteDoc } from "firebase/firestore";
import toast from "react-hot-toast";

const EMPTY_FORM = {
  nama: "", kelas: "", jenisKelamin: "Laki-laki", ttl: "",
  namaOrangTua: "", alamat: "",
};

export default function AdminSiswa({ tahunAjaran, onChangeTahun }) {
  const [siswaList, setSiswaList] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [editNisn, setEditNisn] = useState("");
  const [nisn, setNisn] = useState("");
  const [tahunList, setTahunList] = useState([]);
  const [newTahun, setNewTahun] = useState("");
  const [showAddTahun, setShowAddTahun] = useState(false);
  const [search, setSearch] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => { fetchTahunList(); }, []); // eslint-disable-line
  useEffect(() => { if (tahunAjaran) fetchSiswa(); }, [tahunAjaran]); // eslint-disable-line

  async function fetchTahunList() {
    try {
      const snap = await getDocs(collection(db, "tahunAjaran"));
      setTahunList(snap.docs.map((d) => d.id).sort().reverse());
    } catch (e) {}
  }

  async function fetchSiswa() {
    if (!tahunAjaran) return;
    setLoading(true);
    try {
      const snap = await getDocs(collection(db, `tahunAjaran/${tahunAjaran}/siswa`));
      setSiswaList(snap.docs.map((d) => ({ ...d.data(), nisn: d.id })));
    } catch (e) {}
    setLoading(false);
  }

  async function addTahunAjaran() {
    if (!newTahun.trim()) return;
    try {
      await setDoc(doc(db, "tahunAjaran", newTahun.trim()), { createdAt: new Date().toISOString() });
      toast.success(`Tahun ajaran ${newTahun} berhasil ditambahkan!`);
      setNewTahun("");
      setShowAddTahun(false);
      fetchTahunList();
      onChangeTahun(newTahun.trim());
    } catch (e) {
      toast.error("Gagal menambahkan tahun ajaran");
    }
  }

  async function saveSiswa() {
    if (!tahunAjaran) { toast.error("Pilih tahun ajaran dulu!"); return; }
    if (!nisn.trim() || !form.nama.trim()) { toast.error("NISN dan Nama wajib diisi!"); return; }
    setSaving(true);
    try {
      await setDoc(doc(db, `tahunAjaran/${tahunAjaran}/siswa`, nisn.trim()), form);
      toast.success(editNisn ? "Data siswa diperbarui!" : "Siswa berhasil ditambahkan!");
      setShowForm(false);
      setForm(EMPTY_FORM);
      setNisn("");
      setEditNisn("");
      fetchSiswa();
    } catch (e) {
      toast.error("Gagal menyimpan data");
    }
    setSaving(false);
  }

  async function deleteSiswa(nisnDel) {
    if (!window.confirm(`Hapus siswa NISN ${nisnDel}?`)) return;
    try {
      await deleteDoc(doc(db, `tahunAjaran/${tahunAjaran}/siswa`, nisnDel));
      toast.success("Siswa dihapus!");
      fetchSiswa();
    } catch (e) {
      toast.error("Gagal menghapus");
    }
  }

  function editSiswa(s) {
    setForm({ nama: s.nama || "", kelas: s.kelas || "", jenisKelamin: s.jenisKelamin || "Laki-laki", ttl: s.ttl || "", namaOrangTua: s.namaOrangTua || "", alamat: s.alamat || "" });
    setNisn(s.nisn);
    setEditNisn(s.nisn);
    setShowForm(true);
  }

  const filtered = siswaList.filter((s) =>
    s.nama?.toLowerCase().includes(search.toLowerCase()) ||
    s.nisn?.includes(search)
  );

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
        <h2 style={{ fontSize: 22, color: "var(--text)" }}>👦 Data Siswa</h2>
        <button onClick={() => setShowAddTahun(!showAddTahun)} style={{
          background: "var(--accent)", color: "var(--text)",
          padding: "8px 14px", borderRadius: 20, fontSize: 12, fontWeight: 700,
        }}>
          + Tahun Ajaran
        </button>
      </div>

      {/* Add Tahun Ajaran */}
      {showAddTahun && (
        <div className="card animate-fadeIn" style={{ marginBottom: 16, background: "#FFFBF0", border: "2px solid var(--accent)" }}>
          <p style={{ fontSize: 13, fontWeight: 700, marginBottom: 8, color: "#E67E22" }}>📅 Tambah Tahun Ajaran Baru</p>
          <div style={{ display: "flex", gap: 8 }}>
            <input className="input-field" placeholder="Contoh: 2024/2025"
              value={newTahun} onChange={(e) => setNewTahun(e.target.value)}
              style={{ flex: 1 }} />
            <button onClick={addTahunAjaran} className="btn-secondary" style={{ width: "auto", padding: "10px 18px" }}>
              Tambah
            </button>
          </div>
        </div>
      )}

      {/* Tahun Selector */}
      <div className="card animate-fadeIn" style={{ marginBottom: 16 }}>
        <label style={{ fontSize: 13, fontWeight: 700, color: "var(--text-light)", display: "block", marginBottom: 6 }}>
          📅 Tahun Ajaran
        </label>
        <select className="input-field" value={tahunAjaran} onChange={(e) => onChangeTahun(e.target.value)}>
          <option value="">-- Pilih --</option>
          {tahunList.map((t) => <option key={t} value={t}>{t}</option>)}
        </select>
      </div>

      {tahunAjaran && (
        <>
          {/* Search & Add */}
          <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
            <input className="input-field" placeholder="🔍 Cari nama/NISN..."
              value={search} onChange={(e) => setSearch(e.target.value)}
              style={{ flex: 1 }} />
            <button onClick={() => { setShowForm(true); setForm(EMPTY_FORM); setNisn(""); setEditNisn(""); }}
              style={{
                background: "linear-gradient(135deg, var(--primary), var(--primary-dark))",
                color: "white", padding: "12px 16px", borderRadius: "var(--radius-sm)",
                fontSize: 22, lineHeight: 1, fontWeight: 700,
                boxShadow: "0 3px 10px rgba(255,107,107,0.4)",
              }}>+</button>
          </div>

          {/* Form */}
          {showForm && (
            <div className="card animate-fadeIn" style={{ marginBottom: 16, border: "2px solid var(--primary)" }}>
              <h3 style={{ fontSize: 16, marginBottom: 14, color: "var(--primary)" }}>
                {editNisn ? "✏️ Edit Siswa" : "➕ Tambah Siswa"}
              </h3>
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                <div>
                  <label style={labelStyle}>NISN *</label>
                  <input className="input-field" placeholder="10 digit NISN"
                    value={nisn} onChange={(e) => setNisn(e.target.value)}
                    disabled={!!editNisn} maxLength={10} />
                </div>
                <div>
                  <label style={labelStyle}>Nama Lengkap *</label>
                  <input className="input-field" placeholder="Nama siswa"
                    value={form.nama} onChange={(e) => setForm({ ...form, nama: e.target.value })} />
                </div>
                <div>
                  <label style={labelStyle}>Kelas</label>
                  <input className="input-field" placeholder="Contoh: VI A"
                    value={form.kelas} onChange={(e) => setForm({ ...form, kelas: e.target.value })} />
                </div>
                <div>
                  <label style={labelStyle}>Jenis Kelamin</label>
                  <select className="input-field" value={form.jenisKelamin}
                    onChange={(e) => setForm({ ...form, jenisKelamin: e.target.value })}>
                    <option>Laki-laki</option>
                    <option>Perempuan</option>
                  </select>
                </div>
                <div>
                  <label style={labelStyle}>Tempat, Tgl Lahir</label>
                  <input className="input-field" placeholder="Contoh: Surabaya, 01 Januari 2012"
                    value={form.ttl} onChange={(e) => setForm({ ...form, ttl: e.target.value })} />
                </div>
                <div>
                  <label style={labelStyle}>Nama Orang Tua</label>
                  <input className="input-field" placeholder="Nama ayah/ibu"
                    value={form.namaOrangTua} onChange={(e) => setForm({ ...form, namaOrangTua: e.target.value })} />
                </div>
                <div>
                  <label style={labelStyle}>Alamat</label>
                  <textarea className="input-field" placeholder="Alamat rumah" rows={2}
                    value={form.alamat} onChange={(e) => setForm({ ...form, alamat: e.target.value })}
                    style={{ resize: "none" }} />
                </div>
              </div>
              <div style={{ display: "flex", gap: 8, marginTop: 14 }}>
                <button onClick={() => { setShowForm(false); setEditNisn(""); }}
                  style={{ flex: 1, padding: "12px", borderRadius: "var(--radius-sm)", background: "#f0f0f0", fontWeight: 700, color: "var(--text-light)" }}>
                  Batal
                </button>
                <button className="btn-primary" onClick={saveSiswa} disabled={saving} style={{ flex: 2 }}>
                  {saving ? "Menyimpan..." : "💾 Simpan"}
                </button>
              </div>
            </div>
          )}

          {/* List */}
          {loading ? (
            <div style={{ textAlign: "center", padding: 40 }}>
              <div className="spinner" style={{ margin: "0 auto 12px" }} />
              <p style={{ color: "var(--text-light)", fontWeight: 700 }}>Memuat data...</p>
            </div>
          ) : filtered.length === 0 ? (
            <div className="card" style={{ textAlign: "center", padding: 32, color: "var(--text-muted)" }}>
              <div style={{ fontSize: 48, marginBottom: 8 }}>👦</div>
              <p style={{ fontWeight: 700 }}>Belum ada data siswa</p>
              <p style={{ fontSize: 13, marginTop: 4 }}>Klik tombol + untuk menambah siswa</p>
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              <p style={{ fontSize: 13, color: "var(--text-light)", fontWeight: 600, marginBottom: 4 }}>
                {filtered.length} siswa ditemukan
              </p>
              {filtered.map((s) => (
                <div key={s.nisn} className="card animate-slideIn" style={{ padding: "14px 16px" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                    <div style={{ flex: 1 }}>
                      <p style={{ fontWeight: 800, fontSize: 15, color: "var(--text)", marginBottom: 2 }}>{s.nama}</p>
                      <p style={{ fontSize: 12, color: "var(--text-light)", fontWeight: 600 }}>
                        NISN: {s.nisn} • {s.kelas} • {s.jenisKelamin}
                      </p>
                    </div>
                    <div style={{ display: "flex", gap: 6 }}>
                      <button onClick={() => editSiswa(s)} style={{
                        background: "var(--blue)", color: "white",
                        width: 34, height: 34, borderRadius: 10, fontSize: 14,
                      }}>✏️</button>
                      <button onClick={() => deleteSiswa(s.nisn)} style={{
                        background: "#FF6B6B", color: "white",
                        width: 34, height: 34, borderRadius: 10, fontSize: 14,
                      }}>🗑️</button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}

const labelStyle = {
  fontSize: 12, fontWeight: 700, color: "var(--text-light)",
  display: "block", marginBottom: 4,
};
