"""Waktu tiap kata untuk caption karaoke video pesan & kesan.

  python3 -P docs/video/pesan-kata.py <folder-pesan>   (folder berisi NN.txt teks kalimat dan NN.mp3 suaranya)

Untuk suara TTS: batas kata diambil dari event WordBoundary edge-tts (suara disintesis ulang ke berkas yang sama
agar waktunya identik). Untuk rekaman sendiri (NN.rekam ada): kata dibagi rata sepanjang durasi bicara.
Keluaran: NN.words.json  [{"w": "Halo,", "t": 0.10, "d": 0.42}, ...]
"""
import asyncio, json, os, subprocess, sys
import edge_tts

D = sys.argv[1]

def durasi(p):
    return float(subprocess.check_output(["ffprobe", "-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", p]).decode().strip())

async def tts_kata(teks, mp3):
    com = edge_tts.Communicate(teks, "id-ID-ArdiNeural", rate="+4%", boundary="WordBoundary")
    kata = []
    with open(mp3, "wb") as f:
        async for ch in com.stream():
            if ch["type"] == "audio":
                f.write(ch["data"])
            elif ch["type"] == "WordBoundary":
                kata.append({"w": ch["text"], "t": ch["offset"] / 1e7, "d": ch["duration"] / 1e7})
    return kata

def tempel_tanda_baca(teks, kata):
    """WordBoundary membuang tanda baca; pasangkan kembali dengan token teks asli."""
    token = teks.split()
    out, j = [], 0
    for k in kata:
        while j < len(token) and k["w"].lower().strip(".,:!?") not in token[j].lower():
            j += 1
        w = token[j] if j < len(token) else k["w"]
        out.append({**k, "w": w})
        j += 1
    return out

async def main():
    for nn in sorted(f[:2] for f in os.listdir(D) if f.endswith(".txt") and f[:2].isdigit()):
        teks = open(f"{D}/{nn}.txt", encoding="utf-8").read().strip()
        mp3 = f"{D}/{nn}.mp3"
        if os.path.exists(f"{D}/{nn}.rekam"):
            token = teks.split(); d = durasi(mp3) - 0.3
            per = d / max(1, sum(len(t) for t in token))
            kata, t = [], 0.15
            for tk in token:
                kata.append({"w": tk, "t": round(t, 3), "d": round(len(tk) * per, 3)}); t += len(tk) * per
        else:
            kata = tempel_tanda_baca(teks, await tts_kata(teks, mp3))
        json.dump(kata, open(f"{D}/{nn}.words.json", "w", encoding="utf-8"), ensure_ascii=False)
        print(nn, len(kata), "kata")

asyncio.run(main())
