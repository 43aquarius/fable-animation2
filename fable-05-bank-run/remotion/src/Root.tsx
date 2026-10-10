import { Composition } from 'remotion';
import { BankVideo } from './BankVideo';
import timeline from './timeline.json';

export const RemotionRoot: React.FC = () => (
  <Composition
    id="BankFable"
    component={BankVideo}
    durationInFrames={timeline.totalFrames}
    fps={timeline.fps}
    width={timeline.width}
    height={timeline.height}
  />
);
