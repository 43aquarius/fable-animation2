#!/bin/bash
# run-ffmpeg.sh — 运行 ffmpeg 并等待产物完成（沙箱中 ffmpeg 完成工作后进程不退出）
# 用法: bash run-ffmpeg.sh <输出文件> <预计时长秒> <ffmpeg参数...>
OUT=$1; EXPECT=$2; shift 2
rm -f "$OUT"
ffmpeg -y -v error "$@" > /tmp/ff-run.log 2>&1 &
PID=$!
# 轮询产物：尺寸稳定 + 时长达标 即视为完成
prev=-1; stable=0
for i in $(seq 1 $((EXPECT + 120))); do
  sleep 1
  if [ -f "$OUT" ]; then
    sz=$(stat -c%s "$OUT" 2>/dev/null || echo 0)
    if [ "$sz" = "$prev" ] && [ "$sz" -gt 1000 ]; then
      stable=$((stable + 1))
      if [ $stable -ge 3 ]; then
        # 尺寸已稳定，验证产物可读
        ok=$(ffprobe -v error -show_entries format=duration -of csv=p=0 "$OUT" 2>/dev/null || echo "")
        if [ -n "$ok" ]; then
          kill $PID 2>/dev/null; wait $PID 2>/dev/null
          echo "完成: $OUT ($sz bytes, ${ok}s)"
          exit 0
        fi
      fi
    else
      stable=0
    fi
    prev=$sz
  fi
  # 进程已死且产物可读
  if ! kill -0 $PID 2>/dev/null; then
    if [ -f "$OUT" ]; then
      ok=$(ffprobe -v error -show_entries format=duration -of csv=p=0 "$OUT" 2>/dev/null || echo "")
      [ -n "$ok" ] && { echo "完成(进程退出): $OUT ($sz bytes, ${ok}s)"; exit 0; }
    fi
    echo "失败: 进程退出且无有效产物"; cat /tmp/ff-run.log | tail -3; exit 1
  fi
done
kill $PID 2>/dev/null
echo "超时"; cat /tmp/ff-run.log | tail -3; exit 1
