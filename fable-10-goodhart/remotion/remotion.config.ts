import { Config } from '@remotion/cli/config';

Config.setVideoImageFormat('jpeg');
Config.setJpegQuality(85);
Config.setCodec('h264');
Config.setCrf(20);
Config.setOverwriteOutput(true);
