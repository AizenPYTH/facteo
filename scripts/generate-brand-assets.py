"""Generate INVEQ brand assets from the master app icon."""
from __future__ import annotations

from pathlib import Path

from PIL import Image, ImageChops, ImageEnhance, ImageFilter

ROOT = Path(__file__).resolve().parents[1]
SOURCE = ROOT / "assets" / "images" / "inveq-app-icon-source.png"
OUT = ROOT / "assets" / "images"

BRAND_BLUE = (2, 116, 223, 255)  # #0274DF


def save_resized(image: Image.Image, path: Path, size: tuple[int, int]) -> None:
    resized = image.resize(size, Image.Resampling.LANCZOS)
    resized.save(path, optimize=True)


def solid_background(size: int, color: tuple[int, int, int]) -> Image.Image:
    return Image.new("RGBA", (size, size), (*color, 255))


def build_monochrome(source: Image.Image) -> Image.Image:
    gray = source.convert("L")
    alpha = source.split()[-1]
    mono = Image.new("RGBA", source.size, (255, 255, 255, 0))
    white = Image.new("L", source.size, 255)
    mono.putalpha(ImageChops.multiply(gray, alpha))
    mono.paste(white, mask=mono.split()[-1])
    return mono


def build_glow(source: Image.Image, size: int = 512) -> Image.Image:
    glow_base = source.resize((size, size), Image.Resampling.LANCZOS).convert("RGBA")
    alpha = glow_base.split()[-1]
    blue = Image.new("RGBA", (size, size), (60, 156, 255, 0))
    blue.putalpha(alpha)
    blurred = blue.filter(ImageFilter.GaussianBlur(radius=28))
    return ImageEnhance.Brightness(blurred).enhance(1.15)


def main() -> None:
    if not SOURCE.exists():
        raise SystemExit(f"Source logo not found: {SOURCE}")

    OUT.mkdir(parents=True, exist_ok=True)
    master = Image.open(SOURCE).convert("RGBA")

    master.save(OUT / "icon.png", optimize=True)
    master.save(OUT / "inveq-logo.png", optimize=True)

    save_resized(master, OUT / "splash-icon.png", (288, 288))
    save_resized(master, OUT / "expo-logo.png", (256, 256))
    save_resized(master, OUT / "favicon.png", (48, 48))

    master.save(OUT / "android-icon-foreground.png", optimize=True)
    solid_background(1024, BRAND_BLUE[:3]).save(OUT / "android-icon-background.png", optimize=True)

    mono = build_monochrome(master)
    mono.save(OUT / "android-icon-monochrome.png", optimize=True)

    glow = build_glow(master)
    glow.save(OUT / "logo-glow.png", optimize=True)

    print("Generated brand assets in", OUT)


if __name__ == "__main__":
    main()
