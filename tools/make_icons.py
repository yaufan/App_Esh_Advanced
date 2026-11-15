#!/usr/bin/env python3
"""Draw the 甲級 app icons: a yellow shield with 甲 on deep green (run from the repo root)."""
from PIL import Image, ImageDraw, ImageFont

BG = (15, 61, 51)
SHIELD = (242, 183, 5)
FONT = '/usr/share/fonts/opentype/noto/NotoSansCJK-Black.ttc'


def bez(p0, p1, p2, p3, n=40):
    out = []
    for i in range(n + 1):
        t = i / n
        x = (1-t)**3*p0[0] + 3*(1-t)**2*t*p1[0] + 3*(1-t)*t**2*p2[0] + t**3*p3[0]
        y = (1-t)**3*p0[1] + 3*(1-t)**2*t*p1[1] + 3*(1-t)*t**2*p2[1] + t**3*p3[1]
        out.append((x, y))
    return out


def shield(cx, cy, w):
    """Shield polygon centered at (cx, cy) with width w (height ~1.33 w)."""
    h = w * 1.33
    top = (cx, cy - h / 2)
    lt = (cx - w / 2, cy - h / 2 + h * 0.14)
    rt = (cx + w / 2, cy - h / 2 + h * 0.14)
    bot = (cx, cy + h / 2)
    right = bez(rt, (cx + w / 2, cy + h * 0.15), (cx + w * 0.3, cy + h * 0.36), bot)
    left = bez(bot, (cx - w * 0.3, cy + h * 0.36), (cx - w / 2, cy + h * 0.15), lt)
    return [top] + right + left[1:]


def draw(size, bg, shield_w, mono=False, stripes=False):
    S = size * 4
    im = Image.new('RGBA', (S, S), bg + (255,) if bg else (0, 0, 0, 0))
    d = ImageDraw.Draw(im)
    if stripes:
        band = int(S * 0.12)
        d.rectangle([0, S - band, S, S], fill=(10, 30, 26, 255))
        step = int(S * 0.066)
        for x in range(-band, S + band, step * 2):
            d.polygon([(x, S), (x + step, S), (x + step + band, S - band), (x + band, S - band)], fill=SHIELD + (255,))
    cx, cy = S / 2, S / 2 - (S * 0.03 if stripes else 0)
    sw = S * shield_w
    d.polygon(shield(cx, cy, sw), fill=(0, 0, 0, 255) if mono else SHIELD + (255,))
    font = ImageFont.truetype(FONT, int(sw * 0.62), index=0)
    glyph = '甲'
    bbox = d.textbbox((0, 0), glyph, font=font)
    gw, gh = bbox[2] - bbox[0], bbox[3] - bbox[1]
    gx, gy = cx - gw / 2 - bbox[0], cy - gh / 2 - bbox[1] - sw * 0.04
    if mono:
        mask = Image.new('L', (S, S), 0)
        ImageDraw.Draw(mask).text((gx, gy), glyph, font=font, fill=255)
        im.putalpha(Image.eval(Image.composite(Image.new('L', (S, S), 0), im.getchannel('A'), mask), lambda v: v))
    else:
        d.text((gx, gy), glyph, font=font, fill=(BG if not bg or bg == BG else bg) + (255,))
    return im.resize((size, size), Image.LANCZOS)


if __name__ == '__main__':
    out = 'assets/images/'
    draw(1024, BG, 0.46, stripes=True).convert('RGB').save(out + 'icon.png')
    draw(512, None, 0.3).save(out + 'android-icon-foreground.png')
    Image.new('RGB', (512, 512), BG).save(out + 'android-icon-background.png')
    draw(432, None, 0.3, mono=True).save(out + 'android-icon-monochrome.png')
    draw(480, None, 0.62).save(out + 'splash-icon.png')
    draw(48, BG, 0.62).save(out + 'favicon.png')
    print('icons written')
