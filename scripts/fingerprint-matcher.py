#!/usr/bin/env python3
"""
Fingerprint-based Before/After Matcher for Content Command

Logic:
1. Scan photos, get fingerprint + messy score (0-10) + clean score (0-10)
2. Group by fingerprint
3. Find groups with both high-messy AND high-clean photos
4. Pick best BEFORE (highest messy) and AFTER (highest clean)
5. Combine into split image, queue post

messy = BEFORE
clean = AFTER
"""

import os
import sys
import json
import requests
from io import BytesIO
from datetime import datetime

# Add parent to path for imports
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

COMPANYCAM_TOKEN = os.environ["COMPANYCAM_TOKEN"]
SUPABASE_URL = "process.env.NEXT_PUBLIC_SUPABASE_URL"
SUPABASE_KEY = os.environ["SUPABASE_SERVICE_ROLE_KEY"]

def log(msg):
    print(f"[{datetime.now().strftime('%Y-%m-%d %H:%M:%S')}] {msg}")

def get_project_photos(project_id, limit=100):
    """Get all photos from a project"""
    url = f"https://api.companycam.com/v2/projects/{project_id}/photos?per_page={limit}"
    headers = {"Authorization": f"Bearer {COMPANYCAM_TOKEN}"}
    resp = requests.get(url, headers=headers)
    if resp.status_code == 200:
        photos = resp.json()
        return [{
            "id": p["id"],
            "url": next((u["uri"] for u in p.get("uris", []) if u["type"] == "original"), None),
            "captured_at": p.get("captured_at")
        } for p in photos if p.get("uris")]
    return []

def analyze_photo_stub(photo_url):
    """
    Stub for vision analysis - returns fingerprint + scores
    In production, this calls Claude Vision API
    
    Returns: {fingerprint: str, messy: int, clean: int}
    """
    # TODO: Integrate with actual vision API
    # For now, return None to indicate analysis needed
    return None

def create_combined_image(before_url, after_url, output_path):
    """Create vertical before/after combined image"""
    try:
        from PIL import Image, ImageDraw, ImageFont
        
        before_img = Image.open(BytesIO(requests.get(before_url).content))
        after_img = Image.open(BytesIO(requests.get(after_url).content))
        
        target_size = (1080, 1080)
        
        def resize_and_crop(img, size):
            target_ratio = size[0] / size[1]
            img_ratio = img.width / img.height
            if img_ratio > target_ratio:
                new_width = int(img.height * target_ratio)
                left = (img.width - new_width) // 2
                img = img.crop((left, 0, left + new_width, img.height))
            else:
                new_height = int(img.width / target_ratio)
                top = (img.height - new_height) // 2
                img = img.crop((0, top, img.width, top + new_height))
            return img.resize(size, Image.LANCZOS)
        
        before_resized = resize_and_crop(before_img, target_size)
        after_resized = resize_and_crop(after_img, target_size)
        
        combined = Image.new('RGB', (1080, 2160))
        combined.paste(before_resized, (0, 0))
        combined.paste(after_resized, (0, 1080))
        
        draw = ImageDraw.Draw(combined)
        try:
            font = ImageFont.truetype("/System/Library/Fonts/Helvetica.ttc", 72)
        except:
            font = ImageFont.load_default()
        
        # BEFORE label with shadow
        draw.text((42, 22), "BEFORE", font=font, fill='black')
        draw.text((40, 20), "BEFORE", font=font, fill='white')
        
        # AFTER label with shadow
        draw.text((42, 1102), "AFTER", font=font, fill='black')
        draw.text((40, 1100), "AFTER", font=font, fill='white')
        
        combined.save(output_path, quality=90)
        return True
    except Exception as e:
        log(f"Error creating combined image: {e}")
        return False

def upload_to_supabase(file_path, dest_name):
    """Upload image to Supabase storage"""
    url = f"{SUPABASE_URL}/storage/v1/object/enhanced-photos/{dest_name}"
    headers = {
        "Authorization": f"Bearer {SUPABASE_KEY}",
        "Content-Type": "image/jpeg"
    }
    with open(file_path, 'rb') as f:
        resp = requests.post(url, headers=headers, data=f)
    if resp.status_code in [200, 201]:
        return f"{SUPABASE_URL}/storage/v1/object/public/enhanced-photos/{dest_name}"
    return None

def create_post(content, photo_url, project_name, notes):
    """Create post in cc_posts table"""
    url = f"{SUPABASE_URL}/rest/v1/cc_posts"
    headers = {
        "apikey": SUPABASE_KEY,
        "Authorization": f"Bearer {SUPABASE_KEY}",
        "Content-Type": "application/json",
        "Prefer": "return=minimal"
    }
    data = {
        "content": content,
        "platforms": ["instagram", "facebook", "nextdoor"],
        "status": "idea",
        "photo_urls": [photo_url],
        "photo_source": "companycam",
        "ai_generated": False,
        "tags": ["before-after", "ai-fingerprint-matched"],
        "notes": notes
    }
    resp = requests.post(url, headers=headers, json=data)
    return resp.status_code in [200, 201]

def match_photos(analyzed_photos):
    """
    Match photos by fingerprint and find messy→clean pairs
    
    analyzed_photos: [{id, url, fingerprint, messy, clean}, ...]
    Returns: [(before_photo, after_photo), ...]
    """
    from collections import defaultdict
    
    # Group by fingerprint (normalize for matching)
    groups = defaultdict(list)
    for photo in analyzed_photos:
        fp = photo.get("fingerprint", "").lower().strip()
        if fp:
            # Simple normalization - could be smarter
            groups[fp].append(photo)
    
    pairs = []
    for fingerprint, photos in groups.items():
        if len(photos) < 2:
            continue
        
        # Find highest messy and highest clean
        best_before = max(photos, key=lambda p: p.get("messy", 0))
        best_after = max(photos, key=lambda p: p.get("clean", 0))
        
        # Only pair if they're different photos and scores are meaningful
        if (best_before["id"] != best_after["id"] and 
            best_before.get("messy", 0) >= 5 and 
            best_after.get("clean", 0) >= 5):
            pairs.append((best_before, best_after))
    
    return pairs

def generate_caption(before_score, after_score):
    """Generate simple caption based on transformation"""
    captions = [
        "The transformation speaks for itself.",
        "Same property. Different day.",
        "Before and after. That's the difference we make.",
        "From messy to maintained.",
        "Clean lines, fresh start.",
    ]
    import random
    return random.choice(captions)

def main():
    log("=" * 60)
    log("Fingerprint Matcher - Content Command")
    log("=" * 60)
    
    # This script requires analyzed photos as input
    # In production, integrate with vision API or use pre-analyzed data
    
    log("This script requires photo analysis data.")
    log("Use the API endpoint or run with --analyze flag to scan photos first.")
    log("")
    log("System ready. Matching logic:")
    log("  1. fingerprint = view description")
    log("  2. messy score 0-10 = BEFORE potential")
    log("  3. clean score 0-10 = AFTER potential")
    log("  4. Same fingerprint + high messy + high clean = PAIR")
    log("=" * 60)

if __name__ == "__main__":
    main()
