#!/bin/bash
# render3.sh — 第三期分段渲染（每段 1500 帧，跳过已完成段，支持多次调用续传）
set -e
EP=${1:-3}
COMP=${2:-EscortFable}
cd /home/z/my-project/fable$EP/video
SEG_DIR=/home/z/my-project/fable$EP/assets/segments
mkdir -p "$SEG_DIR"
TOTAL=$(python3 -c "import json; print(json.load(open('src/timeline.json'))['totalFrames'])")
CHUNK=1500

start=0
while [ $start -lt $TOTAL ]; do
  end=$((start + CHUNK - 1))
  if [ $end -ge $TOTAL ]; then end=$((TOTAL - 1)); fi
  idx=$(printf "%02d" $((start / CHUNK)))
  seg="$SEG_DIR/seg_${idx}.mp4"
  if [ -f "$seg" ]; then
    echo "seg_${idx}: 已存在，跳过"
  else
    echo "渲染 seg_${idx}: frames ${start}-${end}"
    npx remotion render "$COMP" "$seg" --frames=${start}-${end} --muted --concurrency=2 --log=error 2>&1 | tail -1
    frames=$(ffprobe -v error -select_streams v -count_frames -show_entries stream=nb_read_frames -of csv=p=0 "$seg")
    expect=$((end - start + 1))
    if [ "$frames" != "$expect" ]; then
      echo "seg_${idx} 帧数异常 ($frames != $expect)，删除重渲染"
      rm -f "$seg"
      exit 2
    fi
  fi
  start=$((end + 1))
done
echo "ALL_SEGMENTS_DONE"
