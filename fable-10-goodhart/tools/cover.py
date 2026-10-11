# cover.py — 通用抖音双封面合成（竖屏 1080x1920 + 横屏 1920x1080）
# 用法: python3 cover.py <EP>
# 读 fable{EP}/assets/cover-config.json:
# { "chip": "经济学寓言 · 第六集", "title1": "...", "title2": "...", "subtitle": "...",
#   "hook1": "...", "hook2": "...", "bottom": "...", "palette": {...} }
from PIL import Image, ImageDraw, ImageFont
import json, sys

EP = sys.argv[1]
BASE = f'/home/z/my-project/fable{EP}'
CFG = json.load(open(f'{BASE}/assets/cover-config.json'))

F_BLACK = '/usr/share/fonts/truetype/noto-serif-sc/NotoSerifSC-Black.ttf'
F_SEMI = '/usr/share/fonts/truetype/noto-serif-sc/NotoSerifSC-SemiBold.ttf'

PAL = CFG.get('palette', {})
PAPER = tuple(PAL.get('paper', (242, 233, 214)))
RED = tuple(PAL.get('red', (255, 116, 94)))
GOLD = tuple(PAL.get('gold', (235, 197, 122)))
GOLD_DEEP = tuple(PAL.get('goldDeep', (158, 112, 44)))


def load_cover(path, w, h):
    img = Image.open(path).convert('RGB')
    scale = max(w / img.width, h / img.height)
    nw, nh = int(img.width * scale + 0.5), int(img.height * scale + 0.5)
    img = img.resize((nw, nh), Image.LANCZOS)
    x0 = (nw - w) // 2
    y0 = (nh - h) // 2
    return img.crop((x0, y0, x0 + w, y0 + h))


def text_center(draw, w, y, s, font, fill, stroke=0, stroke_fill=(0, 0, 0)):
    tw = draw.textlength(s, font=font)
    draw.text(((w - tw) / 2, y), s, font=font, fill=fill, stroke_width=stroke, stroke_fill=stroke_fill)


def two_color(draw, w, y, part1, part2, font, fill1, fill2, stroke=6):
    tw1 = draw.textlength(part1, font=font)
    tw2 = draw.textlength(part2, font=font)
    x = (w - tw1 - tw2) / 2
    draw.text((x, y), part1, font=font, fill=fill1, stroke_width=stroke, stroke_fill=(0, 0, 0))
    draw.text((x + tw1, y), part2, font=font, fill=fill2, stroke_width=stroke, stroke_fill=(0, 0, 0))


# ================= 竖屏 1080x1920 =================
W, H = 1080, 1920
img = load_cover(f'{BASE}/assets/images/cover_base.png', W, H)
img = Image.blend(img, Image.new('RGB', (W, H), (14, 12, 10)), 0.22)

grad = Image.new('L', (1, H), 0)
for y in range(H):
    v = 0
    if y < 760:
        v = int(235 * (1 - y / 760) ** 1.3)
    if y > 1180:
        v = max(v, int(242 * ((y - 1180) / (H - 1180)) ** 1.2))
    grad.putpixel((0, y), min(255, v))
black = Image.new('RGB', (W, H), (10, 9, 13))
img = Image.composite(black, img, grad.resize((W, H)))

draw = ImageDraw.Draw(img)

chip_font = ImageFont.truetype(F_SEMI, 30)
chip_w = draw.textlength(CFG['chip'], font=chip_font) + 64
cx0, cy0 = (W - chip_w) / 2, 148
draw.rounded_rectangle((cx0, cy0, cx0 + chip_w, cy0 + 66), radius=33, fill=GOLD_DEEP)
tw = draw.textlength(CFG['chip'], font=chip_font)
draw.text(((W - tw) / 2, cy0 + 15), CFG['chip'], font=chip_font, fill=(255, 245, 228))

f_title = ImageFont.truetype(F_BLACK, 96)
text_center(draw, W, 300, CFG['title1'], f_title, PAPER, stroke=6)
text_center(draw, W, 430, CFG['title2'], f_title, RED, stroke=6)

f_sub = ImageFont.truetype(F_SEMI, 52)
text_center(draw, W, 600, CFG['subtitle'], f_sub, (238, 230, 212), stroke=4)

f_b1 = ImageFont.truetype(F_BLACK, 58)
text_center(draw, W, 1470, CFG['hook1'], f_b1, PAPER, stroke=5)
text_center(draw, W, 1560, CFG['hook2'], f_b1, RED, stroke=5)

f_b2 = ImageFont.truetype(F_SEMI, 40)
text_center(draw, W, 1690, CFG['bottom'], f_b2, GOLD, stroke=3)

img.save(f'{BASE}/assets/cover_portrait.png', quality=95)
print('竖屏封面已保存:', f'{BASE}/assets/cover_portrait.png')

# ================= 横屏 1920x1080 =================
W, H = 1920, 1080
img = load_cover(f'{BASE}/assets/images/cover_base_land.png', W, H)
img = Image.blend(img, Image.new('RGB', (W, H), (14, 12, 10)), 0.20)

grad = Image.new('L', (1, H), 0)
for y in range(H):
    v = 0
    if y < 360:
        v = int(225 * (1 - y / 360) ** 1.3)
    if y > 720:
        v = max(v, int(238 * ((y - 720) / (H - 720)) ** 1.2))
    grad.putpixel((0, y), min(255, v))
black = Image.new('RGB', (W, H), (10, 9, 13))
img = Image.composite(black, img, grad.resize((W, H)))

draw = ImageDraw.Draw(img)

chip_font = ImageFont.truetype(F_SEMI, 30)
chip_w = draw.textlength(CFG['chip'], font=chip_font) + 60
cx0, cy0 = (W - chip_w) / 2, 90
draw.rounded_rectangle((cx0, cy0, cx0 + chip_w, cy0 + 62), radius=31, fill=GOLD_DEEP)
tw = draw.textlength(CFG['chip'], font=chip_font)
draw.text(((W - tw) / 2, cy0 + 13), CFG['chip'], font=chip_font, fill=(255, 245, 228))

f_title = ImageFont.truetype(F_BLACK, 90)
two_color(draw, W, 280, CFG['title1'] + '，', CFG['title2'], f_title, PAPER, RED)

f_sub = ImageFont.truetype(F_SEMI, 44)
text_center(draw, W, 424, CFG['subtitle'], f_sub, (238, 230, 212), stroke=4)

f_b1 = ImageFont.truetype(F_BLACK, 46)
text_center(draw, W, 596, CFG['hook1'] + '，' + CFG['hook2'], f_b1, PAPER, stroke=4)

f_b2 = ImageFont.truetype(F_SEMI, 36)
text_center(draw, W, 690, CFG['bottom'], f_b2, GOLD, stroke=3)

img.save(f'{BASE}/assets/cover_landscape.png', quality=95)
print('横屏封面已保存:', f'{BASE}/assets/cover_landscape.png')
