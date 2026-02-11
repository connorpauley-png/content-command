#!/usr/bin/env python3
"""
Full CompanyCam Database Scan
Analyzes ALL projects, finds ALL transformation opportunities
"""

import requests
import json
from datetime import datetime

TOKEN = os.environ["COMPANYCAM_TOKEN"]
API = "https://api.companycam.com/v2"
SUPABASE_URL = "process.env.NEXT_PUBLIC_SUPABASE_URL"
SUPABASE_KEY = os.environ["SUPABASE_SERVICE_ROLE_KEY"]

BATCH_GAP = 1800  # 30 min
MIN_GAP_BETWEEN_BATCHES = 3600  # 1 hour

def log(msg):
    print(f"[{datetime.now().strftime('%H:%M:%S')}] {msg}", flush=True)

def get_all_projects():
    resp = requests.get(f"{API}/projects?per_page=100", headers={"Authorization": f"Bearer {TOKEN}"})
    return resp.json()

def get_project_photos(project_id):
    resp = requests.get(f"{API}/projects/{project_id}/photos?per_page=100", headers={"Authorization": f"Bearer {TOKEN}"})
    return resp.json()

def get_photo_url(photo):
    for uri in photo.get("uris", []):
        if uri.get("type") == "original":
            return uri.get("uri")
    return None

def group_into_batches(photos):
    if not photos:
        return []
    sorted_photos = sorted(photos, key=lambda p: p.get("captured_at", 0))
    batches = []
    current = [sorted_photos[0]]
    for photo in sorted_photos[1:]:
        if photo.get("captured_at", 0) - current[-1].get("captured_at", 0) <= BATCH_GAP:
            current.append(photo)
        else:
            if len(current) >= 1:
                batches.append(current)
            current = [photo]
    if current:
        batches.append(current)
    return batches

def find_transformation(batches):
    if len(batches) < 2:
        return None
    first = batches[0]
    last = batches[-1]
    gap = min(p.get("captured_at", 0) for p in last) - max(p.get("captured_at", 0) for p in first)
    if gap >= MIN_GAP_BETWEEN_BATCHES:
        return {"before": first, "after": last}
    return None

def create_post(content, photo_urls, project_name):
    data = {
        "content": content,
        "platforms": ["instagram", "facebook", "nextdoor"],
        "status": "idea",
        "photo_urls": photo_urls,
        "photo_source": "companycam",
        "ai_generated": False,
        "posted_ids": {},
        "tags": ["before-after", "transformation", "full-scan"],
        "notes": f"Full DB scan. Project: {project_name}"
    }
    resp = requests.post(f"{SUPABASE_URL}/rest/v1/cc_posts", 
                        headers={"apikey": SUPABASE_KEY, "Authorization": f"Bearer {SUPABASE_KEY}", 
                                "Content-Type": "application/json", "Prefer": "return=minimal"},
                        json=data)
    return resp.ok

CAPTIONS = ["Before and after.", "Same property.", "The transformation.", "Results."]

def main():
    log("=" * 50)
    log("FULL DATABASE SCAN")
    log("=" * 50)
    
    projects = get_all_projects()
    log(f"Found {len(projects)} projects")
    
    results = {
        "total_projects": len(projects),
        "total_photos": 0,
        "transformations_found": 0,
        "posts_created": 0,
        "projects_with_transformations": []
    }
    
    for i, proj in enumerate(projects):
        pid = proj["id"]
        name = proj.get("name", "Unknown")
        
        photos = get_project_photos(pid)
        results["total_photos"] += len(photos)
        
        if len(photos) < 2:
            continue
        
        batches = group_into_batches(photos)
        transform = find_transformation(batches)
        
        if transform:
            results["transformations_found"] += 1
            before_url = get_photo_url(transform["before"][len(transform["before"])//2])
            after_url = get_photo_url(transform["after"][len(transform["after"])//2])
            
            if before_url and after_url:
                caption = CAPTIONS[results["posts_created"] % len(CAPTIONS)]
                if create_post(caption, [before_url, after_url], name):
                    results["posts_created"] += 1
                    results["projects_with_transformations"].append({
                        "name": name,
                        "photos": len(photos),
                        "batches": len(batches),
                        "before_batch_size": len(transform["before"]),
                        "after_batch_size": len(transform["after"])
                    })
                    log(f"  [{i+1}/{len(projects)}] {name}: {len(photos)} photos, {len(batches)} batches -> POST CREATED")
                else:
                    log(f"  [{i+1}/{len(projects)}] {name}: Failed to create post")
            else:
                log(f"  [{i+1}/{len(projects)}] {name}: No valid URLs")
        else:
            log(f"  [{i+1}/{len(projects)}] {name}: {len(photos)} photos, {len(batches)} batches -> no transformation")
    
    log("=" * 50)
    log(f"COMPLETE")
    log(f"  Projects: {results['total_projects']}")
    log(f"  Total photos: {results['total_photos']}")
    log(f"  Transformations found: {results['transformations_found']}")
    log(f"  Posts created: {results['posts_created']}")
    log("=" * 50)
    
    print(json.dumps(results, indent=2))

if __name__ == "__main__":
    main()
