---
id: US-05-N2
judul: Daftar bahan hanya air/garam/kemasan (E18) → diminta melengkapi
level: pengguna
tipe: negatif
terkait: FR-05, FR-06, E18
prioritas: M
komponen: rules/engine E18
otomasi: otomatis (node:test)
status: belum diuji
---

# US-05-N2 — Daftar bahan hanya air/garam/kemasan (E18) → diminta melengkapi

## Tujuan
Daftar bahan yang tidak masuk akal (pelanggaran verifikasi P3H menurut Kepkaban) tidak boleh diloloskan menjadi SIAP.

## Prasyarat
- `npm ci`

## Data uji
- Bahan: ['air'] saja
- Bahan: ['air','garam'] saja

## Langkah
1. Jalankan test E18.
2. Uji manual: UMK mengonfirmasi daftar bahan 'air' saja lalu evaluasi.

## Hasil yang diharapkan
- E18 butuh_dokumen, dokumen KONFIRMASI_BAHAN diminta, jalur KURANG_DOKUMEN.
- Agent meminta UMK menyebut semua bahan termasuk bumbu, minyak, dan bahan tambahan.

## Kriteria lolos
- Test hijau.
- Tidak ada SELF_DECLARE_SIAP dengan daftar bahan trivial.

## Catatan
- Rujukan: SPECS.md (FR-05, FR-06, E18); Kepkaban BPJPH 146/2025 Bab IV B.7.a (`docs/regulasi/kepkaban-146-2025-bab-i-iv.txt`).
- Saat lolos, ubah `status` di front-matter menjadi `lolos <tanggal>`.
