#!/bin/bash
# real-photos.sh — 通用真实素材：读 fable{EP}/assets/real-requests.json（image-search + 下载）
# 格式: [ { "name": "real_weimar", "en": "...", "zh": "..." }, ... ]
set -e
EP=$1
[ -z "$EP" ] && { echo "用法: bash real-photos.sh <EP>"; exit 1; }
BASE=/home/z/my-project/fable$EP
OUT=$BASE/assets/real
mkdir -p "$OUT"

REQS=$(python3 -c "import json; print(' '.join(r['name']+'|'+r['en']+'|'+r['zh'] for r in json.load(open('$BASE/assets/real-requests.json'))))")

for req in $REQS; do
  name="${req%%|*}"
  rest="${req#*|}"
  en="${rest%%|*}"
  zh="${rest#*|}"
  if [ -f "$OUT/${name}.jpg" ]; then echo "$name: 已存在"; continue; fi
  echo "== 搜索 $name =="
  z-ai image-search -q "$en" --count 5 --gl us -o "$OUT/${name}.json" || z-ai image-search -q "$zh" --count 5 --gl cn -o "$OUT/${name}.json"
  python3 - "$OUT/${name}.json" "$OUT/${name}.jpg" <<'PY'
import json, sys, subprocess
meta, out = sys.argv[1], sys.argv[2]
data = json.load(open(meta))
res = data.get('results') or []
def px(v):
    try: return int(str(v).replace('px','') or 0)
    except: return 0
res.sort(key=lambda r: -(px(r.get('original_width')) * px(r.get('original_height'))))
for r in res[:5]:
    url = r['original_url']
    try:
        subprocess.run(['curl','-sL','--max-time','40','-o',out,url], check=True)
        sz = subprocess.run(['stat','-c','%s',out], capture_output=True, text=True).stdout.strip()
        if int(sz) > 40000:
            print('downloaded', url, sz)
            sys.exit(0)
    except Exception as e:
        print('retry', e)
sys.exit(1)
PY
done
echo "ALL_REAL_SEARCHED"
