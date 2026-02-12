#!/usr/bin/env python3
"""
CompanyCam Full Automation Pipeline
- Scans all new photos
- Vision AI analysis (scene, quality, service type)
- Auto-detects before/after pairs
- Auto-generates social posts
- Tags photos in CompanyCam with AI analysis
"""

import os
import sys
import json
import time
import hashlib
import requests
from datetime import datetime, timedelta
from typing import Optional
import base64

# Config
COMPANYCAM_TOKEN = os.environ.get("COMPANYCAM_TOKEN", "")
COMPANYCAM_API = "https://api.companycam.com/v2"
SUPABASE_URL = os.environ.get("SUPABASE_URL", "")
SUPABASE_KEY = os.environ.get("SUPABASE_SERVICE_ROLE_KEY", "")

# State file to track processed photos
STATE_FILE = os.path.join(os.path.dirname(__file__), ".companycam_state.json")

def log(msg: str):
    print(f"[{datetime.now().strftime('%Y-%m-%d %H:%M:%S')}] {msg}")

def load_state() -> dict:
    if os.path.exists(STATE_FILE):
        with open(STATE_FILE) as f:
            return json.load(f)
    return {"last_scan": 0, "processed_ids": []}

def save_state(state: dict):
    with open(STATE_FILE, 'w') as f:
        json.dump(state, f)

def cc_headers():
    return {"Authorization": f"Bearer {COMPANYCAM_TOKEN}"}

def supabase_headers():
    return {
        "apikey": SUPABASE_KEY,
        "Authorization": f"Bearer {SUPABASE_KEY}",
        "Content-Type": "application/json"
    }

def get_new_photos(since_timestamp: int = 0, limit: int = 50) -> list:
    """Fetch photos created after timestamp"""
    url = f"{COMPANYCAM_API}/photos"
    params = {"per_page": limit, "sort": "created_at"}
    resp = requests.get(url, headers=cc_headers(), params=params)
    resp.raise_for_status()
    photos = resp.json()
    
    if since_timestamp:
        photos = [p for p in photos if p.get("created_at", 0) > since_timestamp]
    
    return photos

def get_photo_comments(photo_id: str) -> list:
    """Get comments on a photo"""
    url = f"{COMPANYCAM_API}/photos/{photo_id}/comments"
    resp = requests.get(url, headers=cc_headers())
    resp.raise_for_status()
    return resp.json()

def add_photo_comment(photo_id: str, comment: str):
    """Add a comment to a photo"""
    url = f"{COMPANYCAM_API}/photos/{photo_id}/comments"
    resp = requests.post(url, headers=cc_headers(), json={"comment": {"content": comment}})
    resp.raise_for_status()
    return resp.json()

def get_project(project_id: str) -> dict:
    """Get project details"""
    url = f"{COMPANYCAM_API}/projects/{project_id}"
    resp = requests.get(url, headers=cc_headers())
    resp.raise_for_status()
    return resp.json()

def get_project_photos(project_id: str) -> list:
    """Get all photos for a project"""
    url = f"{COMPANYCAM_API}/projects/{project_id}/photos"
    params = {"per_page": 100}
    resp = requests.get(url, headers=cc_headers(), params=params)
    resp.raise_for_status()
    return resp.json()

def has_ai_comment(photo_id: str) -> bool:
    """Check if photo already has AI analysis comment"""
    comments = get_photo_comments(photo_id)
    return any(c.get("content", "").startswith("[AI]") for c in comments)

def analyze_photo_vision(photo_url: str) -> dict:
    """
    Analyze photo using vision model
    Returns: {scene, stage, services, quality, caption_idea, social_worthy}
    """
    # For now, return a structured prompt that OpenClaw will process
    # In production, this would call the vision API directly
    return {
        "url": photo_url,
        "needs_analysis": True
    }

def score_photo_quality(analysis: dict) -> int:
    """Score photo 1-10 for social media worthiness"""
    # Factors: clarity, composition, transformation visible, interesting angle
    # This gets populated by vision analysis
    return analysis.get("quality", 5)

def detect_before_after_pairs(photos: list) -> list:
    """
    Group photos by project and detect before/after pairs
    Returns: [(before_photo, after_photo, project), ...]
    """
    # Group by project
    by_project = {}
    for photo in photos:
        pid = photo.get("project_id")
        if pid:
            if pid not in by_project:
                by_project[pid] = []
            by_project[pid].append(photo)
    
    pairs = []
    for project_id, project_photos in by_project.items():
        if len(project_photos) < 2:
            continue
        
        # Sort by timestamp
        project_photos.sort(key=lambda p: p.get("captured_at", 0))
        
        # Simple heuristic: first photo is "before", last is "after"
        # Vision analysis will confirm
        before = project_photos[0]
        after = project_photos[-1]
        
        # Only pair if timestamps are far enough apart (at least 30 min)
        time_diff = after.get("captured_at", 0) - before.get("captured_at", 0)
        if time_diff > 1800:  # 30 minutes
            pairs.append({
                "before": before,
                "after": after,
                "project_id": project_id,
                "time_diff_hours": round(time_diff / 3600, 1)
            })
    
    return pairs

def create_post_draft(content: str, platforms: list, photo_urls: list, tags: list = None, notes: str = None):
    """Create a draft post in Content Command"""
    url = f"{SUPABASE_URL}/rest/v1/cc_posts"
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
    resp = requests.post(url, headers=supabase_headers(), json=data)
    resp.raise_for_status()
    return resp.json()

def generate_transformation_caption(project_name: str, time_hours: float) -> str:
    """Generate a caption for before/after transformation"""
    captions = [
        f"{time_hours:.0f} hours of work. Same property.",
        f"The difference {time_hours:.0f} hours makes.",
        f"Before and after. {project_name.split()[0] if project_name else 'Monroe'} property.",
        f"This is why we show up.",
    ]
    # Rotate based on day
    idx = datetime.now().day % len(captions)
    return captions[idx]

def process_photo(photo: dict, state: dict) -> Optional[dict]:
    """Process a single photo - analyze and tag"""
    photo_id = photo.get("id")
    
    if photo_id in state.get("processed_ids", []):
        return None
    
    if has_ai_comment(photo_id):
        log(f"  Photo {photo_id} already has AI comment, skipping")
        state["processed_ids"].append(photo_id)
        return None
    
    # Get photo URL
    uris = photo.get("uris", [])
    photo_url = None
    for uri in uris:
        if uri.get("type") == "original":
            photo_url = uri.get("uri")
            break
    
    if not photo_url:
        return None
    
    # For now, mark as needing vision analysis
    # The actual analysis happens via OpenClaw's image tool
    return {
        "id": photo_id,
        "url": photo_url,
        "project_id": photo.get("project_id"),
        "captured_at": photo.get("captured_at"),
        "needs_analysis": True
    }

def run_pipeline():
    """Main automation pipeline"""
    log("=" * 60)
    log("CompanyCam Automation Pipeline - Starting")
    log("=" * 60)
    
    state = load_state()
    last_scan = state.get("last_scan", 0)
    
    # Get new photos
    log(f"Fetching photos since {datetime.fromtimestamp(last_scan) if last_scan else 'beginning'}...")
    photos = get_new_photos(since_timestamp=last_scan)
    log(f"Found {len(photos)} new photos")
    
    if not photos:
        log("No new photos to process")
        return {"photos_processed": 0, "posts_created": 0, "pairs_found": 0}
    
    # Process each photo
    photos_needing_analysis = []
    for photo in photos:
        result = process_photo(photo, state)
        if result:
            photos_needing_analysis.append(result)
    
    log(f"{len(photos_needing_analysis)} photos need vision analysis")
    
    # Detect before/after pairs
    pairs = detect_before_after_pairs(photos)
    log(f"Detected {len(pairs)} potential before/after pairs")
    
    # Create draft posts for pairs
    posts_created = 0
    for pair in pairs:
        before = pair["before"]
        after = pair["after"]
        
        # Get project name
        try:
            project = get_project(pair["project_id"])
            project_name = project.get("name", "")
        except:
            project_name = ""
        
        # Get photo URLs
        before_url = next((u["uri"] for u in before.get("uris", []) if u["type"] == "original"), None)
        after_url = next((u["uri"] for u in after.get("uris", []) if u["type"] == "original"), None)
        
        if before_url and after_url:
            caption = generate_transformation_caption(project_name, pair["time_diff_hours"])
            
            try:
                create_post_draft(
                    content=caption,
                    platforms=["instagram", "facebook", "nextdoor"],
                    photo_urls=[before_url, after_url],
                    tags=["before-after", "transformation"],
                    notes=f"Auto-generated from CompanyCam. Project: {project_name}. Time: {pair['time_diff_hours']}h"
                )
                posts_created += 1
                log(f"  Created draft post for {project_name} transformation")
            except Exception as e:
                log(f"  Error creating post: {e}")
    
    # Update state
    state["last_scan"] = int(time.time())
    for photo in photos:
        if photo.get("id") not in state.get("processed_ids", []):
            state.setdefault("processed_ids", []).append(photo.get("id"))
    
    # Keep only last 1000 processed IDs
    state["processed_ids"] = state["processed_ids"][-1000:]
    save_state(state)
    
    log("=" * 60)
    log(f"Pipeline complete: {len(photos)} photos, {posts_created} posts created, {len(pairs)} pairs found")
    log("=" * 60)
    
    return {
        "photos_processed": len(photos),
        "posts_created": posts_created,
        "pairs_found": len(pairs),
        "needing_analysis": photos_needing_analysis
    }

if __name__ == "__main__":
    result = run_pipeline()
    print(json.dumps(result, indent=2))
