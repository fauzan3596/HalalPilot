"""Pisahkan foto avatar jadi lapis 2.5D untuk video pesan & kesan.

  python3 -I docs/video/pesan-lapis.py <foto> <folder-keluar> [neck_y]

Keluaran (2048 px lebar, 2x foto asli):
  bg.png    latar dengan area orang diisi (inpaint) agar paralaks tidak bolong
  body.png  badan + leher (RGBA)
  head.png  kepala + rambut (RGBA), dipotong di garis leher dengan tepi lembut
  mask.png  mask orang (untuk QA)
"""
import sys
import cv2
import numpy as np
from PIL import Image
from rembg import new_session, remove

src, out = sys.argv[1], sys.argv[2]
NECK = float(sys.argv[3]) if len(sys.argv) > 3 else 318.0   # y garis potong leher pada foto asli 1024×572
S = 2

img = Image.open(src).convert("RGB")
img = img.resize((img.width * S, img.height * S), Image.LANCZOS)
W, H = img.size

cut = remove(img, session=new_session("isnet-anime"), post_process_mask=True)
alpha = np.array(cut)[:, :, 3].astype(np.float32) / 255.0
rgb = np.array(img)

# latar: isi area orang (mask dilebarkan) dengan inpaint, lalu haluskan sedikit
m = (alpha > 0.15).astype(np.uint8) * 255
m = cv2.dilate(m, np.ones((31, 31), np.uint8))
small = cv2.resize(rgb, (W // 4, H // 4), interpolation=cv2.INTER_AREA)
msmall = cv2.resize(m, (W // 4, H // 4), interpolation=cv2.INTER_NEAREST)
fill = cv2.inpaint(cv2.cvtColor(small, cv2.COLOR_RGB2BGR), msmall, 9, cv2.INPAINT_TELEA)
fill = cv2.cvtColor(cv2.resize(fill, (W, H), interpolation=cv2.INTER_CUBIC), cv2.COLOR_BGR2RGB)
fill = cv2.GaussianBlur(fill, (0, 0), 6)
mf = cv2.GaussianBlur(m.astype(np.float32) / 255.0, (0, 0), 6)[:, :, None]
bg = (rgb * (1 - mf) + fill * mf).astype(np.uint8)
Image.fromarray(bg).save(f"{out}/bg.png")

# potong kepala/badan di garis leher, tepi lembut 14 px
y = np.arange(H, dtype=np.float32)[:, None]
neck = NECK * S
head_w = np.clip((neck - y) / 14.0 + 0.5, 0, 1)           # 1 di atas garis, 0 di bawah
body_w = np.clip((y - (neck - 60)) / 14.0 + 0.5, 0, 1)    # badan naik 60 px ke balik kepala (tumpang tindih menutup celah)

def rgba(a):
    return Image.fromarray(np.dstack([rgb, (np.clip(a, 0, 1) * 255).astype(np.uint8)]))

rgba(alpha * head_w).save(f"{out}/head.png")
rgba(alpha * body_w).save(f"{out}/body.png")
Image.fromarray((alpha * 255).astype(np.uint8)).save(f"{out}/mask.png")
print(f"ok {W}x{H} leher y={neck:.0f}")
