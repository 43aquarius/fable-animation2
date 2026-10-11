#!/bin/bash
# build-final.sh v5 — 用 run-ffmpeg.sh 守护（ffmpeg 完成工作后不退出是本沙箱已知怪癖）
# 用法: bash build-final.sh <EP>
set -e
EP=$1
[ -z "$EP" ] && { echo "用法: bash build-final.sh <EP>"; exit 1; }
BASE=/home/z/my-project/fable$EP
SEG_DIR=$BASE/assets/segments
OUT_DIR=$BASE/output
mkdir -p "$OUT_DIR"
W=/tmp/build-ep$EP
PIPE=/home/z/my-project/pipeline
mkdir -p $W

# 1. 合并分段
ls $SEG_DIR/seg_*.mp4 | sort | while read f; do echo "file '$f'"; done > $W/concat.txt
bash $PIPE/run-ffmpeg.sh $W/merged.mp4 5 -f concat -safe 0 -i $W/concat.txt -c copy $W/merged.mp4

# 2. 响度测量
cp $BASE/assets/mix.wav $W/mix.wav
GAIN=$(python3 $PIPE/measure-gain.py $W/mix.wav)
echo "增益: ${GAIN}dB"

# 3. 增益 + 限幅
bash $PIPE/run-ffmpeg.sh $W/audio_final.wav 30 -i $W/mix.wav -af "volume=${GAIN}dB,alimiter=limit=0.84:level=false" -ar 48000 -ac 2 $W/audio_final.wav

# 4. 封装
DUR=$(ffprobe -v error -show_entries format=duration -of csv=p=0 $W/merged.mp4)
bash $PIPE/run-ffmpeg.sh $W/final.mp4 ${DUR%.*} -i $W/merged.mp4 -i $W/audio_final.wav -map 0:v -map 1:a -c:v copy -c:a aac -b:a 192k -shortest -movflags +faststart $W/final.mp4

cp $W/final.mp4 $OUT_DIR/final.mp4
cp $W/audio_final.wav $BASE/assets/audio_final.wav
echo "=== 成片: $(ffprobe -v error -show_entries format=duration -of csv=p=0 $OUT_DIR/final.mp4)s, $(stat -c%s $OUT_DIR/final.mp4) bytes ==="
rm -rf $W
