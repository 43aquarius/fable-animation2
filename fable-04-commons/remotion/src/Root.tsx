import { Composition } from 'remotion';
import { GrassVideo } from './GrassVideo';
import timeline from './timeline.json';

export const RemotionRoot: React.FC = () => (
  <Composition
    id="GrassFable"
    component={GrassVideo}
    durationInFrames={timeline.totalFrames}
    fps={timeline.fps}
    width={timeline.width}
    height={timeline.height}
  />
);
