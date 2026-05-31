import fitz
import sys
from pathlib import Path

PLACEHOLDER = "$(ttd_bupati)"
TTD_WIDTH = 296
TTD_HEIGHT = 148
OFFSET_Y = 52


def stamp_pdf(input_path: str, output_path: str, ttd_image: str):
    doc = fitz.open(input_path)
    img_path = Path(ttd_image)

    if not img_path.exists():
        raise FileNotFoundError(f"TTD image not found: {ttd_image}")

    for page in doc:
        for rect in page.search_for(PLACEHOLDER):
            page.draw_rect(rect, color=(1, 1, 1), fill=(1, 1, 1))
            cx = (rect.x0 + rect.x1) / 2
            ttd_rect = fitz.Rect(
                cx - TTD_WIDTH / 2,
                rect.y0 - OFFSET_Y,
                cx + TTD_WIDTH / 2,
                rect.y0 + TTD_HEIGHT - OFFSET_Y,
            )
            page.insert_image(ttd_rect, filename=str(img_path))

    doc.save(output_path, garbage=4, deflate=True, deflate_images=True, deflate_fonts=True)


if __name__ == "__main__":
    if len(sys.argv) < 4:
        print("Usage: stamp_ttd.py <input.pdf> <output.pdf> <ttd.png>")
        sys.exit(1)
    stamp_pdf(sys.argv[1], sys.argv[2], sys.argv[3])
