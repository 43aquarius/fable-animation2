#!/bin/bash
# setup-video.sh — 为某期搭建 Remotion 工程（复制通用组件，改 composition id）
# 用法: bash setup-video.sh <EP>
set -e
EP=$1
[ -z "$EP" ] && { echo "用法: bash setup-video.sh <EP>"; exit 1; }
BASE=/home/z/my-project/fable$EP
SRC=/home/z/my-project/fable6/video

mkdir -p $BASE/video/src $BASE/video/public/fonts $BASE/video/public/images $BASE/video/public/audio $BASE/video/public/real
cp $SRC/src/FableVideo.tsx $SRC/src/fonts.ts $SRC/src/index.ts $BASE/video/src/
cp $SRC/package.json $SRC/tsconfig.json $SRC/remotion.config.ts $BASE/video/
cp $SRC/public/fonts/*.ttf $BASE/video/public/fonts/

cat > $BASE/video/src/Root.tsx << EOF
import { Composition } from 'remotion';
import { FableVideo } from './FableVideo';
import timeline from './timeline.json';

export const RemotionRoot: React.FC = () => (
  <Composition
    id="Fable$EP"
    component={FableVideo}
    durationInFrames={timeline.totalFrames}
    fps={timeline.fps}
    width={timeline.width}
    height={timeline.height}
  />
);
EOF

# 复用 fable6 的 node_modules（符号链接，避免重复安装占盘）
rm -rf $BASE/video/node_modules
ln -s $SRC/node_modules $BASE/video/node_modules

echo "fable$EP video project ready (composition Fable$EP)"
