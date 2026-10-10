import { Composition } from 'remotion';
import { EscortVideo } from './EscortVideo';
import timeline from './timeline.json';

export const RemotionRoot: React.FC = () => (
  <Composition
    id="EscortFable"
    component={EscortVideo}
    durationInFrames={timeline.totalFrames}
    fps={timeline.fps}
    width={timeline.width}
    height={timeline.height}
  />
);
