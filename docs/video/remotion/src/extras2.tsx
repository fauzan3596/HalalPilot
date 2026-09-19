import React from "react";
import { Audio } from "@remotion/media";
import { AbsoluteFill, Easing, interpolate, Sequence, staticFile, useCurrentFrame, useVideoConfig } from "remotion";
import { C, FONT } from "./theme";
import { timeline } from "./timeline";
import { DarkBackdrop, Watermark } from "./ui";

const ease = Easing.bezier(0.16, 1, 0.3, 1);

/** Sisipan aturan YAML (adegan 3): E11 dari eligibility.yaml + tahapan chase-policy.yaml, baris muncul satu per satu. */
export const RulesInset: React.FC<{ from: number; seconds?: number }> = ({ from, seconds = 11 }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const local = frame - from;
  if (local < 0 || local > seconds * fps) return null;
  const left = [
    ["# rules/eligibility.yaml · v2026-09-10.1", C.muted],
    ["- id: E11_BAHAN_KRITIS_TERDOKUMENTASI", C.amber],
    ["  sumber: KEPKABAN_146_2025", C.ink],
    ['  butir: "Bab II A.2, A.9 & Bab III B"', C.ink],
    ["  deskripsi: Setiap bahan kelas 'kritis' harus", C.ink],
    ["    punya sertifikat pemasok valid.", C.ink],
    ["  efek: NEED_DOC   dokumen: SERT_PEMASOK", C.ink],
    ["  bobot_skor: 20", C.ink],
  ];
  const right = [
    ["# rules/chase-policy.yaml · v2026-09-02.1", C.muted],
    ["tahapan:", C.amber],
    ["  - { tahap: 1, setelah_jam: 24,  nada: ramah }", C.ink],
    ["  - { tahap: 2, setelah_jam: 72,  nada: tegas_sopan }", C.ink],
    ["  - { tahap: 3, setelah_jam: 168, nada: mendesak }", C.ink],
    ["  - { tahap: 4, setelah_jam: 240, target: pendamping }", C.red],
    ["jam_tenang: 21:00–07:00   maks_pesan_per_hari: 2", C.ink],
  ];
  const col = (rows: (string | string)[][], offset: number) => (
    <div style={{ fontFamily: "Consolas, 'Cascadia Mono', monospace", fontSize: 21, lineHeight: 1.45, whiteSpace: "pre" }}>
      {rows.map(([t, color], i) => (
        <div key={i} style={{ color, opacity: interpolate(local, [offset + i * 5, offset + i * 5 + 8], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" }) }}>{t}</div>
      ))}
    </div>
  );
  return (
    <div style={{ position: "absolute", left: 1010, top: 130, width: 870, padding: "22px 26px", borderRadius: 18, background: "rgba(10,16,12,0.92)", border: "1px solid rgba(255,255,255,0.1)",
      opacity: interpolate(local, [0, 10, seconds * fps - 10, seconds * fps], [0, 1, 1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" }),
      translate: interpolate(local, [0, 20], ["40px 0px", "0px 0px"], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: ease }) }}>
      <div style={{ fontFamily: FONT, color: C.muted, fontSize: 19, marginBottom: 12, letterSpacing: 1, textTransform: "uppercase" }}>Aturan yang dipakai mesin keputusan · bisa dibaca pendamping</div>
      {col(left, 6)}
      <div style={{ height: 14 }} />
      {col(right, 50)}
    </div>
  );
};

/** Kartu "Hasil demo dalam angka": enam ubin dengan angka yang berjalan naik. */
export const StatsCard: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const h = timeline.hasil;
  const tiles = [
    { n: 1, label: "UMK dari foto label sampai berkas siap", sub: "intake → evaluasi → dossier PDF" },
    { n: 4, label: "pengingat & eskalasi otomatis", sub: "H+1, H+3, H+7, lalu pendamping" },
    { n: 18, label: "aturan kelayakan deterministik", sub: "Kepkaban BPJPH 146/2025 · KMA 1360/2021" },
    { n: 498, label: "sinonim bahan di kamus", sub: "124 dikecualikan · 24 positif · 33 kritis" },
    { n: 86, label: "uji otomatis hijau", sub: "+ 86 skenario penerimaan tertulis" },
    { n: 4, label: "RAM, satu VPS kecil", sub: "terpakai 1,4 GB saat semuanya hidup", suffix: " GB" },
  ];
  return (
    <DarkBackdrop>
      {h?.mp3 ? <Sequence from={Math.round(0.8 * fps)}><Audio src={staticFile(`tts/${h.mp3}`)} /></Sequence> : null}
      <div style={{ position: "absolute", left: 0, right: 0, top: 0.1 * 1080, textAlign: "center", fontFamily: FONT, fontWeight: 700, fontSize: 64, color: C.ink,
        opacity: interpolate(frame, [0, 14], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" }) }}>Hasil demo dalam angka</div>
      <AbsoluteFill style={{ top: 0.26 * 1080, alignItems: "center" }}>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 500px)", gap: 24 }}>
          {tiles.map((t, i) => {
            const at = 12 + i * 9;
            const v = Math.round(interpolate(frame, [at, at + 1.1 * fps], [0, t.n], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: Easing.out(Easing.cubic) }));
            return (
              <div key={t.label} style={{ padding: "26px 28px", borderRadius: 18, background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", fontFamily: FONT, color: C.ink,
                opacity: interpolate(frame, [at, at + 12], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" }),
                translate: interpolate(frame, [at, at + 20], ["0px 24px", "0px 0px"], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: ease }) }}>
                <div style={{ fontSize: 76, fontWeight: 700, color: C.amber, lineHeight: 1, fontVariantNumeric: "tabular-nums" }}>{v}{t.suffix ?? ""}</div>
                <div style={{ fontSize: 28, marginTop: 10 }}>{t.label}</div>
                <div style={{ fontSize: 20, color: C.muted, marginTop: 6 }}>{t.sub}</div>
              </div>
            );
          })}
        </div>
      </AbsoluteFill>
      <Watermark />
    </DarkBackdrop>
  );
};
