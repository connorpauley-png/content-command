#!/usr/bin/env python3
"""
CompanyCam Fingerprint Automation v3

New logic:
1. For each project, get all photos
2. Analyze each photo: fingerprint + messy (0-10) + clean (0-10)
3. Group by similar fingerprints
4. Find groups with both high-messy AND high-clean photos
5. Pick best pair, combine image, queue post

messy = BEFORE
clean = AFTER
"""

import os
import sys
import json
import requests
from datetime import datetime
from collections import defaultdict

COMPANYCAM_TOKEN = os.environ["COMPANYCAM_TOKEN"]
SUPABASE_URL = "process.env.NEXT_PUBLIC_SUPABASE_URL"
SUPABASE_KEY = os.environ["SUPABASE_SERVICE_ROLE_KEY"]

# Cache file for analyzed photos
CACHE_FILE = os.path.join(os.path.dirname(__file__), ".photo_cache.json")

def log(msg):
    print(f"[{datetime.now().strftime('%Y-%m-%d %H:%M:%S')}] {msg}")

def load_cache():
    if os.path.exists(CACHE_FILE):
        with open(CACHE_FILE, 'r') as f:
            return json.load(f)
    return {}

def save_cache(cache):
    with open(CACHE_FILE, 'w') as f:
        json.dump(cache, f)

def get_projects(limit=50):
    """Get recent projects"""
    url = f"https://api.companycam.com/v2/projects?per_page={limit}"
    headers = {"Authorization": f"Bearer {COMPANYCAM_TOKEN}"}
    resp = requests.get(url, headers=headers)
    if resp.status_code == 200:
        return resp.json()
    return []

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

def normalize_fingerprint(fp):
    """Normalize fingerprint for matching"""
    words = fp.lower().replace(',', ' ').split()
    # Remove common filler words
    stopwords = {'the', 'a', 'an', 'with', 'and', 'or', 'in', 'on', 'at', 'to', 'of'}
    words = [w for w in words if w not in stopwords and len(w) > 2]
    return ' '.join(sorted(set(words)))

def fingerprint_similarity(fp1, fp2):
    """Calculate Jaccard similarity between fingerprints"""
    words1 = set(normalize_fingerprint(fp1).split())
    words2 = set(normalize_fingerprint(fp2).split())
    if not words1 or not words2:
        return 0
    intersection = words1 & words2
    union = words1 | words2
    return len(intersection) / len(union)

def match_photos(analyzed_photos, min_messy=5, min_clean=5, min_similarity=0.3):
    """
    Match photos into before/after pairs
    Returns list of (before, after, similarity_score) tuples
    """
    pairs = []
    used = set()
    
    # Sort by messy score (best befores first)
    sorted_by_messy = sorted(analyzed_photos, key=lambda p: p.get('messy', 0), reverse=True)
    
    for before in sorted_by_messy:
        if before['id'] in used:
            continue
        if before.get('messy', 0) < min_messy:
            continue
        
        best_after = None
        best_sim = 0
        
        for after in analyzed_photos:
            if after['id'] == before['id']:
                continue
            if after['id'] in used:
                continue
            if after.get('clean', 0) < min_clean:
                continue
            
            sim = fingerprint_similarity(before.get('fingerprint', ''), after.get('fingerprint', ''))
            if sim > min_similarity and sim > best_sim:
                best_sim = sim
                best_after = after
        
        if best_after:
            pairs.append((before, best_after, best_sim))
            used.add(before['id'])
            used.add(best_after['id'])
    
    return pairs

def create_post(before_url, after_url, caption, project_name):
    """Create post in Supabase"""
    url = f"{SUPABASE_URL}/rest/v1/cc_posts"
    headers = {
        "apikey": SUPABASE_KEY,
        "Authorization": f"Bearer {SUPABASE_KEY}",
        "Content-Type": "application/json",
        "Prefer": "return=minimal"
    }
    data = {
        "content": caption,
        "platforms": ["instagram", "facebook", "nextdoor"],
        "status": "idea",
        "photo_urls": [before_url, after_url],
        "photo_source": "companycam",
        "ai_generated": False,
        "tags": ["before-after", "ai-fingerprint-matched"],
        "notes": f"AI fingerprint matched. Project: {project_name}"
    }
    resp = requests.post(url, headers=headers, json=data)
    return resp.status_code in [200, 201]

def main():
    log("=" * 60)
    log("CompanyCam Fingerprint Automation v3")
    log("=" * 60)
    
    cache = load_cache()
    
    # Get projects with pre-tagged "Before and After" photos first
    log("Checking pre-tagged 'Before and After' photos...")
    
    url = "https://api.companycam.com/v2/photos?per_page=50&tag_ids[]=16664744"
    headers = {"Authorization": f"Bearer {COMPANYCAM_TOKEN}"}
    resp = requests.get(url, headers=headers)
    
    if resp.status_code == 200:
        tagged_photos = resp.json()
        log(f"Found {len(tagged_photos)} pre-tagged photos")
        
        # Group by project
        by_project = defaultdict(list)
        for p in tagged_photos:
            by_project[p.get('project_id')].append({
                "id": p["id"],
                "url": next((u["uri"] for u in p.get("uris", []) if u["type"] == "original"), None)
            })
        
        log(f"Across {len(by_project)} projects")
    else:
        log("Failed to fetch tagged photos")
        by_project = {}
    
    log("")
    log("Fingerprint matching requires photo analysis.")
    log("Run with analyzed photo data or use the API endpoint.")
    log("")
    log("System ready. Use /api/match endpoint to:")
    log("  1. GET /api/match?projectId=xxx - get photos for analysis")
    log("  2. POST /api/match with analyzed photos - get matched pairs")
    log("  3. POST /api/match/create - create post from pair")
    log("=" * 60)

if __name__ == "__main__":
    main()
