#!/bin/bash
# build-final3.sh — 合并分段视频 + 混音 + 双遍 loudnorm(-14 LUFS / TP -1.5dB) + 封装
set -e
EP=${1:-3}
BASE=/home/z/my-project/fable$EP
cd $BASE/assets

# 1. 合并分段
cd segments
ls seg_*.mp4 | sort > /tmp/seg_list.txt
: > list.txt
while read f; do echo "file '$PWD/$f'" >> list.txt; done < /tmp/seg_list.txt
ffmpeg -y -v error -f concat -safe 0 -i list.txt -c copy $BASE/assets/video_only.mp4
echo "video_only.mp4: $(ffprobe -v error -show_entries format=duration -of csv=p=0 $BASE/assets/video_only.mp4)s"

# 2. 重建混音轨
node $BASE/tools/build-audio$EP.cjs $EP

# 3. loudnorm 第一遍（测量）
ffmpeg -y -v info -i $BASE/assets/mix.wav -af loudnorm=I=-14:TP=-1.5:LRA=11:print_format=json -f null - 2>&1 | sed -n '/{/,/}/p' > $BASE/assets/loudnorm.json
cat $BASE/assets/loudnorm.json

# 4. loudnorm 第二遍（应用）
MI=$(python3 -c "import json;d=json.load(open('$BASE/assets/loudnorm.json'));print(d['input_i'])")
MTP=$(python3 -c "import json;d=json.load(open('$BASE/assets/loudnorm.json'));print(d['input_tp'])")
MLRA=$(python3 -c "import json;d=json.load(open('$BASE/assets/loudnorm.json'));print(d['input_lra'])")
MTH=$(python3 -c "import json;d=json.load(open('$BASE/assets/loudnorm.json'));print(d['input_thresh'])")
OFF=$(python3 -c "import json;d=json.load(open('$BASE/assets/loudnorm.json'));print(d['target_offset'])")
ffmpeg -y -v error -i $BASE/assets/mix.wav -af "loudnorm=I=-14:TP=-1.5:LRA=11:measured_i=$MI:measured_tp=$MTP:measured_lra=$MLRA:measured_thresh=$MTH:offset=$OFF:linear=true" -ar 48000 -ac 2 $BASE/assets/final_audio.wav
echo "final_audio.wav 完成"

# 5. 封装（视频流无损复制，音频 AAC 192k）
ffmpeg -y -v error -i $BASE/assets/video_only.mp4 -i $BASE/assets/final_audio.wav -c:v copy -c:a aac -b:a 192k -shortest -movflags +faststart $BASE/assets/final.mp4
echo "=== 成品 ==="
ffprobe -v error -show_entries format=duration,size,bit_rate -of default=noprint_wrappers=1 $BASE/assets/final.mp4
ffprobe -v error -select_streams a -show_entries stream=codec_name,sample_rate,channels,bit_rate -of default=noprint_wrappers=1 $BASE/assets/final.mp4
