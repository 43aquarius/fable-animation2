import { Composition } from 'remotion';
import { MarketVideo } from './MarketVideo';
import timeline from './timeline.json';

export const RemotionRoot: React.FC = () => (
  <Composition
    id="LemonMarketFable"
    component={MarketVideo}
    durationInFrames={timeline.totalFrames}
    fps={timeline.fps}
    width={timeline.width}
    height={timeline.height}
  />
);
