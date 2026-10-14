"""Measure WCAG contrast of footer text against the rendered background.

Usage: contrast.py <background.bmp> <boxes.json> <scale>
boxes.json: [{"name", "x", "y", "w", "h", "color": [r, g, b, a]}] in CSS pixels.
"""
import json
import struct
import sys


def load_bmp(path):
    data = open(path, "rb").read()
    offset = struct.unpack_from("<I", data, 10)[0]
    width, height = struct.unpack_from("<ii", data, 18)
    bpp = struct.unpack_from("<H", data, 28)[0] // 8
    row = ((width * bpp + 3) // 4) * 4
    top_down = height < 0
    height = abs(height)

    def pixel(x, y):
        yy = y if top_down else height - 1 - y
        i = offset + yy * row + x * bpp
        return data[i + 2], data[i + 1], data[i]

    return width, height, pixel


def luminance(rgb):
    def channel(c):
        c /= 255
        return c / 12.92 if c <= 0.04045 else ((c + 0.055) / 1.055) ** 2.4

    r, g, b = (channel(c) for c in rgb)
    return 0.2126 * r + 0.7152 * g + 0.0722 * b


def ratio(a, b):
    hi, lo = max(a, b), min(a, b)
    return (hi + 0.05) / (lo + 0.05)


def main():
    width, height, pixel = load_bmp(sys.argv[1])
    boxes = json.load(open(sys.argv[2]))
    scale = float(sys.argv[3])
    for box in boxes:
        x0, y0 = int(box["x"] * scale), int(box["y"] * scale)
        x1, y1 = int((box["x"] + box["w"]) * scale), int((box["y"] + box["h"]) * scale)
        samples = [pixel(x, y) for y in range(max(y0, 0), min(y1, height), 2) for x in range(max(x0, 0), min(x1, width), 2)]
        if not samples:
            continue
        lums = sorted(luminance(p) for p in samples)
        mean_rgb = [sum(p[i] for p in samples) / len(samples) for i in range(3)]
        r, g, b, a = box["color"]
        text = [r * a + mean_rgb[i] * (1 - a) for i, r in enumerate((r, g, b))]
        text_l = luminance(text)
        mean_l = luminance(mean_rgb)
        # Worst case: the 10% of background pixels closest in luminance to the text.
        worst_l =lums[int(len(lums) * 0.1)] if text_l < mean_l else lums[int(len(lums) * 0.9)]
        print(f"{box['name']:<14} mean {ratio(text_l, mean_l):5.2f}   worst-10% {ratio(text_l, worst_l):5.2f}")


main()
