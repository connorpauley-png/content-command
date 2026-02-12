#!/usr/bin/env python3
"""
AI Image Enhancement for Social Media - College Bros Outdoor Services
Subtle, professional enhancement. NOT Instagram filters.

Usage:
  uv run --with Pillow enhance-photo.py input.jpg output.jpg [--level light|medium|strong]
"""

import sys
import argparse
from PIL import Image, ImageEnhance, ImageFilter, ImageOps

def enhance(input_path, output_path, level="medium"):
    """
    Professional photo enhancement with 3 intensity levels.
    - light:  Barely noticeable. Fixes exposure only.
    - medium: Slight pop. Good for social media.
    - strong: More vivid. Use sparingly.
    """
    
    levels = {
        "light": {
            "brightness": 1.03,
            "contrast": 1.05,
            "color": 1.02,
            "sharpness": 1.05,
            "autocontrast_cutoff": 0.3,
        },
        "medium": {
            "brightness": 1.05,
            "contrast": 1.08,
            "color": 1.05,
            "sharpness": 1.10,
            "autocontrast_cutoff": 0.5,
        },
        "strong": {
            "brightness": 1.08,
            "contrast": 1.12,
            "color": 1.10,
            "sharpness": 1.15,
            "autocontrast_cutoff": 1.0,
        },
    }
    
    settings = levels.get(level, levels["medium"])
    
    img = Image.open(input_path)
    
    # Preserve EXIF if available
    exif = img.info.get("exif", None)
    
    # Convert to RGB if needed
    if img.mode != "RGB":
        img = img.convert("RGB")
    
    # Step 1: Auto contrast (normalize histogram, subtle)
    img = ImageOps.autocontrast(img, cutoff=settings["autocontrast_cutoff"])
    
    # Step 2: Brightness
    img = ImageEnhance.Brightness(img).enhance(settings["brightness"])
    
    # Step 3: Contrast
    img = ImageEnhance.Contrast(img).enhance(settings["contrast"])
    
    # Step 4: Color saturation
    img = ImageEnhance.Color(img).enhance(settings["color"])
    
    # Step 5: Sharpness
    img = ImageEnhance.Sharpness(img).enhance(settings["sharpness"])
    
    # Save with high quality
    save_kwargs = {"quality": 92, "optimize": True}
    if exif:
        save_kwargs["exif"] = exif
    
    if output_path.lower().endswith(".png"):
        save_kwargs = {}
        if exif:
            save_kwargs["exif"] = exif
    
    img.save(output_path, **save_kwargs)
    
    # Report
    orig_size = Image.open(input_path).size
    print(f"Enhanced: {input_path}")
    print(f"  Level: {level}")
    print(f"  Size: {orig_size[0]}x{orig_size[1]}")
    print(f"  Output: {output_path}")
    print(f"MEDIA: {output_path}")


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Enhance job site photos for social media")
    parser.add_argument("input", help="Input image path")
    parser.add_argument("output", help="Output image path")
    parser.add_argument("--level", choices=["light", "medium", "strong"], default="medium",
                        help="Enhancement intensity (default: medium)")
    args = parser.parse_args()
    enhance(args.input, args.output, args.level)
