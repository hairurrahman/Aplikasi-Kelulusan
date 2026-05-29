import React, { useState, useEffect, useRef } from "react";
import { db } from "../firebase";
import { collection, getDocs, doc, setDoc } from "firebase/firestore";
import toast from "react-hot-toast";
import * as XLSX from "xlsx";

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
  const [importing, setImporting] = useState(false);
  const [search, setSearch] = useState("");
  const importRef = useRef();

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
      setSiswaList(siswaSnap.docs.map((d) => ({ ...d.data(), nisn: d.id })).sort((a, b) => (a.nama || "").localeCompare(b.nama || "", "id")));
      const nilaiMap = {};
      nilaiSnap.docs.forEach((d) => { nilaiMap[d.id] = d.data(); });
      setNilaiList(nilaiMap);
    } catch (e) {}
    setLoading(false);
  }

  function openForm(s) {
    setSelectedSiswa(s);
    const existing = nilaiList[s.nisn];
    const init = {};
    MAPEL_URUTAN.forEach((m) => { init[m] = existing?.mapel?.[m] ?? ""; });
    setForm(init);
    setStatus(existing?.status || "LULUS");
    setCatatan(existing?.catatan || "");
  }

  function calcRataRata(mapel) {
    const vals = Object.values(mapel).filter((v) => v !== "" && !isNaN(v)).map(Number);
    if (vals.length === 0) return 0;
    return parseFloat((vals.reduce((a, b) => a + b, 0) / vals.length).toFixed(2));
  }

  async function saveNilai() {
    if (!selectedSiswa) return;
    setSaving(true);
    try {
      const rataRata = calcRataRata(form);
      const mapelNum = {};
      MAPEL_URUTAN.forEach((m) => { mapelNum[m] = form[m] !== "" ? Number(form[m]) : 0; });
      await setDoc(doc(db, `tahunAjaran/${tahunAjaran}/nilai`, selectedSiswa.nisn), {
        mapel: mapelNum, status, catatan, rataRata,
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

  // Download template xlsx nilai
  function downloadTemplate() {
    const header = ["NISN", "Nama", ...MAPEL_URUTAN, "Status (LULUS/TIDAK LULUS)", "Catatan"];
    const contoh = ["1234567890", "Nama Siswa", ...MAPEL_URUTAN.map(() => 80), "LULUS", ""];
    const ws = XLSX.utils.aoa_to_sheet([header, contoh]);
    const colWidths = [{ wch: 15 }, { wch: 25 }, ...MAPEL_URUTAN.map(() => ({ wch: 20 })), { wch: 25 }, { wch: 20 }];
    ws["!cols"] = colWidths;
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Nilai Siswa");
    XLSX.writeFile(wb, `template_nilai_${tahunAjaran || "sd"}.xlsx`);
    toast.success("Template nilai berhasil diunduh!");
  }

  // Import nilai from xlsx
  async function handleImport(e) {
    const file = e.target.files[0];
    if (!file) return;
    if (!tahunAjaran) { toast.error("Pilih tahun ajaran dulu!"); return; }
    setImporting(true);
    try {
      const data = await file.arrayBuffer();
      const wb = XLSX.read(data);
      const ws = wb.Sheets[wb.SheetNames[0]];
      const rows = XLSX.utils.sheet_to_json(ws, { header: 1 });
      const dataRows = rows.slice(1).filter(r => r[0]);
      if (dataRows.length === 0) { toast.error("Tidak ada data!"); setImporting(false); return; }
      let sukses = 0;
      for (const row of dataRows) {
        const nisnVal = String(row[0]).trim();
        if (!nisnVal) continue;
        const mapelData = {};
        MAPEL_URUTAN.forEach((m, idx) => { mapelData[m] = Number(row[2 + idx]) || 0; });
        const rataRata = calcRataRata(mapelData);
        const statusVal = String(row[2 + MAPEL_URUTAN.length] || "LULUS").trim().toUpperCase();
        await setDoc(doc(db, `tahunAjaran/${tahunAjaran}/nilai`, nisnVal), {
          mapel: mapelData,
          status: statusVal === "TIDAK LULUS" ? "TIDAK LULUS" : "LULUS",
          catatan: String(row[3 + MAPEL_URUTAN.length] || ""),
          rataRata,
          updatedAt: new Date().toISOString(),
        });
        sukses++;
      }
      toast.success(`${sukses} nilai berhasil diimport! 🎉`);
      fetchData();
    } catch (err) {
      toast.error("Gagal import: " + err.message);
    }
    setImporting(false);
    e.target.value = "";
  }

  // Export nilai
  function exportData() {
    if (siswaList.length === 0) { toast.error("Tidak ada data!"); return; }
    const header = ["NISN", "Nama", ...MAPEL_URUTAN, "Status", "Rata-rata", "Catatan"];
    const rows = [header];
    siswaList.forEach(s => {
      const n = nilaiList[s.nisn];
      rows.push([
        s.nisn, s.nama || "",
        ...MAPEL_URUTAN.map(m => n?.mapel?.[m] ?? ""),
        n?.status || "", n?.rataRata || "", n?.catatan || "",
      ]);
    });
    const ws = XLSX.utils.aoa_to_sheet(rows);
    ws["!cols"] = [{ wch: 15 }, { wch: 25 }, ...MAPEL_URUTAN.map(() => ({ wch: 20 })), { wch: 15 }, { wch: 10 }, { wch: 20 }];
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Nilai Siswa");
    XLSX.writeFile(wb, `data_nilai_${tahunAjaran}.xlsx`);
    toast.success("Data nilai berhasil diekspor!");
  }

  const filtered = siswaList.filter((s) =>
    s.nama?.toLowerCase().includes(search.toLowerCase()) || s.nisn?.includes(search)
  );

  return (
    <div>
      <h2 style={{ fontSize: 22, color: "var(--text)", marginBottom: 16 }}>📊 Input Nilai</h2>

      <div className="card" style={{ marginBottom: 16 }}>
        <label style={labelStyle}>📅 Tahun Ajaran</label>
        <select className="input-field" value={tahunAjaran} onChange={(e) => onChangeTahun(e.target.value)}>
          <option value="">-- Pilih --</option>
          {tahunList.map((t) => <option key={t} value={t}>{t}</option>)}
        </select>
      </div>

      {selectedSiswa ? (
        <div className="animate-fadeIn">
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16 }}>
            <button onClick={() => setSelectedSiswa(null)} style={{ background: "#f0f0f0", padding: "8px 14px", borderRadius: 20, fontWeight: 700, fontSize: 13, color: "var(--text)" }}>← Kembali</button>
            <div>
              <p style={{ fontWeight: 800, fontSize: 15 }}>{selectedSiswa.nama}</p>
              <p style={{ fontSize: 12, color: "var(--text-light)", fontWeight: 600 }}>NISN: {selectedSiswa.nisn}</p>
            </div>
          </div>

          <div className="card" style={{ marginBottom: 16 }}>
            <h3 style={{ fontSize: 15, color: "var(--secondary)", marginBottom: 14 }}>📝 Nilai Per Mata Pelajaran</h3>
            {MAPEL_URUTAN.map((mapel, i) => (
              <div key={mapel} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10, gap: 10 }}>
                <label style={{ fontSize: 12, fontWeight: 700, flex: 1, color: "var(--text)", lineHeight: 1.3 }}>
                  {i + 1}. {mapel}
                </label>
                <input type="number" min={0} max={100}
                  value={form[mapel] ?? ""}
                  onChange={(e) => setForm({ ...form, [mapel]: e.target.value })}
                  style={{
                    width: 70, padding: "8px 10px",
                    border: "2.5px solid var(--border)", borderRadius: 10,
                    fontSize: 15, fontWeight: 800, textAlign: "center", background: "#FFFAF5",
                    color: Number(form[mapel]) >= 70 ? "var(--success)" : form[mapel] > 0 ? "#FF6B6B" : "var(--text)",
                  }} placeholder="0" />
              </div>
            ))}
            <div style={{ marginTop: 12, padding: "12px 16px", background: "linear-gradient(135deg, var(--accent), #FFD700)", borderRadius: "var(--radius-sm)", display: "flex", justifyContent: "space-between" }}>
              <span style={{ fontWeight: 800 }}>⭐ Rata-rata</span>
              <span style={{ fontWeight: 900, fontSize: 18 }}>{Number(calcRataRata(form)).toFixed(2)}</span>
            </div>
          </div>

          <div className="card" style={{ marginBottom: 16 }}>
            <label style={labelStyle}>🏆 Status Kelulusan</label>
            <div style={{ display: "flex", gap: 8 }}>
              {["LULUS", "TIDAK LULUS"].map((s) => (
                <button key={s} onClick={() => setStatus(s)} style={{
                  flex: 1, padding: "12px", borderRadius: "var(--radius-sm)",
                  background: status === s ? (s === "LULUS" ? "linear-gradient(135deg, var(--success), #3ECC61)" : "linear-gradient(135deg, #FF6B6B, var(--primary-dark))") : "#f0f0f0",
                  color: status === s ? "white" : "var(--text-light)",
                  fontWeight: 800, fontSize: 13,
                }}>
                  {s === "LULUS" ? "✅ LULUS" : "❌ TIDAK LULUS"}
                </button>
              ))}
            </div>
          </div>

          <div className="card" style={{ marginBottom: 16 }}>
            <label style={labelStyle}>📝 Catatan (opsional)</label>
            <textarea className="input-field" rows={3} placeholder="Catatan untuk siswa..."
              value={catatan} onChange={(e) => setCatatan(e.target.value)} style={{ resize: "none" }} />
          </div>

          <button className="btn-primary" onClick={saveNilai} disabled={saving}>
            {saving ? "Menyimpan..." : "💾 Simpan Nilai"}
          </button>
        </div>
      ) : (
        tahunAjaran && (
          <>
            {/* Toolbar Import/Export */}
            <div style={{ display: "flex", gap: 8, marginBottom: 14, flexWrap: "wrap" }}>
              <button onClick={downloadTemplate} style={{
                flex: 1, padding: "10px 8px", borderRadius: "var(--radius-sm)",
                background: "linear-gradient(135deg, #51CF66, #3ECC61)",
                color: "white", fontWeight: 800, fontSize: 12,
                boxShadow: "0 3px 8px rgba(81,207,102,0.3)",
              }}>📥 Unduh Template</button>
              <input type="file" ref={importRef} style={{ display: "none" }} accept=".xlsx,.xls" onChange={handleImport} />
              <button onClick={() => importRef.current?.click()} disabled={importing} style={{
                flex: 1, padding: "10px 8px", borderRadius: "var(--radius-sm)",
                background: "linear-gradient(135deg, var(--blue), #1E8FD5)",
                color: "white", fontWeight: 800, fontSize: 12,
                boxShadow: "0 3px 8px rgba(51,154,240,0.3)",
              }}>{importing ? "Mengimport..." : "📤 Import XLSX"}</button>
              <button onClick={exportData} style={{
                flex: 1, padding: "10px 8px", borderRadius: "var(--radius-sm)",
                background: "linear-gradient(135deg, var(--purple), #6B4CE0)",
                color: "white", fontWeight: 800, fontSize: 12,
                boxShadow: "0 3px 8px rgba(132,94,247,0.3)",
              }}>💾 Export XLSX</button>
            </div>

            <div style={{ background: "#F0F7FF", borderRadius: "var(--radius-sm)", padding: "10px 14px", marginBottom: 14, border: "2px solid var(--blue)20" }}>
              <p style={{ fontSize: 12, color: "var(--blue)", fontWeight: 700 }}>
                💡 Unduh template → isi nilai di Excel → import untuk input massal
              </p>
            </div>

            <input className="input-field" placeholder="🔍 Cari siswa..."
              value={search} onChange={(e) => setSearch(e.target.value)} style={{ marginBottom: 14 }} />

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
                    <button key={s.nisn} onClick={() => openForm(s)} style={{
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
                            <span style={{ background: n.status === "LULUS" ? "var(--success)" : "#FF6B6B", color: "white", padding: "3px 10px", borderRadius: 20, fontSize: 11, fontWeight: 800, display: "block", marginBottom: 3 }}>{n.status}</span>
                            <span style={{ fontSize: 12, color: "var(--text-light)", fontWeight: 700 }}>⭐ {Number(n.rataRata).toFixed(2)}</span>
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
