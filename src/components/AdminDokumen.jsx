import React, { useState, useEffect } from "react";
import { db } from "../firebase";
import { collection, getDocs, doc, setDoc, deleteDoc } from "firebase/firestore";
import toast from "react-hot-toast";

export default function AdminDokumen({ tahunAjaran, onChangeTahun }) {
  const [siswaList, setSiswaList] = useState([]);
  const [dokumenList, setDokumenList] = useState({});
  const [tahunList, setTahunList] = useState([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState({});
  const [search, setSearch] = useState("");
  const [urlInputs, setUrlInputs] = useState({});
  const [editMode, setEditMode] = useState({});

  useEffect(() => { fetchTahunList(); }, []); // eslint-disable-line
  useEffect(() => { if (tahunAjaran) fetchData(); }, [tahunAjaran]); // eslint-disable-line

  async function fetchTahunList() {
    try {
      const snap = await getDocs(collection(db, "tahunAjaran"));
      setTahunList(snap.docs.map((d) => d.id).sort().reverse());
    } catch (e) {}
  }

  async function fetchData() {
    if (!tahunAjaran) return;
    setLoading(true);
    try {
      const [siswaSnap, dokSnap] = await Promise.all([
        getDocs(collection(db, `tahunAjaran/${tahunAjaran}/siswa`)),
        getDocs(collection(db, `tahunAjaran/${tahunAjaran}/dokumen`)),
      ]);
      setSiswaList(siswaSnap.docs.map((d) => ({ ...d.data(), nisn: d.id })));
      const dokMap = {};
      dokSnap.docs.forEach((d) => { dokMap[d.id] = d.data(); });
      setDokumenList(dokMap);
    } catch (e) {}
    setLoading(false);
  }

  function convertGDriveUrl(url) {
    // Konversi Google Drive share link ke direct link
    // https://drive.google.com/file/d/FILE_ID/view → https://drive.google.com/uc?export=download&id=FILE_ID
    const match = url.match(/\/d\/([a-zA-Z0-9_-]+)/);
    if (match) {
      return `https://drive.google.com/file/d/${match[1]}/preview`;
    }
    return url;
  }

  async function saveUrl(nisn) {
    const url = urlInputs[nisn]?.trim();
    if (!url) {
      toast.error("Masukkan URL terlebih dahulu!");
      return;
    }
    if (!url.startsWith("http")) {
      toast.error("URL tidak valid! Harus dimulai dengan http/https");
      return;
    }
    setSaving((prev) => ({ ...prev, [nisn]: true }));
    try {
      const finalUrl = convertGDriveUrl(url);
      await setDoc(doc(db, `tahunAjaran/${tahunAjaran}/dokumen`, nisn), {
        url: finalUrl,
        originalUrl: url,
        uploadedAt: new Date().toISOString(),
      });
      toast.success("URL SKL berhasil disimpan! 🎉");
      setEditMode((prev) => ({ ...prev, [nisn]: false }));
      setUrlInputs((prev) => ({ ...prev, [nisn]: "" }));
      fetchData();
    } catch (e) {
      toast.error("Gagal menyimpan URL");
    }
    setSaving((prev) => ({ ...prev, [nisn]: false }));
  }

  async function handleDelete(nisn) {
    if (!window.confirm("Hapus URL SKL ini?")) return;
    try {
      await deleteDoc(doc(db, `tahunAjaran/${tahunAjaran}/dokumen`, nisn));
      toast.success("SKL dihapus!");
      fetchData();
    } catch (e) {
      toast.error("Gagal menghapus");
    }
  }

  const filtered = siswaList.filter((s) =>
    s.nama?.toLowerCase().includes(search.toLowerCase()) ||
    s.nisn?.includes(search)
  );

  const uploaded = Object.keys(dokumenList).length;

  return (
    <div>
      <h2 style={{ fontSize: 22, color: "var(--text)", marginBottom: 6 }}>📄 Dokumen SKL</h2>
      <p style={{ fontSize: 13, color: "var(--text-light)", fontWeight: 600, marginBottom: 16 }}>
        Input link URL Google Drive untuk SKL setiap siswa
      </p>

      {/* Tahun Selector */}
      <div className="card" style={{ marginBottom: 16 }}>
        <label style={labelStyle}>📅 Tahun Ajaran</label>
        <select className="input-field" value={tahunAjaran} onChange={(e) => onChangeTahun(e.target.value)}>
          <option value="">-- Pilih --</option>
          {tahunList.map((t) => <option key={t} value={t}>{t}</option>)}
        </select>
      </div>

      {tahunAjaran && (
        <>
          {/* Stats */}
          <div style={{ display: "flex", gap: 10, marginBottom: 16 }}>
            <div style={{ flex: 1, background: "#E8F4FD", borderRadius: "var(--radius-sm)", padding: "12px", textAlign: "center" }}>
              <div style={{ fontSize: 22, fontWeight: 900, color: "var(--blue)" }}>{siswaList.length}</div>
              <div style={{ fontSize: 11, fontWeight: 700, color: "var(--text-light)" }}>Total Siswa</div>
            </div>
            <div style={{ flex: 1, background: "#EDFFF4", borderRadius: "var(--radius-sm)", padding: "12px", textAlign: "center" }}>
              <div style={{ fontSize: 22, fontWeight: 900, color: "var(--success)" }}>{uploaded}</div>
              <div style={{ fontSize: 11, fontWeight: 700, color: "var(--text-light)" }}>SKL Tersedia</div>
            </div>
            <div style={{ flex: 1, background: "#FFF9E6", borderRadius: "var(--radius-sm)", padding: "12px", textAlign: "center" }}>
              <div style={{ fontSize: 22, fontWeight: 900, color: "#E67E22" }}>{siswaList.length - uploaded}</div>
              <div style={{ fontSize: 11, fontWeight: 700, color: "var(--text-light)" }}>Belum Ada</div>
            </div>
          </div>

          {/* Cara pakai */}
          <div style={{ background: "#F0F7FF", border: "2px solid var(--blue)30", borderRadius: "var(--radius-sm)", padding: "12px 14px", marginBottom: 14 }}>
            <p style={{ fontSize: 13, fontWeight: 800, color: "var(--blue)", marginBottom: 6 }}>📎 Cara pakai Google Drive:</p>
            <p style={{ fontSize: 12, color: "var(--text-light)", fontWeight: 600, lineHeight: 1.7 }}>
              1. Upload file SKL ke Google Drive<br/>
              2. Klik kanan file → <strong>Share</strong> → <strong>Anyone with the link</strong><br/>
              3. Copy link → paste di kolom URL di bawah
            </p>
          </div>

          {/* Search */}
          <input className="input-field" placeholder="🔍 Cari siswa..."
            value={search} onChange={(e) => setSearch(e.target.value)}
            style={{ marginBottom: 14 }} />

          {/* List */}
          {loading ? (
            <div style={{ textAlign: "center", padding: 40 }}>
              <div className="spinner" style={{ margin: "0 auto 12px" }} />
            </div>
          ) : filtered.length === 0 ? (
            <div className="card" style={{ textAlign: "center", padding: 32, color: "var(--text-muted)" }}>
              <div style={{ fontSize: 48, marginBottom: 8 }}>📄</div>
              <p style={{ fontWeight: 700 }}>Belum ada siswa</p>
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {filtered.map((s) => {
                const dok = dokumenList[s.nisn];
                const isEdit = editMode[s.nisn];
                const isSaving = saving[s.nisn];

                return (
                  <div key={s.nisn} className="card animate-slideIn" style={{
                    padding: "14px 16px",
                    border: `2px solid ${dok ? "var(--success)" : "var(--border)"}`,
                  }}>
                    <div style={{ marginBottom: 10 }}>
                      <p style={{ fontWeight: 800, fontSize: 14, color: "var(--text)" }}>{s.nama}</p>
                      <p style={{ fontSize: 12, color: "var(--text-light)", fontWeight: 600 }}>NISN: {s.nisn}</p>
                    </div>

                    {dok && !isEdit ? (
                      /* Sudah ada URL */
                      <div>
                        <div style={{ background: "#EDFFF4", borderRadius: 10, padding: "8px 12px", marginBottom: 8, display: "flex", alignItems: "center", gap: 8 }}>
                          <span style={{ fontSize: 18 }}>✅</span>
                          <p style={{ fontSize: 12, fontWeight: 800, color: "var(--success)" }}>SKL Tersedia</p>
                        </div>
                        <div style={{ display: "flex", gap: 6 }}>
                          <a href={dok.url} target="_blank" rel="noopener noreferrer"
                            style={{
                              flex: 1, background: "linear-gradient(135deg, var(--blue), #1E8FD5)",
                              color: "white", padding: "10px", borderRadius: 10,
                              fontWeight: 800, fontSize: 13, textAlign: "center", textDecoration: "none",
                            }}>
                            👁️ Lihat SKL
                          </a>
                          <button onClick={() => { setEditMode((p) => ({ ...p, [s.nisn]: true })); setUrlInputs((p) => ({ ...p, [s.nisn]: dok.originalUrl || dok.url })); }}
                            style={{ flex: 1, background: "#f0f0f0", color: "var(--text)", padding: "10px", borderRadius: 10, fontWeight: 800, fontSize: 13 }}>
                            ✏️ Ganti
                          </button>
                          <button onClick={() => handleDelete(s.nisn)}
                            style={{ background: "#FF6B6B", color: "white", width: 38, borderRadius: 10 }}>
                            🗑️
                          </button>
                        </div>
                      </div>
                    ) : (
                      /* Input URL */
                      <div>
                        <input
                          className="input-field"
                          placeholder="Paste link Google Drive di sini..."
                          value={urlInputs[s.nisn] || ""}
                          onChange={(e) => setUrlInputs((p) => ({ ...p, [s.nisn]: e.target.value }))}
                          style={{ marginBottom: 8, fontSize: 13 }}
                        />
                        <div style={{ display: "flex", gap: 6 }}>
                          <button onClick={() => saveUrl(s.nisn)} disabled={isSaving}
                            style={{
                              flex: 2, background: "linear-gradient(135deg, var(--success), #3ECC61)",
                              color: "white", padding: "10px", borderRadius: 10,
                              fontWeight: 800, fontSize: 13,
                              boxShadow: "0 3px 10px rgba(81,207,102,0.3)",
                            }}>
                            {isSaving ? "Menyimpan..." : "💾 Simpan URL"}
                          </button>
                          {isEdit && (
                            <button onClick={() => setEditMode((p) => ({ ...p, [s.nisn]: false }))}
                              style={{ flex: 1, background: "#f0f0f0", color: "var(--text)", padding: "10px", borderRadius: 10, fontWeight: 800, fontSize: 13 }}>
                              Batal
                            </button>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}
    </div>
  );
}

const labelStyle = { fontSize: 12, fontWeight: 700, color: "var(--text-light)", display: "block", marginBottom: 6 };
