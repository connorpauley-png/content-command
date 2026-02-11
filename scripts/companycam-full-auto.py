#!/usr/bin/env python3
"""
CompanyCam FULL Automation v2
- Scans new photos
- Groups photos into BATCHES (photos taken close together)
- Detects before/after by batch timing, not individual photos
- Creates draft posts
- NO time in captions (upload timestamps are unreliable)
"""

import os
import sys
import json
import time
import requests
from datetime import datetime
from typing import Optional, List, Dict
import random

COMPANYCAM_TOKEN = os.environ["COMPANYCAM_TOKEN"]
COMPANYCAM_API = "https://api.companycam.com/v2"
SUPABASE_URL = "process.env.NEXT_PUBLIC_SUPABASE_URL"
SUPABASE_KEY = os.environ["SUPABASE_SERVICE_ROLE_KEY"]

STATE_FILE = os.path.join(os.path.dirname(__file__), ".cc_auto_state.json")

# Batch detection settings
BATCH_GAP_SECONDS = 1800  # 30 min gap = new batch
MIN_BATCH_SIZE = 2  # Minimum photos to count as a batch
MIN_GAP_BETWEEN_BATCHES = 3600  # 1 hour minimum between before/after batches

# Captions - NO time references
TRANSFORMATION_CAPTIONS = [
    "Before and after.",
    "Same property.",
    "The transformation.",
    "This is why we do what we do.",
    "Results.",
    "What a difference.",
]

def log(msg: str):
    ts = datetime.now().strftime('%Y-%m-%d %H:%M:%S')
    print(f"[{ts}] {msg}", flush=True)

def cc_headers():
    return {"Authorization": f"Bearer {COMPANYCAM_TOKEN}"}

def supabase_headers():
    return {
        "apikey": SUPABASE_KEY,
        "Authorization": f"Bearer {SUPABASE_KEY}",
        "Content-Type": "application/json",
        "Prefer": "return=minimal"
    }

def load_state():
    if os.path.exists(STATE_FILE):
        with open(STATE_FILE) as f:
            return json.load(f)
    return {"processed_projects": [], "pairs_created": []}

def save_state(state):
    with open(STATE_FILE, 'w') as f:
        json.dump(state, f)

def get_photos(limit=50):
    resp = requests.get(f"{COMPANYCAM_API}/photos", 
                       headers=cc_headers(),
                       params={"per_page": limit, "sort": "created_at"})
    resp.raise_for_status()
    return resp.json()

def get_project(project_id):
    try:
        resp = requests.get(f"{COMPANYCAM_API}/projects/{project_id}", headers=cc_headers())
        resp.raise_for_status()
        return resp.json()
    except:
        return {}

def get_project_photos(project_id, limit=100):
    resp = requests.get(f"{COMPANYCAM_API}/projects/{project_id}/photos",
                       headers=cc_headers(), 
                       params={"per_page": limit, "sort": "captured_at"})
    resp.raise_for_status()
    return resp.json()

def get_photo_url(photo):
    for uri in photo.get("uris", []):
        if uri.get("type") == "original":
            return uri.get("uri")
    return None

def create_post(content, platforms, photo_urls, tags=None, notes=None):
    """Create draft post in Content Command"""
    data = {
        "content": content,
        "platforms": platforms,
        "status": "idea",
        "photo_urls": photo_urls,
        "photo_source": "companycam",
        "ai_generated": False,
        "posted_ids": {},
        "tags": tags or [],
        "notes": notes
    }
    try:
        resp = requests.post(f"{SUPABASE_URL}/rest/v1/cc_posts", 
                            headers=supabase_headers(),
                            json=data)
        resp.raise_for_status()
        return True
    except Exception as e:
        log(f"  Error creating post: {e}")
        return False

def group_photos_into_batches(photos: List[Dict]) -> List[List[Dict]]:
    """
    Group photos into batches based on capture time.
    Photos taken within BATCH_GAP_SECONDS of each other = same batch.
    """
    if not photos:
        return []
    
    # Sort by captured_at
    sorted_photos = sorted(photos, key=lambda p: p.get("captured_at", 0))
    
    batches = []
    current_batch = [sorted_photos[0]]
    
    for photo in sorted_photos[1:]:
        current_time = photo.get("captured_at", 0)
        prev_time = current_batch[-1].get("captured_at", 0)
        
        if current_time - prev_time <= BATCH_GAP_SECONDS:
            # Same batch
            current_batch.append(photo)
        else:
            # New batch
            if len(current_batch) >= MIN_BATCH_SIZE:
                batches.append(current_batch)
            current_batch = [photo]
    
    # Don't forget last batch
    if len(current_batch) >= MIN_BATCH_SIZE:
        batches.append(current_batch)
    
    return batches

def find_before_after_batches(batches: List[List[Dict]]) -> Optional[tuple]:
    """
    Find before/after batch pairs.
    Returns (before_batch, after_batch) or None.
    
    Logic: First batch is "before", last batch (if gap > MIN_GAP) is "after"
    """
    if len(batches) < 2:
        return None
    
    before_batch = batches[0]
    after_batch = batches[-1]
    
    # Check there's enough gap between batches
    before_end = max(p.get("captured_at", 0) for p in before_batch)
    after_start = min(p.get("captured_at", 0) for p in after_batch)
    
    gap = after_start - before_end
    if gap < MIN_GAP_BETWEEN_BATCHES:
        return None
    
    return (before_batch, after_batch)

def select_best_photo_from_batch(batch: List[Dict]) -> Optional[str]:
    """
    Select the best photo URL from a batch.
    For now, just pick the middle photo (often best composition).
    Could add quality scoring later.
    """
    if not batch:
        return None
    
    # Pick middle photo
    middle_idx = len(batch) // 2
    return get_photo_url(batch[middle_idx])

def run():
    log("=" * 60)
    log("CompanyCam Full Automation v2 - Batch Detection")
    log("=" * 60)
    
    state = load_state()
    photos = get_photos(50)
    log(f"Fetched {len(photos)} recent photos")
    
    # Group by project
    by_project: Dict[str, List[Dict]] = {}
    for p in photos:
        proj = p.get("project_id")
        if proj:
            by_project.setdefault(proj, []).append(p)
    
    log(f"Found {len(by_project)} projects with photos")
    
    posts_created = 0
    pairs_found = 0
    
    for project_id, project_photos in by_project.items():
        # Skip if we've already processed this project recently
        if project_id in state.get("processed_projects", [])[-50:]:
            continue
        
        # Get ALL photos for this project (not just recent)
        all_project_photos = get_project_photos(project_id)
        if len(all_project_photos) < 4:  # Need enough photos for batches
            continue
        
        # Group into batches
        batches = group_photos_into_batches(all_project_photos)
        log(f"  Project {project_id}: {len(all_project_photos)} photos -> {len(batches)} batches")
        
        if len(batches) < 2:
            continue
        
        # Find before/after
        pair = find_before_after_batches(batches)
        if not pair:
            continue
        
        before_batch, after_batch = pair
        pairs_found += 1
        
        # Check if we already created a post for this pair
        pair_key = f"{project_id}-{len(before_batch)}-{len(after_batch)}"
        if pair_key in state.get("pairs_created", []):
            log(f"  Already created post for this pair")
            continue
        
        # Select best photo from each batch
        before_url = select_best_photo_from_batch(before_batch)
        after_url = select_best_photo_from_batch(after_batch)
        
        if not before_url or not after_url:
            continue
        
        # Get project name
        project = get_project(project_id)
        proj_name = project.get("name", "Project")
        
        # Pick a caption (no time references)
        caption = random.choice(TRANSFORMATION_CAPTIONS)
        
        # Create post
        if create_post(
            content=caption,
            platforms=["instagram", "facebook", "nextdoor"],
            photo_urls=[before_url, after_url],
            tags=["before-after", "transformation"],
            notes=f"Auto-generated. Project: {proj_name}. Before batch: {len(before_batch)} photos. After batch: {len(after_batch)} photos."
        ):
            posts_created += 1
            state.setdefault("pairs_created", []).append(pair_key)
            state.setdefault("processed_projects", []).append(project_id)
            log(f"  Created before/after post for {proj_name}")
    
    # Keep state manageable
    state["processed_projects"] = state.get("processed_projects", [])[-100:]
    state["pairs_created"] = state.get("pairs_created", [])[-200:]
    save_state(state)
    
    log("=" * 60)
    log(f"Complete: {len(by_project)} projects scanned, {pairs_found} pairs found, {posts_created} posts created")
    log("=" * 60)
    
    return {
        "projects_scanned": len(by_project),
        "pairs_found": pairs_found,
        "posts_created": posts_created,
    }

if __name__ == "__main__":
    result = run()
