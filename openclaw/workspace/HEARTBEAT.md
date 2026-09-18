# HEARTBEAT.md — dijalankan tiap heartbeat (set 6 jam; nonaktifkan jika biaya model membengkak)

Lakukan hanya ini, tanpa mengirim pesan ke siapa pun kecuali ada eskalasi baru:
1. `api.mjs portfolio_summary {"koperasi_id":1}`
2. Jika ada `eskalasi_terbuka` yang belum pernah kamu laporkan (cek MEMORY.md), kirim satu pesan ringkas ke pendamping.
3. Catat di MEMORY.md: waktu, jumlah siap unggah, jumlah eskalasi yang sudah dilaporkan.
Jika API tidak bisa dihubungi dua heartbeat berturut-turut, laporkan ke pendamping: "Layanan HalalPilot tidak merespons sejak <waktu>."
