#!/bin/bash
# release-episode.sh — 发布一期成品到 GitHub Release
# 用法: bash release-episode.sh <EP> <slug>
set -e
EP=$1
SLUG=$2
[ -z "$EP" ] || [ -z "$SLUG" ] && { echo "用法: bash release-episode.sh <EP> <slug>"; exit 1; }
BASE=/home/z/my-project/fable$EP
IDX=$(printf "%02d" $EP)
TAG="fable-${IDX}"
STAGE=/home/z/my-project/upload/fable-animation2/fable-${IDX}-${SLUG}
API=https://api.github.com/repos/43aquaris/fable-animation2

cd /home/z/my-project/upload/fable-animation2
TOKEN=$(git remote get-url origin | sed 's|https://[^:]*:\([^@]*\)@.*|\1|')
AUTH="Authorization: Bearer $TOKEN"

# 读取 docx-config 的元信息
read TITLE CONCEPT BODYFILE < <(python3 -c "
import json
c = json.load(open('$BASE/assets/docx-config.json'))
print(c['title'], c['conceptEn'] or c['concept'], '/tmp/release_${IDX}.md')")

# 生成 release body
python3 - "$BASE/assets/docx-config.json" "/tmp/release_${IDX}.md" "$TAG" <<'PY'
import json, sys
cfg, out, tag = sys.argv[1], sys.argv[2], sys.argv[3]
dur = cfg.get('duration', '5 分钟左右')
body = f"""「概念当铺」经济学寓言系列第 {tag.split('-')[1]} 期完整成片。

**概念**：{cfg['concept']}（{cfg.get('conceptEn','')}）——{cfg['conceptOneLiner']}

**视频规格**：抖音竖屏 1080×1920 ｜ {dur} ｜ 30fps ｜ H.264 + AAC 192k ｜ 响度 -14 LUFS ｜ 全片字幕内嵌

**内容结构**：开场悬念 → 原创寓言（故事结束才揭晓概念）→ 概念拆解 → 隐喻逐条对照 → 真实历史案例 → 下期预告

**质检**：分句级 TTS + ASR 回检（断句自然度）｜ 每景抽帧 VLM 排版终检（无文字重叠/裁切）

寓言名《{cfg['title']}》。工程源文件在本目录，本地重建见仓库 README。
"""
open(out, 'w').write(body)
print('body written')
PY

# 创建 release
REL=$(curl -s -X POST -H "$AUTH" -H "Content-Type: application/json" $API/releases -d @- <<JSON
{
  "tag_name": "$TAG",
  "name": "经济学寓言 ${IDX} · ${TITLE}（${CONCEPT}）",
  "body": $(python3 -c "import json; print(json.dumps(open('/tmp/release_${IDX}.md').read()))")
}
JSON
)
REL_ID=$(echo "$REL" | python3 -c "import json,sys; print(json.load(sys.stdin)['id'])")
echo "Release ID: $REL_ID"

# 上传资产
up() {
  local file=$1 name=$2
  curl -s -X POST -H "$AUTH" -H "Content-Type: application/octet-stream" --data-binary @"$file" \
    "$API/releases/$REL_ID/assets?name=$name" | python3 -c "import json,sys; d=json.load(sys.stdin); print('asset:', d.get('name'), d.get('state', d.get('message')))"
}

up "$BASE/output/final.mp4" "fable-${IDX}-${SLUG}-douyin-1080x1920.mp4"
up "$BASE/assets/cover_portrait.png" "fable-${IDX}-cover-portrait-1080x1920.png"
up "$BASE/assets/cover_landscape.png" "fable-${IDX}-cover-landscape-1920x1080.png"
DOCX=$(ls "$STAGE/script/"*.docx 2>/dev/null | head -1)
[ -n "$DOCX" ] && up "$DOCX" "fable-${IDX}-script-douyin.docx"
echo "RELEASE_DONE: $TAG"
