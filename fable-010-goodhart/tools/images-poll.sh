#!/bin/bash
# images-poll.sh — Pollinations 备用插画生成（z-ai 限流时的降级通道）
# 用法: bash images-poll.sh <EP>
# 生成 580x1015 → 放大到 768x1344（Lanczos+锐化+纸纹颗粒）
set -e
EP=$1
[ -z "$EP" ] && { echo "用法: bash images-poll.sh <EP>"; exit 1; }
BASE=/home/z/my-project/fable$EP
OUT=$BASE/assets/images
mkdir -p "$OUT"

python3 - $BASE/assets/image-prompts.json $OUT <<'PY'
import json, sys, subprocess, os, time, urllib.parse

cfg_path, out_dir = sys.argv[1], sys.argv[2]
cfg = json.load(open(cfg_path))
style = cfg.get('style', '')
tasks = list(cfg.get('prompts', {}).items()) + list(cfg.get('landPrompts', {}).items())
land_names = set(cfg.get('landPrompts', {}).keys())

for name, prompt in tasks:
    final = f"{out_dir}/{name}.png"
    if os.path.exists(final) and os.path.getsize(final) > 50000:
        print(f"{name}: 已存在，跳过")
        continue
    is_land = name in land_names
    w, h = (1344, 768) if is_land else (768, 1344)
    full_prompt = prompt + style
    url = f"https://image.pollinations.ai/prompt/{urllib.parse.quote(full_prompt[:1800])}?width={580 if not is_land else 1015}&height={1015 if not is_land else 580}&model=flux&nologo=true&seed={hash(name) % 100000}"
    raw = f"{out_dir}/{name}_raw.jpg"
    ok = False
    for attempt in range(6):
        try:
            subprocess.run(['curl', '-sL', '--max-time', '120', '-o', raw, url], check=True, timeout=130)
            sz = os.path.getsize(raw) if os.path.exists(raw) else 0
            if sz > 30000:
                ok = True
                break
            print(f"{name} 第{attempt+1}次: 响应过小({sz})，等待后重试")
            time.sleep(65 if sz < 1000 else 10)
        except Exception as e:
            print(f"{name} 第{attempt+1}次失败: {e}")
            time.sleep(20)
    time.sleep(35)
    if not ok:
        print(f"{name}: ✗ 生成失败")
        continue
    # 放大 + 锐化 + 纸纹颗粒（水墨风格对颗粒友好）
    subprocess.run(['python3', '-c', f"""
from PIL import Image, ImageFilter, ImageEnhance
import numpy as np
img = Image.open('{raw}').convert('RGB')
img = img.resize(({w}, {h}), Image.LANCZOS)
img = img.filter(ImageFilter.UnsharpMask(radius=2.4, percent=90, threshold=2))
img = ImageEnhance.Contrast(img).enhance(1.06)
arr = np.array(img).astype(np.int16)
rng = np.random.default_rng(7)
noise = rng.normal(0, 3.5, arr.shape[:2])[:, :, None]
arr = np.clip(arr + noise, 0, 255).astype(np.uint8)
Image.fromarray(arr).save('{final}')
print('{name}: done')
"""], check=True)
PY
echo "POLL_IMAGES_DONE"
