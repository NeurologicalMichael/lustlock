from pathlib import Path
from math import cos, pi, sin
from PIL import Image, ImageDraw, ImageFont

W, H = 640, 920
OUT_DIR = Path(__file__).resolve().parents[1] / "review-screenshots"

FONT_DIR = Path("/System/Library/Fonts/Supplemental")
ARIAL = FONT_DIR / "Arial.ttf"
ARIAL_BOLD = FONT_DIR / "Arial Bold.ttf"
GEORGIA = FONT_DIR / "Georgia.ttf"
GEORGIA_BOLD = FONT_DIR / "Georgia Bold.ttf"


def font(path: Path, size: int) -> ImageFont.FreeTypeFont:
    return ImageFont.truetype(str(path), size)


def draw_vertical_gradient(img: Image.Image) -> None:
    px = img.load()
    stops = [
        (0.00, (70, 25, 9)),
        (0.30, (145, 58, 14)),
        (0.64, (246, 127, 36)),
        (1.00, (116, 42, 7)),
    ]
    for y in range(H):
        t = y / (H - 1)
        for i in range(len(stops) - 1):
            p0, c0 = stops[i]
            p1, c1 = stops[i + 1]
            if p0 <= t <= p1:
                u = (t - p0) / (p1 - p0)
                c = tuple(int(c0[j] + (c1[j] - c0[j]) * u) for j in range(3))
                break
        for x in range(W):
            vignette = ((x - W / 2) ** 2 / (W / 1.05) ** 2) + ((y - H / 2) ** 2 / (H / 1.05) ** 2)
            darken = max(0, min(60, int(vignette * 46)))
            px[x, y] = tuple(max(0, v - darken) for v in c)


def text_size(draw: ImageDraw.ImageDraw, text: str, fnt: ImageFont.FreeTypeFont) -> tuple[int, int]:
    box = draw.textbbox((0, 0), text, font=fnt)
    return box[2] - box[0], box[3] - box[1]


def center_text(draw: ImageDraw.ImageDraw, y: int, text: str, fnt: ImageFont.FreeTypeFont, fill, spacing: int = 0) -> None:
    tw, _ = text_size(draw, text, fnt)
    draw.text(((W - tw) / 2, y), text, font=fnt, fill=fill, spacing=spacing)


def wrap_text(draw: ImageDraw.ImageDraw, text: str, fnt: ImageFont.FreeTypeFont, max_width: int) -> list[str]:
    words = text.split()
    lines: list[str] = []
    line = ""
    for word in words:
        test = f"{line} {word}".strip()
        if text_size(draw, test, fnt)[0] <= max_width:
            line = test
        else:
            if line:
                lines.append(line)
            line = word
    if line:
        lines.append(line)
    return lines


def draw_shield(draw: ImageDraw.ImageDraw, cx: int, cy: int) -> None:
    # Orange square app icon.
    draw.rounded_rectangle((cx - 64, cy - 64, cx + 64, cy + 64), radius=0, fill=(246, 111, 25))
    # Subtle texture.
    for i in range(0, 128, 8):
        alpha = int(24 * (1 - i / 128))
        draw.line((cx - 64 + i, cy - 64, cx - 64, cy + 64), fill=(255, 168, 60, alpha), width=2)
    # Shield body.
    shield = [
        (cx, cy - 40),
        (cx + 42, cy - 22),
        (cx + 36, cy + 24),
        (cx, cy + 54),
        (cx - 36, cy + 24),
        (cx - 42, cy - 22),
    ]
    draw.polygon(shield, fill=(4, 25, 37))
    # Cross.
    draw.rounded_rectangle((cx - 4, cy - 26, cx + 4, cy + 30), radius=3, fill=(255, 255, 255))
    draw.rounded_rectangle((cx - 26, cy - 4, cx + 26, cy + 4), radius=3, fill=(255, 255, 255))


def star_points(cx: int, cy: int, outer: int, inner: int) -> list[tuple[float, float]]:
    pts = []
    for i in range(10):
        r = outer if i % 2 == 0 else inner
        a = -pi / 2 + i * pi / 5
        pts.append((cx + cos(a) * r, cy + sin(a) * r))
    return pts


def draw_testimonial(draw: ImageDraw.ImageDraw) -> None:
    x, y, w, h = 48, 315, 544, 162
    draw.rounded_rectangle((x, y, x + w, y + h), radius=30, fill=(59, 26, 17))
    draw.text((x + 28, y + 20), "Built for real accountability", font=font(ARIAL_BOLD, 20), fill=(255, 255, 255))
    for i in range(5):
        draw.polygon(star_points(x + 36 + i * 19, y + 64, 8, 4), fill=(255, 196, 18))
    quote = "The plan is simple, private, and easy to follow every day."
    yy = y + 82
    for line in wrap_text(draw, quote, font(ARIAL_BOLD, 17), w - 56):
        draw.text((x + 28, yy), line, font=font(ARIAL_BOLD, 17), fill=(255, 255, 255))
        yy += 22
    draw.text((x + 28, y + 130), "John D.", font=font(GEORGIA, 15), fill=(220, 210, 202))


def draw_plan_card(draw: ImageDraw.ImageDraw, x: int, y: int, w: int, h: int, label_top: str, label_bottom: str, price: str, selected: bool) -> None:
    fill = (74, 32, 19) if not selected else (91, 38, 23)
    outline = (250, 151, 78) if selected else (120, 76, 58)
    draw.rounded_rectangle((x, y, x + w, y + h), radius=17, fill=fill, outline=outline, width=4 if selected else 2)
    if selected:
        draw.ellipse((x + w - 40, y + 10, x + w - 10, y + 40), fill=(82, 47, 38), outline=(255, 255, 255), width=3)
        draw.line((x + w - 32, y + 26, x + w - 25, y + 32, x + w - 17, y + 20), fill=(255, 255, 255), width=3)
    tw, _ = text_size(draw, label_top, font(ARIAL_BOLD, 34))
    draw.text((x + (w - tw) / 2, y + 23), label_top, font=font(ARIAL_BOLD, 34), fill=(255, 255, 255))
    tw, _ = text_size(draw, label_bottom, font(ARIAL_BOLD, 18))
    draw.text((x + (w - tw) / 2, y + 72), label_bottom, font=font(ARIAL_BOLD, 18), fill=(255, 255, 255))
    tw, _ = text_size(draw, price, font(ARIAL_BOLD, 17))
    draw.text((x + (w - tw) / 2, y + 103), price, font=font(ARIAL_BOLD, 17), fill=(255, 255, 255))


def make(plan_key: str, selected_idx: int, cta: str) -> Path:
    img = Image.new("RGB", (W, H), (0, 0, 0))
    draw_vertical_gradient(img)
    draw = ImageDraw.Draw(img, "RGBA")

    draw_shield(draw, W // 2, 100)
    center_text(draw, 166, "Get LustLock", font(ARIAL_BOLD, 40), (255, 255, 255))
    subtitle = "Stay strong in faith, build daily discipline, and keep your guard up."
    yy = 220
    for line in wrap_text(draw, subtitle, font(ARIAL, 21), 500):
        center_text(draw, yy, line, font(ARIAL, 21), (255, 255, 255))
        yy += 28

    draw_testimonial(draw)
    center_text(draw, 535, "•  •  •", font(ARIAL_BOLD, 24), (255, 232, 214))

    plans = [
        ("1", "Week", "$24.99"),
        ("3", "Months", "$69.99"),
        ("1", "Year", "$119.99"),
    ]
    xs = [36, 222, 408]
    for i, p in enumerate(plans):
        draw_plan_card(draw, xs[i], 640, 172, 124, p[0], p[1], p[2], selected_idx == i)

    draw.rounded_rectangle((36, 792, W - 36, 848), radius=20, fill=(248, 122, 35))
    center_text(draw, 808, cta, font(ARIAL_BOLD, 22), (255, 255, 255))
    draw.rounded_rectangle((208, 886, 432, 892), radius=3, fill=(0, 0, 0))

    out = OUT_DIR / f"{plan_key}_review_640x920.png"
    img.save(out, "PNG")
    print(out)
    return out


def make_app_store_sizes(source: Path) -> None:
    img = Image.open(source).convert("RGB")
    stem = source.stem.replace("_640x920", "")
    sizes = [
        ("iphone_6_9_1290x2796", (1290, 2796)),
        ("iphone_6_5_1242x2688", (1242, 2688)),
        ("iphone_5_5_1242x2208", (1242, 2208)),
    ]
    for suffix, size in sizes:
        resized = img.resize(size, Image.Resampling.LANCZOS)
        out = OUT_DIR / f"{stem}_{suffix}.png"
        resized.save(out, "PNG")
        print(out)


def main() -> None:
    OUT_DIR.mkdir(parents=True, exist_ok=True)
    for source in [
        make("weekly_pro_24_99", 0, "Start Weekly Plan"),
        make("quarterly_pro_69_99", 1, "Start Quarterly Plan"),
        make("yearly_pro_119_99", 2, "Start Yearly Plan"),
    ]:
        make_app_store_sizes(source)


if __name__ == "__main__":
    main()
