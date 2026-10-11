#!/bin/bash
# upload-episode.sh — 上传一期工程到 GitHub 仓库（staging 拷贝 + commit + push）
# 用法: bash upload-episode.sh <EP> <slug>
set -e
EP=$1
SLUG=$2
[ -z "$EP" ] || [ -z "$SLUG" ] && { echo "用法: bash upload-episode.sh <EP> <slug>（如 6 inflation）"; exit 1; }
BASE=/home/z/my-project/fable$EP
STAGE=/home/z/my-project/upload/fable-animation2/fable-0${EP}-${SLUG}
IDX=$(printf "%02d" $EP)
mkdir -p $STAGE/{script,covers}

# 1. 脚本与配置
cp $BASE/assets/script-draft.md $STAGE/script/ 2>/dev/null || true
cp $BASE/assets/script-humanized.md $STAGE/script/ 2>/dev/null || true
cp $BASE/assets/scenes.json $STAGE/script/
cp $BASE/assets/image-prompts.json $STAGE/script/ 2>/dev/null || true
cp $BASE/assets/docx-config.json $STAGE/script/ 2>/dev/null || true
cp $BASE/assets/*.docx $STAGE/script/ 2>/dev/null || true

# 2. 封面
cp $BASE/assets/cover_portrait.png $STAGE/covers/cover-portrait-1080x1920.png
cp $BASE/assets/cover_landscape.png $STAGE/covers/cover-landscape-1920x1080.png

# 3. Remotion 工程（不含 node_modules / 产物）
mkdir -p $STAGE/remotion
cp -r $BASE/video/src $BASE/video/public $BASE/video/package.json $BASE/video/tsconfig.json $BASE/video/remotion.config.ts $STAGE/remotion/ 2>/dev/null || true
rm -rf $STAGE/remotion/node_modules
# 音频走小文件拷贝；图片/真实素材已有
du -sh $STAGE/remotion/public/audio $STAGE/remotion/public/images $STAGE/remotion/public/real 2>/dev/null || true

# 4. 工具
mkdir -p $STAGE/tools
cp /home/z/my-project/pipeline/*.mjs /home/z/my-project/pipeline/*.cjs /home/z/my-project/pipeline/*.sh /home/z/my-project/pipeline/cover.py $STAGE/tools/ 2>/dev/null || true

# 5. commit + push
cd /home/z/my-project/upload/fable-animation2
git add -A
git commit -m "经济学寓言 0${EP}：全工程（口播稿/分镜/Remotion/双封面/工具）" || echo "无变更可提交"
git push origin main
echo "UPLOAD_DONE: fable-0${EP}-${SLUG}"
