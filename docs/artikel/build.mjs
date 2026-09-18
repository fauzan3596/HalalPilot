// Bangun HTML artikel dari docs/artikel-final.md.
//   node docs/artikel/build.mjs [https://url-dasar-gambar]
// Keluaran:
//   docs/artikel/blogspot.html  — potongan HTML untuk ditempel ke tab "HTML view" Blogger (gambar menunjuk URL dasar)
//   docs/artikel/pratinjau.html — halaman utuh untuk dibuka lokal (gambar relatif ke img/)
import { readFileSync, writeFileSync } from "node:fs";
import { execFileSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const here = dirname(fileURLToPath(import.meta.url));
const src = readFileSync(join(here, "..", "artikel-final.md"), "utf8");
const imgBase = process.argv[2] || "https://raw.githubusercontent.com/GANTI_AKUN/halalpilot/main/docs/artikel/img";

// 1) Buang judul H1 (judul pos diisi di Blogger), catatan draf di bawahnya, dan checklist tayang di paling bawah.
let md = src.replace(/^# .*\n/, "");
md = md.replace(/^\*Naskah final[^\n]*\*\n/m, "");
md = md.replace(/\n---\n\n\*Checklist tayang:[\s\S]*$/, "\n");
md = md.replace(/^---\n/m, ""); // garis pemisah pertama
const title = src.match(/^# (.*)$/m)[1];

// 2) Markdown → HTML (marked, GFM: tabel, kode berpagar)
const html = execFileSync("npx", ["--yes", "marked", "--gfm"], { input: md, encoding: "utf8", shell: true });

// 3) Gaya inline yang aman untuk Blogger (Blogger mempertahankan atribut style)
const style = {
  table: 'style="border-collapse:collapse;width:100%;margin:16px 0;font-size:15px"',
  th: 'style="border:1px solid #cfd6d1;padding:8px 10px;text-align:left;background:#eef2ee"',
  td: 'style="border:1px solid #cfd6d1;padding:8px 10px;vertical-align:top"',
  pre: 'style="background:#141d18;color:#e8eee9;padding:14px 16px;border-radius:8px;overflow:auto;font-size:13.5px;line-height:1.5"',
  img: 'style="max-width:100%;height:auto;display:block;margin:18px auto;border:1px solid #dde3df;border-radius:8px"',
  blockquote: 'style="border-left:4px solid #2f6b4a;margin:16px 0;padding:6px 16px;color:#4b5a51"',
};
function styled(h, base) {
  return h
    .replace(/<table>/g, `<table ${style.table}>`)
    .replace(/<th>/g, `<th ${style.th}>`).replace(/<th align="[a-z]+">/g, `<th ${style.th}>`)
    .replace(/<td>/g, `<td ${style.td}>`).replace(/<td align="[a-z]+">/g, `<td ${style.td}>`)
    .replace(/<pre>/g, `<pre ${style.pre}>`)
    .replace(/<img src="img\//g, `<img ${style.img} src="${base}/`)
    .replace(/<blockquote>/g, `<blockquote ${style.blockquote}>`);
}

// Ringkasan pembuka → blockquote agar terlihat seperti abstrak
const withAbstract = styled(html, imgBase).replace(/<p><strong>Ringkasan\.<\/strong>([\s\S]*?)<\/p>/, `<blockquote ${style.blockquote}><p><strong>Ringkasan.</strong>$1</p></blockquote>`);
writeFileSync(join(here, "blogspot.html"), `<!-- Judul pos: ${title} -->\n<!-- Tempel isi di bawah ini ke tab "HTML view" Blogger. Ganti GANTI_AKUN pada URL gambar, atau unggah gambar lewat editor Blogger lalu ganti src. -->\n${withAbstract}`);

const preview = `<!doctype html><html lang="id"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${title}</title>
<style>body{margin:0;background:#fafaf8;color:#141d18;font:17px/1.65 Georgia,"Times New Roman",serif}main{max-width:760px;margin:0 auto;padding:40px 20px 80px}h1{font:600 34px/1.2 "Segoe UI",Inter,Arial,sans-serif;letter-spacing:-.02em;margin:0 0 8px}h2{font:600 22px/1.3 "Segoe UI",Inter,Arial,sans-serif;margin:36px 0 10px}.meta{color:#6b7a70;font:14px "Segoe UI",Arial,sans-serif;margin-bottom:28px}a{color:#2f6b4a}code{font:14px Consolas,"Cascadia Mono",monospace;background:#eef2ee;padding:1px 5px;border-radius:4px}pre code{background:none;padding:0;color:inherit;font-size:13.5px}li{margin:4px 0}</style></head>
<body><main><h1>${title}</h1><div class="meta">Muhammad Fauzan Ramadhan · September 2026 · pratinjau lokal, gambar dari img/</div>
${styled(html, "img").replace(/<p><strong>Ringkasan\.<\/strong>([\s\S]*?)<\/p>/, `<blockquote ${style.blockquote}><p><strong>Ringkasan.</strong>$1</p></blockquote>`)}
</main></body></html>`;
writeFileSync(join(here, "pratinjau.html"), preview);

const words = md.replace(/```[\s\S]*?```/g, "").replace(/^\|.*$/gm, "").replace(/!\[[^\]]*\]\([^)]*\)/g, "").replace(/## Referensi[\s\S]*$/, "").split(/\s+/).filter(Boolean).length;
console.log(JSON.stringify({ judul: title, kata_badan: words, blogspot: "docs/artikel/blogspot.html", pratinjau: "docs/artikel/pratinjau.html", gambar: (html.match(/<img /g) || []).length, backlink: [/href="https:\/\/idwebhost\.com\/ai-hosting">AI Hosting</.test(html), /href="https:\/\/cloudbaik\.com">Cloud VPS</.test(html)] }));
