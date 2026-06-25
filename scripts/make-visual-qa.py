import json
from pathlib import Path

from PIL import Image, ImageDraw


ROOT = Path(__file__).resolve().parent.parent
CANONICAL = ROOT / "design-options" / "neon-culture-bridge.png"
IMPLEMENTATION = ROOT / "qa" / "screenshots" / "desktop-1440x1024.png"
RESULTS = ROOT / "qa" / "browser-results.json"
SECTIONS = ROOT / "design-options" / "sections"
COMPARISONS = ROOT / "qa" / "comparisons"
SECTION_COMPARISONS = COMPARISONS / "sections"

for directory in (SECTIONS, COMPARISONS, SECTION_COMPARISONS):
    directory.mkdir(parents=True, exist_ok=True)

canonical = Image.open(CANONICAL).convert("RGB")
implementation = Image.open(IMPLEMENTATION).convert("RGB")
browser_results = json.loads(RESULTS.read_text())
implementation_sections = browser_results["viewports"]["desktop-1440x1024"]["sections"]

# Measured boundaries from the approved 864 × 1821 Canonical board.
canonical_sections = {
    "01-hero-and-logos": (0, 508),
    "02-bridge": (508, 786),
    "03-services": (786, 1135),
    "04-talent": (1135, 1370),
    "05-about": (1370, 1588),
    "06-contact-and-footer": (1588, 1821),
}

implementation_groups = {
    "01-hero-and-logos": ("hero", "logos"),
    "02-bridge": ("bridge",),
    "03-services": ("services",),
    "04-talent": ("talent",),
    "05-about": ("about",),
    "06-contact-and-footer": ("contact", "footer"),
}


def implementation_crop(keys):
    start = min(implementation_sections[key]["top"] for key in keys)
    end = max(
        implementation_sections[key]["top"] + implementation_sections[key]["height"]
        for key in keys
    )
    return implementation.crop((0, start, implementation.width, end))


def resize_to_width(image, width):
    scale = width / image.width
    return image.resize((width, round(image.height * scale)), Image.Resampling.LANCZOS)


def comparison_board(left, right, output, title):
    panel_width = 720
    header_height = 58
    left = resize_to_width(left, panel_width)
    right = resize_to_width(right, panel_width)
    canvas = Image.new(
        "RGB",
        (panel_width * 2, header_height + max(left.height, right.height)),
        (5, 5, 5),
    )
    draw = ImageDraw.Draw(canvas)
    draw.text((20, 20), f"CANONICAL — {title}", fill=(255, 255, 255))
    draw.text((panel_width + 20, 20), f"IMPLEMENTATION — {title}", fill=(255, 255, 255))
    canvas.paste(left, (0, header_height))
    canvas.paste(right, (panel_width, header_height))
    canvas.save(output)


for name, (top, bottom) in canonical_sections.items():
    source_crop = canonical.crop((0, top, canonical.width, bottom))
    source_crop.save(SECTIONS / f"{name}.png")
    implementation_part = implementation_crop(implementation_groups[name])
    comparison_board(
        source_crop,
        implementation_part,
        SECTION_COMPARISONS / f"{name}.png",
        name.replace("-", " ").upper(),
    )

# Overall comparison also uses equal width without distorting either page.
comparison_board(
    canonical,
    implementation,
    COMPARISONS / "canonical-vs-implementation.png",
    "FULL PAGE / EQUAL WIDTH",
)
