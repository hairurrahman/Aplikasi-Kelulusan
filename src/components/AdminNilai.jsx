import React, { useState, useEffect } from "react";
import { db } from "../firebase";
import { collection, getDocs, doc, setDoc } from "firebase/firestore";
import toast from "react-hot-toast";

const DEFAULT_MAPEL = ["Bahasa Indonesia", "Matematika", "IPA", "IPS", "PKn", "Bahasa Inggris", "Pendidikan Agama"];

export default function AdminNilai({ tahunAjaran, onChangeTahun }) {
  const [siswaList, setSiswaList] = useState([]);
  const [nilaiList, setNilaiList] = useState({});
  const [tahunList, setTahunList] = useState([]);
  const [selectedSiswa, setSelectedSiswa] = useState(null);
  const [form, setForm] = useState({});
  const [status, setStatus] = useState("LULUS");
  const [catatan, setCatatan] = useState("");
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");

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
      const [siswaSnap, nilaiSnap] = await Promise.all([
        getDocs(collection(db, `tahunAjaran/${tahunAjaran}/siswa`)),
        getDocs(collection(db, `tahunAjaran/${tahunAjaran}/nilai`)),
      ]);
      setSiswaList(siswaSnap.docs.map((d) => ({ ...d.data(), nisn: d.id })));
      const nilaiMap = {};
      nilaiSnap.docs.forEach((d) => { nilaiMap[d.id] = d.data(); });
      setNilaiList(nilaiMap);
    } catch (e) {}
    setLoading(false);
  }

  function openForm(s) {
    setSelectedSiswa(s);
    const existing = nilaiList[s.nisn];
    if (existing) {
      setForm(existing.mapel || {});
      setStatus(existing.status || "LULUS");
      setCatatan(existing.catatan || "");
    } else {
      const init = {};
      DEFAULT_MAPEL.forEach((m) => { init[m] = ""; });
      setForm(init);
      setStatus("LULUS");
      setCatatan("");
    }
  }

  function calcRataRata(mapel) {
    const vals = Object.values(mapel).filter((v) => v !== "" && !isNaN(v)).map(Number);
    if (vals.length === 0) return 0;
    return Math.round(vals.reduce((a, b) => a + b, 0) / vals.length * 10) / 10;
  }

  async function saveNilai() {
    if (!selectedSiswa) return;
    setSaving(true);
    try {
      const rataRata = calcRataRata(form);
      const mapelNum = {};
      Object.entries(form).forEach(([k, v]) => { mapelNum[k] = v !== "" ? Number(v) : 0; });
      await setDoc(doc(db, `tahunAjaran/${tahunAjaran}/nilai`, selectedSiswa.nisn), {
        mapel: mapelNum,
        status,
        catatan,
        rataRata,
        updatedAt: new Date().toISOString(),
      });
      toast.success("Nilai berhasil disimpan! 🎉");
      setSelectedSiswa(null);
      fetchData();
    } catch (e) {
      toast.error("Gagal menyimpan nilai");
    }
    setSaving(false);
  }

  const filtered = siswaList.filter((s) =>
    s.nama?.toLowerCase().includes(search.toLowerCase()) ||
    s.nisn?.includes(search)
  );

  return (
    <div>
      <h2 style={{ fontSize: 22, color: "var(--text)", marginBottom: 16 }}>📊 Input Nilai</h2>

      {/* Tahun Selector */}
      <div className="card" style={{ marginBottom: 16 }}>
        <label style={labelStyle}>📅 Tahun Ajaran</label>
        <select className="input-field" value={tahunAjaran} onChange={(e) => onChangeTahun(e.target.value)}>
          <option value="">-- Pilih --</option>
          {tahunList.map((t) => <option key={t} value={t}>{t}</option>)}
        </select>
      </div>

      {selectedSiswa ? (
        /* Form Input Nilai */
        <div className="animate-fadeIn">
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16 }}>
            <button onClick={() => setSelectedSiswa(null)} style={{
              background: "#f0f0f0", padding: "8px 14px", borderRadius: 20,
              fontWeight: 700, fontSize: 13, color: "var(--text)",
            }}>← Kembali</button>
            <div>
              <p style={{ fontWeight: 800, fontSize: 15 }}>{selectedSiswa.nama}</p>
              <p style={{ fontSize: 12, color: "var(--text-light)", fontWeight: 600 }}>NISN: {selectedSiswa.nisn}</p>
            </div>
          </div>

          <div className="card" style={{ marginBottom: 16 }}>
            <h3 style={{ fontSize: 15, color: "var(--secondary)", marginBottom: 14 }}>📝 Nilai Per Mata Pelajaran</h3>
            {Object.entries(form).map(([mapel, val]) => (
              <div key={mapel} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10, gap: 10 }}>
                <label style={{ fontSize: 13, fontWeight: 700, flex: 1, color: "var(--text)" }}>{mapel}</label>
                <input
                  type="number" min={0} max={100}
                  value={val}
                  onChange={(e) => setForm({ ...form, [mapel]: e.target.value })}
                  style={{
                    width: 70, padding: "8px 10px",
                    border: "2.5px solid var(--border)", borderRadius: 10,
                    fontSize: 15, fontWeight: 800, textAlign: "center",
                    background: "#FFFAF5",
                    color: val >= 70 ? "var(--success)" : val > 0 ? "#FF6B6B" : "var(--text)",
                  }}
                  placeholder="0"
                />
              </div>
            ))}

            {/* Rata-rata */}
            <div style={{
              marginTop: 12, padding: "12px 16px",
              background: "linear-gradient(135deg, var(--accent), #FFD700)",
              borderRadius: "var(--radius-sm)",
              display: "flex", justifyContent: "space-between",
            }}>
              <span style={{ fontWeight: 800 }}>⭐ Rata-rata</span>
              <span style={{ fontWeight: 900, fontSize: 18 }}>{calcRataRata(form)}</span>
            </div>
          </div>

          {/* Status */}
          <div className="card" style={{ marginBottom: 16 }}>
            <label style={labelStyle}>🏆 Status Kelulusan</label>
            <div style={{ display: "flex", gap: 8 }}>
              {["LULUS", "TIDAK LULUS"].map((s) => (
                <button key={s} onClick={() => setStatus(s)} style={{
                  flex: 1, padding: "12px",
                  borderRadius: "var(--radius-sm)",
                  background: status === s
                    ? (s === "LULUS" ? "linear-gradient(135deg, var(--success), #3ECC61)" : "linear-gradient(135deg, #FF6B6B, var(--primary-dark))")
                    : "#f0f0f0",
                  color: status === s ? "white" : "var(--text-light)",
                  fontWeight: 800, fontSize: 14,
                  boxShadow: status === s ? "0 3px 10px rgba(0,0,0,0.2)" : "none",
                }}>
                  {s === "LULUS" ? "✅ LULUS" : "❌ TIDAK LULUS"}
                </button>
              ))}
            </div>
          </div>

          {/* Catatan */}
          <div className="card" style={{ marginBottom: 16 }}>
            <label style={labelStyle}>📝 Catatan (opsional)</label>
            <textarea className="input-field" rows={3} placeholder="Catatan untuk siswa..."
              value={catatan} onChange={(e) => setCatatan(e.target.value)}
              style={{ resize: "none" }} />
          </div>

          <button className="btn-primary" onClick={saveNilai} disabled={saving}>
            {saving ? "Menyimpan..." : "💾 Simpan Nilai"}
          </button>
        </div>
      ) : (
        /* Siswa List */
        tahunAjaran && (
          <>
            <input className="input-field" placeholder="🔍 Cari siswa..."
              value={search} onChange={(e) => setSearch(e.target.value)}
              style={{ marginBottom: 14 }} />

            {loading ? (
              <div style={{ textAlign: "center", padding: 40 }}>
                <div className="spinner" style={{ margin: "0 auto 12px" }} />
              </div>
            ) : filtered.length === 0 ? (
              <div className="card" style={{ textAlign: "center", padding: 32, color: "var(--text-muted)" }}>
                <div style={{ fontSize: 48, marginBottom: 8 }}>📊</div>
                <p style={{ fontWeight: 700 }}>Tidak ada siswa</p>
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                <p style={{ fontSize: 13, color: "var(--text-light)", fontWeight: 600 }}>
                  {filtered.length} siswa • {Object.keys(nilaiList).length} sudah ada nilai
                </p>
                {filtered.map((s) => {
                  const n = nilaiList[s.nisn];
                  return (
                    <button key={s.nisn} onClick={() => openForm(s)}
                      style={{
                        background: "white", border: `2px solid ${n ? "var(--success)" : "var(--border)"}`,
                        borderRadius: "var(--radius-sm)", padding: "14px 16px",
                        display: "flex", justifyContent: "space-between", alignItems: "center",
                        textAlign: "left", width: "100%",
                        boxShadow: "0 2px 8px rgba(0,0,0,0.05)",
                      }}>
                      <div>
                        <p style={{ fontWeight: 800, fontSize: 14, color: "var(--text)", marginBottom: 2 }}>{s.nama}</p>
                        <p style={{ fontSize: 12, color: "var(--text-light)", fontWeight: 600 }}>NISN: {s.nisn} • {s.kelas}</p>
                      </div>
                      <div style={{ textAlign: "right" }}>
                        {n ? (
                          <>
                            <span style={{
                              background: n.status === "LULUS" ? "var(--success)" : "#FF6B6B",
                              color: "white", padding: "3px 10px", borderRadius: 20,
                              fontSize: 11, fontWeight: 800, display: "block", marginBottom: 3,
                            }}>{n.status}</span>
                            <span style={{ fontSize: 12, color: "var(--text-light)", fontWeight: 700 }}>⭐ {n.rataRata}</span>
                          </>
                        ) : (
                          <span style={{ fontSize: 12, color: "var(--text-muted)", fontWeight: 600 }}>Belum ada nilai</span>
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </>
        )
      )}
    </div>
  );
}

const labelStyle = { fontSize: 12, fontWeight: 700, color: "var(--text-light)", display: "block", marginBottom: 6 };
