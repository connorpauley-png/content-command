#!/usr/bin/env python3
"""
Import pre-tagged Before and After photos from CompanyCam.
These are photos Connor already tagged as before/after pairs.
"""

import requests
import json
from datetime import datetime
from collections import defaultdict

TOKEN = os.environ.get("COMPANYCAM_TOKEN", "")
API = "https://api.companycam.com/v2"
SUPABASE_URL = os.environ.get("SUPABASE_URL", "")
SUPABASE_KEY = os.environ.get("SUPABASE_SERVICE_ROLE_KEY", "")

# Tag IDs
BEFORE_AND_AFTER_TAG = "16664744"
BEFORE_TAG = "17029741"

def log(msg):
    print(f"[{datetime.now().strftime('%H:%M:%S')}] {msg}", flush=True)

def get_photos_by_tag(tag_id, limit=100):
    """Get all photos with a specific tag"""
    resp = requests.get(
        f"{API}/photos?per_page={limit}&tag_ids[]={tag_id}",
        headers={"Authorization": f"Bearer {TOKEN}"}
    )
    return resp.json() if resp.ok else []

def get_project_name(project_id):
    """Get project name by ID"""
    resp = requests.get(
        f"{API}/projects/{project_id}",
        headers={"Authorization": f"Bearer {TOKEN}"}
    )
    if resp.ok:
        return resp.json().get("name", "Unknown")
    return "Unknown"

def get_photo_url(photo):
    """Extract original photo URL"""
    for uri in photo.get("uris", []):
        if uri.get("type") == "original":
            return uri.get("uri")
    return None

def create_post(content, photo_urls, project_name, tags):
    """Create a post in Supabase"""
    data = {
        "content": content,
        "platforms": ["instagram", "facebook", "nextdoor"],
        "status": "idea",
        "photo_urls": photo_urls,
        "photo_source": "companycam",
        "ai_generated": False,
        "posted_ids": {},
        "tags": tags,
        "notes": f"Pre-tagged by crew. Project: {project_name}"
    }
    resp = requests.post(
        f"{SUPABASE_URL}/rest/v1/cc_posts",
        headers={
            "apikey": SUPABASE_KEY,
            "Authorization": f"Bearer {SUPABASE_KEY}",
            "Content-Type": "application/json",
            "Prefer": "return=minimal"
        },
        json=data
    )
    return resp.ok

CAPTIONS = [
    "Before and after.",
    "Same property.",
    "The transformation.",
    "Results.",
    "What a difference.",
    "This is why we do what we do."
]

def main():
    log("=" * 50)
    log("IMPORTING PRE-TAGGED BEFORE/AFTER PHOTOS")
    log("=" * 50)
    
    # Get all "Before and After" tagged photos
    photos = get_photos_by_tag(BEFORE_AND_AFTER_TAG, limit=200)
    log(f"Found {len(photos)} photos with 'Before and After' tag")
    
    # Group by project
    by_project = defaultdict(list)
    for photo in photos:
        by_project[photo["project_id"]].append(photo)
    
    log(f"Across {len(by_project)} projects")
    
    results = {
        "projects_processed": 0,
        "posts_created": 0,
        "photos_used": 0,
        "skipped": 0
    }
    
    for project_id, project_photos in by_project.items():
        project_name = get_project_name(project_id)
        
        # Sort by captured_at to maintain before/after order
        sorted_photos = sorted(project_photos, key=lambda p: p.get("captured_at", 0))
        
        # Need at least 2 photos to make a pair
        if len(sorted_photos) < 2:
            log(f"  {project_name}: Only {len(sorted_photos)} photo(s), skipping")
            results["skipped"] += 1
            continue
        
        # Create pairs: first half = before, second half = after
        # Or if even number, pair them sequentially (1-2, 3-4, etc.)
        
        if len(sorted_photos) == 2:
            # Simple pair
            pairs = [(sorted_photos[0], sorted_photos[1])]
        elif len(sorted_photos) % 2 == 0:
            # Even number - pair sequentially
            pairs = []
            for i in range(0, len(sorted_photos), 2):
                pairs.append((sorted_photos[i], sorted_photos[i+1]))
        else:
            # Odd number - first photo is before, last is after
            pairs = [(sorted_photos[0], sorted_photos[-1])]
        
        for i, (before, after) in enumerate(pairs):
            before_url = get_photo_url(before)
            after_url = get_photo_url(after)
            
            if before_url and after_url:
                caption = CAPTIONS[results["posts_created"] % len(CAPTIONS)]
                suffix = f" (set {i+1})" if len(pairs) > 1 else ""
                
                if create_post(
                    caption, 
                    [before_url, after_url], 
                    f"{project_name}{suffix}",
                    ["before-after", "pre-tagged", "crew-selected"]
                ):
                    results["posts_created"] += 1
                    results["photos_used"] += 2
                    log(f"  {project_name}{suffix}: POST CREATED")
                else:
                    log(f"  {project_name}{suffix}: Failed to create post")
            else:
                log(f"  {project_name}: Missing URLs")
        
        results["projects_processed"] += 1
    
    log("=" * 50)
    log("COMPLETE")
    log(f"  Projects: {results['projects_processed']}")
    log(f"  Posts created: {results['posts_created']}")
    log(f"  Photos used: {results['photos_used']}")
    log(f"  Skipped: {results['skipped']}")
    log("=" * 50)
    
    print(json.dumps(results, indent=2))

if __name__ == "__main__":
    main()
