import { staticFile } from 'remotion';

const css = `
@font-face { font-family: 'SC'; src: url('${staticFile('fonts/NotoSerifSC-Black.ttf')}') format('truetype'); font-weight: 900; }
@font-face { font-family: 'SC'; src: url('${staticFile('fonts/NotoSerifSC-Bold.ttf')}') format('truetype'); font-weight: 700; }
@font-face { font-family: 'SC'; src: url('${staticFile('fonts/NotoSerifSC-SemiBold.ttf')}') format('truetype'); font-weight: 600; }
@font-face { font-family: 'SC'; src: url('${staticFile('fonts/NotoSerifSC-Regular.ttf')}') format('truetype'); font-weight: 400; }
@font-face { font-family: 'SANS'; src: url('${staticFile('fonts/NotoSansSC[wght].ttf')}') format('truetype'); font-weight: 100 900; }
`;

const styleTag = document.createElement('style');
styleTag.textContent = css;
document.head.appendChild(styleTag);
