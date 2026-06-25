from pathlib import Path

from PIL import Image


ROOT = Path(__file__).resolve().parent.parent
SOURCE = ROOT / "assets" / "brand-logo-strip.png"
OUTPUT = ROOT / "assets" / "brand-logo-strip-white.png"
LOGO_DIR = ROOT / "assets" / "brand-logos"

source = Image.open(SOURCE).convert("RGB")
canvas = Image.new("RGBA", (1800, 150), (0, 0, 0, 0))
LOGO_DIR.mkdir(parents=True, exist_ok=True)

logos = [
    # name, crop, slot center, max width, max height, extraction mode
    ("Temu", (105, 125, 330, 265), 115, 145, 72, "light"),
    ("Anker", (390, 55, 830, 200), 390, 235, 70, "dark"),
    ("Dreame", (430, 220, 825, 305), 650, 210, 48, "dark"),
    ("AliExpress", (855, 205, 1335, 325), 910, 250, 56, "color"),
    ("Lovart", (1360, 10, 1590, 310), 1190, 145, 100, "dark"),
    ("Aiper", (925, 60, 1265, 175), 1460, 190, 52, "dark"),
    ("KSP", (1820, 225, 2195, 350), 1700, 210, 62, "color"),
]


def alpha_for(pixel, mode):
    red, green, blue = pixel
    high = max(pixel)
    low = min(pixel)
    saturation = 0 if high == 0 else (high - low) / high
    luminance = 0.2126 * red + 0.7152 * green + 0.0722 * blue

    if mode == "light":
        score = max(0, low - 205) * 5
    elif mode == "dark":
        score = max(0, 205 - luminance) * 2.4
    else:
        score = max(max(0, 205 - luminance) * 1.8, max(0, saturation - 0.13) * 620)

    return max(0, min(255, round(score)))


for name, crop_box, center_x, max_width, max_height, mode in logos:
    crop = source.crop(crop_box)
    alpha = Image.new("L", crop.size)
    alpha.putdata([alpha_for(pixel, mode) for pixel in crop.get_flattened_data()])
    bounds = alpha.getbbox()
    if not bounds:
        raise RuntimeError(f"No logo pixels detected for crop {crop_box}")

    alpha = alpha.crop(bounds)
    logo = Image.new("RGBA", alpha.size, (255, 255, 255, 0))
    logo.putalpha(alpha)
    scale = min(max_width / logo.width, max_height / logo.height)
    logo = logo.resize(
        (max(1, round(logo.width * scale)), max(1, round(logo.height * scale))),
        Image.Resampling.LANCZOS,
    )
    logo.save(LOGO_DIR / f"{name.lower()}.png")
    canvas.alpha_composite(logo, (round(center_x - logo.width / 2), round((150 - logo.height) / 2)))

canvas.save(OUTPUT)
print(f"Saved seven logos under {LOGO_DIR}")
