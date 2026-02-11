#!/usr/bin/env python3
"""
Download CompanyCam photo → Enhance → Upload to Supabase Storage → Return public URL

Usage:
  uv run --with "Pillow requests" enhance-and-upload.py <photo_url> [--level medium] [--post-id <uuid>]

Returns the public URL of the enhanced image, ready for social media posting.
"""

import sys
import os
import argparse
import hashlib
import tempfile
import json
from urllib.request import urlopen, Request
from urllib.parse import quote
from PIL import Image, ImageEnhance, ImageOps

SUPABASE_URL = "process.env.NEXT_PUBLIC_SUPABASE_URL"
SUPABASE_KEY = os.environ["SUPABASE_SERVICE_ROLE_KEY"]
BUCKET = "enhanced-photos"


def enhance(input_path, output_path, level="medium"):
    levels = {
        "light":  {"brightness": 1.03, "contrast": 1.05, "color": 1.02, "sharpness": 1.05, "cutoff": 0.3},
        "medium": {"brightness": 1.05, "contrast": 1.08, "color": 1.05, "sharpness": 1.10, "cutoff": 0.5},
        "strong": {"brightness": 1.08, "contrast": 1.12, "color": 1.10, "sharpness": 1.15, "cutoff": 1.0},
    }
    s = levels.get(level, levels["medium"])
    
    img = Image.open(input_path)
    exif = img.info.get("exif", None)
    if img.mode != "RGB":
        img = img.convert("RGB")
    
    img = ImageOps.autocontrast(img, cutoff=s["cutoff"])
    img = ImageEnhance.Brightness(img).enhance(s["brightness"])
    img = ImageEnhance.Contrast(img).enhance(s["contrast"])
    img = ImageEnhance.Color(img).enhance(s["color"])
    img = ImageEnhance.Sharpness(img).enhance(s["sharpness"])
    
    save_kwargs = {"quality": 92, "optimize": True}
    if exif:
        save_kwargs["exif"] = exif
    img.save(output_path, **save_kwargs)
    return output_path


def upload_to_supabase(file_path, filename):
    """Upload to Supabase Storage and return public URL."""
    with open(file_path, "rb") as f:
        data = f.read()
    
    path = f"{BUCKET}/{filename}"
    url = f"{SUPABASE_URL}/storage/v1/object/{path}"
    
    req = Request(url, data=data, method="POST")
    req.add_header("Authorization", f"Bearer {SUPABASE_KEY}")
    req.add_header("apikey", SUPABASE_KEY)
    req.add_header("Content-Type", "image/jpeg")
    req.add_header("x-upsert", "true")
    
    try:
        resp = urlopen(req)
        public_url = f"{SUPABASE_URL}/storage/v1/object/public/{path}"
        return public_url
    except Exception as e:
        print(f"Upload failed: {e}", file=sys.stderr)
        # Try reading the error body
        if hasattr(e, 'read'):
            print(f"Response: {e.read().decode()}", file=sys.stderr)
        return None


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("photo_url", help="CompanyCam photo URL")
    parser.add_argument("--level", default="medium", choices=["light", "medium", "strong"])
    parser.add_argument("--post-id", help="Content Command post ID to attach to")
    args = parser.parse_args()
    
    # Download
    url_hash = hashlib.md5(args.photo_url.encode()).hexdigest()[:12]
    tmp_in = os.path.join(tempfile.gettempdir(), f"cc-{url_hash}-orig.jpg")
    tmp_out = os.path.join(tempfile.gettempdir(), f"cc-{url_hash}-enhanced.jpg")
    
    print(f"Downloading: {args.photo_url[:80]}...")
    req = Request(args.photo_url)
    with urlopen(req) as resp:
        with open(tmp_in, "wb") as f:
            f.write(resp.read())
    
    # Enhance
    print(f"Enhancing (level={args.level})...")
    enhance(tmp_in, tmp_out, args.level)
    
    # Upload
    filename = f"{url_hash}-{args.level}.jpg"
    print(f"Uploading to Supabase Storage...")
    public_url = upload_to_supabase(tmp_out, filename)
    
    if public_url:
        print(f"\nENHANCED_URL: {public_url}")
        
        # If post-id given, update the post's photo_urls
        if args.post_id:
            print(f"Attaching to post {args.post_id}...")
            # Fetch current photo_urls
            fetch_url = f"{SUPABASE_URL}/rest/v1/cc_posts?id=eq.{args.post_id}&select=photo_urls"
            req = Request(fetch_url)
            req.add_header("apikey", SUPABASE_KEY)
            req.add_header("Authorization", f"Bearer {SUPABASE_KEY}")
            with urlopen(req) as resp:
                posts = json.loads(resp.read())
            
            if posts:
                current_urls = posts[0].get("photo_urls", []) or []
                current_urls.append(public_url)
                
                # Update
                patch_url = f"{SUPABASE_URL}/rest/v1/cc_posts?id=eq.{args.post_id}"
                patch_data = json.dumps({"photo_urls": current_urls}).encode()
                req = Request(patch_url, data=patch_data, method="PATCH")
                req.add_header("apikey", SUPABASE_KEY)
                req.add_header("Authorization", f"Bearer {SUPABASE_KEY}")
                req.add_header("Content-Type", "application/json")
                urlopen(req)
                print(f"Attached to post. Total photos: {len(current_urls)}")
    else:
        print("FAILED", file=sys.stderr)
        sys.exit(1)
    
    # Cleanup
    os.remove(tmp_in)
    os.remove(tmp_out)


if __name__ == "__main__":
    main()
