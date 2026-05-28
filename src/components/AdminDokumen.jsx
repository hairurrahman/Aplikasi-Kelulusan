import React, { useState, useEffect, useRef } from "react";
import { db, storage } from "../firebase";
import { collection, getDocs, doc, setDoc, deleteDoc } from "firebase/firestore";
import { ref, uploadBytesResumable, getDownloadURL, deleteObject } from "firebase/storage";
import toast from "react-hot-toast";

export default function AdminDokumen({ tahunAjaran, onChangeTahun }) {
  const [siswaList, setSiswaList] = useState([]);
  const [dokumenList, setDokumenList] = useState({});
  const [tahunList, setTahunList] = useState([]);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState({});
  const [progress, setProgress] = useState({});
  const [search, setSearch] = useState("");
  const fileRefs = useRef({});

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

  async function handleUpload(nisn, file) {
    if (!file) return;
    const ext = file.name.split(".").pop().toLowerCase();
    const allowed = ["pdf", "jpg", "jpeg", "png", "webp"];
    if (!allowed.includes(ext)) {
      toast.error("Format file tidak didukung! (PDF, JPG, PNG, WEBP)");
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      toast.error("Ukuran file maksimal 10MB!");
      return;
    }

    setUploading((prev) => ({ ...prev, [nisn]: true }));
    setProgress((prev) => ({ ...prev, [nisn]: 0 }));

    try {
      const storageRef = ref(storage, `dokumen/${tahunAjaran}/${nisn}/SKL_${nisn}.${ext}`);
      const uploadTask = uploadBytesResumable(storageRef, file);

      uploadTask.on("state_changed",
        (snapshot) => {
          const pct = Math.round((snapshot.bytesTransferred / snapshot.totalBytes) * 100);
          setProgress((prev) => ({ ...prev, [nisn]: pct }));
        },
        (error) => {
          toast.error("Upload gagal: " + error.message);
          setUploading((prev) => ({ ...prev, [nisn]: false }));
        },
        async () => {
          const url = await getDownloadURL(uploadTask.snapshot.ref);
          await setDoc(doc(db, `tahunAjaran/${tahunAjaran}/dokumen`, nisn), {
            url,
            fileName: file.name,
            uploadedAt: new Date().toISOString(),
            storagePath: `dokumen/${tahunAjaran}/${nisn}/SKL_${nisn}.${ext}`,
          });
          toast.success("SKL berhasil diupload! 🎉");
          setUploading((prev) => ({ ...prev, [nisn]: false }));
          fetchData();
        }
      );
    } catch (e) {
      toast.error("Gagal upload");
      setUploading((prev) => ({ ...prev, [nisn]: false }));
    }
  }

  async function handleDelete(nisn) {
    if (!window.confirm("Hapus dokumen SKL ini?")) return;
    try {
      const dok = dokumenList[nisn];
      if (dok?.storagePath) {
        const storageRef = ref(storage, dok.storagePath);
        await deleteObject(storageRef).catch(() => {});
      }
      await deleteDoc(doc(db, `tahunAjaran/${tahunAjaran}/dokumen`, nisn));
      toast.success("Dokumen dihapus!");
      fetchData();
    } catch (e) {
      toast.error("Gagal menghapus dokumen");
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
        Upload Surat Keterangan Kelulusan per siswa
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
            <div style={{
              flex: 1, background: "#E8F4FD", borderRadius: "var(--radius-sm)",
              padding: "12px", textAlign: "center", border: "2px solid var(--blue)30",
            }}>
              <div style={{ fontSize: 22, fontWeight: 900, color: "var(--blue)" }}>{siswaList.length}</div>
              <div style={{ fontSize: 11, fontWeight: 700, color: "var(--text-light)" }}>Total Siswa</div>
            </div>
            <div style={{
              flex: 1, background: "#EDFFF4", borderRadius: "var(--radius-sm)",
              padding: "12px", textAlign: "center", border: "2px solid var(--success)30",
            }}>
              <div style={{ fontSize: 22, fontWeight: 900, color: "var(--success)" }}>{uploaded}</div>
              <div style={{ fontSize: 11, fontWeight: 700, color: "var(--text-light)" }}>SKL Diupload</div>
            </div>
            <div style={{
              flex: 1, background: "#FFF9E6", borderRadius: "var(--radius-sm)",
              padding: "12px", textAlign: "center", border: "2px solid var(--accent)30",
            }}>
              <div style={{ fontSize: 22, fontWeight: 900, color: "#E67E22" }}>{siswaList.length - uploaded}</div>
              <div style={{ fontSize: 11, fontWeight: 700, color: "var(--text-light)" }}>Belum Upload</div>
            </div>
          </div>

          {/* Search */}
          <input className="input-field" placeholder="🔍 Cari siswa..."
            value={search} onChange={(e) => setSearch(e.target.value)}
            style={{ marginBottom: 14 }} />

          {/* Info */}
          <div style={{
            background: "#F0F7FF", border: "2px solid var(--blue)30",
            borderRadius: "var(--radius-sm)", padding: "10px 14px", marginBottom: 14,
          }}>
            <p style={{ fontSize: 12, color: "var(--blue)", fontWeight: 700 }}>
              📎 Format: PDF, JPG, PNG, WEBP • Maks. 10MB per file
            </p>
          </div>

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
                const isUp = uploading[s.nisn];
                const prog = progress[s.nisn] || 0;
                return (
                  <div key={s.nisn} className="card animate-slideIn" style={{
                    padding: "14px 16px",
                    border: `2px solid ${dok ? "var(--success)" : "var(--border)"}`,
                  }}>
                    <div style={{ marginBottom: 10 }}>
                      <p style={{ fontWeight: 800, fontSize: 14, color: "var(--text)" }}>{s.nama}</p>
                      <p style={{ fontSize: 12, color: "var(--text-light)", fontWeight: 600 }}>NISN: {s.nisn}</p>
                    </div>

                    {isUp ? (
                      /* Progress Bar */
                      <div>
                        <div style={{
                          background: "var(--border)", borderRadius: 10, height: 10, overflow: "hidden",
                        }}>
                          <div style={{
                            width: `${prog}%`, height: "100%",
                            background: "linear-gradient(90deg, var(--secondary), var(--primary))",
                            borderRadius: 10, transition: "width 0.3s ease",
                          }} />
                        </div>
                        <p style={{ fontSize: 12, color: "var(--text-light)", fontWeight: 700, marginTop: 4 }}>
                          Mengupload... {prog}%
                        </p>
                      </div>
                    ) : dok ? (
                      /* Uploaded State */
                      <div>
                        <div style={{
                          background: "#EDFFF4", borderRadius: 10, padding: "8px 12px",
                          marginBottom: 8, display: "flex", alignItems: "center", gap: 8,
                        }}>
                          <span style={{ fontSize: 18 }}>✅</span>
                          <div style={{ flex: 1, overflow: "hidden" }}>
                            <p style={{ fontSize: 12, fontWeight: 800, color: "var(--success)" }}>SKL Tersedia</p>
                            <p style={{ fontSize: 11, color: "var(--text-light)", fontWeight: 600, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                              {dok.fileName}
                            </p>
                          </div>
                        </div>
                        <div style={{ display: "flex", gap: 6 }}>
                          <a href={dok.url} target="_blank" rel="noopener noreferrer"
                            style={{
                              flex: 1, background: "linear-gradient(135deg, var(--blue), #1E8FD5)",
                              color: "white", padding: "10px", borderRadius: 10,
                              fontWeight: 800, fontSize: 13, textAlign: "center", textDecoration: "none",
                            }}>
                            👁️ Lihat
                          </a>
                          <input type="file" style={{ display: "none" }} ref={(r) => fileRefs.current[s.nisn] = r}
                            onChange={(e) => handleUpload(s.nisn, e.target.files[0])}
                            accept=".pdf,.jpg,.jpeg,.png,.webp" />
                          <button onClick={() => fileRefs.current[s.nisn]?.click()} style={{
                            flex: 1, background: "#f0f0f0", color: "var(--text)",
                            padding: "10px", borderRadius: 10, fontWeight: 800, fontSize: 13,
                          }}>
                            🔄 Ganti
                          </button>
                          <button onClick={() => handleDelete(s.nisn)} style={{
                            background: "#FF6B6B", color: "white",
                            width: 38, borderRadius: 10, fontWeight: 700,
                          }}>
                            🗑️
                          </button>
                        </div>
                      </div>
                    ) : (
                      /* Upload Button */
                      <>
                        <input type="file" style={{ display: "none" }} ref={(r) => fileRefs.current[s.nisn] = r}
                          onChange={(e) => handleUpload(s.nisn, e.target.files[0])}
                          accept=".pdf,.jpg,.jpeg,.png,.webp" />
                        <button onClick={() => fileRefs.current[s.nisn]?.click()}
                          style={{
                            width: "100%", padding: "10px",
                            background: "linear-gradient(135deg, var(--secondary), #3BB8B0)",
                            color: "white", borderRadius: 10,
                            fontWeight: 800, fontSize: 13,
                            border: "none", cursor: "pointer",
                            boxShadow: "0 3px 10px rgba(78,205,196,0.3)",
                          }}>
                          📤 Upload SKL
                        </button>
                      </>
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
