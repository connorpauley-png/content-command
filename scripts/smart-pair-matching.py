#!/usr/bin/env python3
"""
Smart Before/After Pair Matching

Multi-layer analysis:
1. GPS proximity matching (same property)
2. Structural fingerprinting (same view/angle)
3. Change detection (identify work area)
4. Direction validation (before→after, not reverse)
"""

import os
import json
import math
import requests
from datetime import datetime
from typing import List, Dict, Optional, Tuple
from dataclasses import dataclass, field

COMPANYCAM_TOKEN = os.environ.get("COMPANYCAM_TOKEN", "")
COMPANYCAM_API = "https://api.companycam.com/v2"

# GPS tolerance in meters (50m = same property)
GPS_TOLERANCE_METERS = 50

@dataclass
class Photo:
    id: str
    project_id: str
    url: str
    lat: Optional[float] = None
    lon: Optional[float] = None
    captured_at: int = 0
    creator_name: str = ""
    tags: List[str] = field(default_factory=list)
    
    # Vision analysis results
    classification: Optional[str] = None  # before/after/combined/other
    structures: List[str] = field(default_factory=list)  # house, fence, tree, driveway
    condition: Optional[str] = None  # messy/clean/partial
    confidence: float = 0.0

@dataclass
class PhotoPair:
    before: Photo
    after: Photo
    gps_distance_m: float
    structural_match_score: float  # 0-1
    change_detected: bool
    change_description: str
    overall_score: float  # 0-1
    
def log(msg: str):
    print(f"[{datetime.now().strftime('%H:%M:%S')}] {msg}", flush=True)

def haversine_distance(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    """Calculate distance between two GPS points in meters"""
    R = 6371000  # Earth radius in meters
    phi1 = math.radians(lat1)
    phi2 = math.radians(lat2)
    delta_phi = math.radians(lat2 - lat1)
    delta_lambda = math.radians(lon2 - lon1)
    
    a = math.sin(delta_phi/2)**2 + math.cos(phi1) * math.cos(phi2) * math.sin(delta_lambda/2)**2
    c = 2 * math.atan2(math.sqrt(a), math.sqrt(1-a))
    
    return R * c

def fetch_project_photos(project_id: str) -> List[Photo]:
    """Fetch all photos from a project with full metadata"""
    resp = requests.get(
        f"{COMPANYCAM_API}/projects/{project_id}/photos?per_page=100",
        headers={"Authorization": f"Bearer {COMPANYCAM_TOKEN}"}
    )
    
    if not resp.ok:
        return []
    
    photos = []
    for p in resp.json():
        # Get original URL
        url = None
        for uri in p.get("uris", []):
            if uri.get("type") == "original":
                url = uri.get("uri")
                break
        
        if not url:
            continue
            
        coords = p.get("coordinates", {})
        
        photo = Photo(
            id=p["id"],
            project_id=project_id,
            url=url,
            lat=coords.get("lat"),
            lon=coords.get("lon"),
            captured_at=p.get("captured_at", 0),
            creator_name=p.get("creator_name", "")
        )
        
        # Fetch tags
        tags_resp = requests.get(
            f"{COMPANYCAM_API}/photos/{p['id']}/tags",
            headers={"Authorization": f"Bearer {COMPANYCAM_TOKEN}"}
        )
        if tags_resp.ok:
            photo.tags = [t.get("display_value", "").lower() for t in tags_resp.json()]
        
        photos.append(photo)
    
    return photos

def gps_match(photo1: Photo, photo2: Photo) -> Tuple[bool, float]:
    """Check if two photos are from the same location"""
    if not all([photo1.lat, photo1.lon, photo2.lat, photo2.lon]):
        # No GPS data - assume same location if same project
        return True, 0.0
    
    distance = haversine_distance(photo1.lat, photo1.lon, photo2.lat, photo2.lon)
    return distance <= GPS_TOLERANCE_METERS, distance

def analyze_photo_vision(photo: Photo) -> Photo:
    """
    Use vision AI to analyze a photo.
    
    Returns classification, structural elements, and condition.
    
    NOTE: This function should call the vision API.
    For now, using tag-based heuristics as fallback.
    """
    # Tag-based classification
    tags_lower = [t.lower() for t in photo.tags]
    
    if "before" in tags_lower or "start" in tags_lower or "old" in tags_lower:
        photo.classification = "before"
        photo.confidence = 0.9
    elif "finished" in tags_lower or "after" in tags_lower or "before and after" in tags_lower:
        photo.classification = "after"
        photo.confidence = 0.9
    else:
        # Would call vision API here
        photo.classification = "unknown"
        photo.confidence = 0.5
    
    return photo

def analyze_pair_similarity(photo1: Photo, photo2: Photo) -> Dict:
    """
    Compare two photos for structural similarity and change detection.
    
    This should use vision AI to:
    1. Identify shared structures (house, fence, trees)
    2. Detect what changed between them
    3. Score the match quality
    """
    # For now, use GPS + time heuristics
    # In production, this calls vision API with both images
    
    result = {
        "structural_match": 0.0,
        "shared_structures": [],
        "change_detected": False,
        "change_area": "",
        "change_description": ""
    }
    
    # GPS proximity boosts structural match score
    gps_match_result, distance = gps_match(photo1, photo2)
    if gps_match_result:
        result["structural_match"] = 0.7 if distance < 10 else 0.5
    
    # Time gap suggests before/after
    time_gap = abs(photo2.captured_at - photo1.captured_at)
    if 3600 <= time_gap <= 86400 * 7:  # 1 hour to 7 days
        result["change_detected"] = True
        result["change_description"] = "Time gap suggests work was done between photos"
    
    return result

def find_best_pairs(photos: List[Photo]) -> List[PhotoPair]:
    """Find the best before/after pairs from a set of photos"""
    
    # Separate by classification
    befores = [p for p in photos if p.classification == "before"]
    afters = [p for p in photos if p.classification == "after"]
    
    if not befores or not afters:
        log(f"  Need both befores ({len(befores)}) and afters ({len(afters)})")
        return []
    
    pairs = []
    used_afters = set()
    
    for before in befores:
        best_pair = None
        best_score = 0
        
        for after in afters:
            if after.id in used_afters:
                continue
            
            # Check GPS match
            gps_ok, gps_distance = gps_match(before, after)
            if not gps_ok:
                continue
            
            # Analyze similarity
            similarity = analyze_pair_similarity(before, after)
            
            # Calculate overall score
            score = similarity["structural_match"]
            if similarity["change_detected"]:
                score += 0.3
            
            # Time ordering bonus (before should be earlier)
            if before.captured_at < after.captured_at:
                score += 0.1
            
            if score > best_score:
                best_score = score
                best_pair = PhotoPair(
                    before=before,
                    after=after,
                    gps_distance_m=gps_distance,
                    structural_match_score=similarity["structural_match"],
                    change_detected=similarity["change_detected"],
                    change_description=similarity["change_description"],
                    overall_score=score
                )
        
        if best_pair and best_pair.overall_score >= 0.5:
            pairs.append(best_pair)
            used_afters.add(best_pair.after.id)
    
    return sorted(pairs, key=lambda p: p.overall_score, reverse=True)

def vision_compare_pair(before_url: str, after_url: str) -> Dict:
    """
    Use vision AI to compare two photos and detect changes.
    
    This is the FULL analysis that:
    1. Confirms same location/angle
    2. Identifies what changed
    3. Validates before→after direction
    """
    
    # This would be called via OpenClaw's image tool or direct API
    # For now, return placeholder
    
    prompt = f"""Compare these two photos from a landscaping job:

PHOTO 1 (potential BEFORE): {before_url}
PHOTO 2 (potential AFTER): {after_url}

Analyze and respond in JSON:
{{
  "same_location": true/false,
  "same_angle": true/false,
  "shared_structures": ["house", "fence", "tree", etc],
  "change_detected": true/false,
  "change_area": "lawn/driveway/beds/etc",
  "change_description": "what changed",
  "before_condition": "describe the problem area in photo 1",
  "after_condition": "describe the same area in photo 2", 
  "valid_pair": true/false,
  "confidence": 0.0-1.0,
  "rejection_reason": "if not valid, why"
}}

A valid pair must:
1. Show the SAME location from a similar angle
2. Have a visible CHANGE in condition
3. Photo 1 shows the problem, Photo 2 shows it fixed
"""
    
    return {
        "prompt": prompt,
        "note": "Call this via vision API for real analysis"
    }

def main():
    log("=" * 60)
    log("SMART PAIR MATCHING")
    log("=" * 60)
    
    # Get projects with "Before and After" tagged photos
    resp = requests.get(
        f"{COMPANYCAM_API}/photos?per_page=50&tag_ids[]=16664744",
        headers={"Authorization": f"Bearer {COMPANYCAM_TOKEN}"}
    )
    
    if not resp.ok:
        log("Failed to fetch tagged photos")
        return
    
    # Group by project
    photos_by_project = {}
    for p in resp.json():
        pid = p.get("project_id")
        if pid not in photos_by_project:
            photos_by_project[pid] = []
        photos_by_project[pid].append(p["id"])
    
    log(f"Found {len(photos_by_project)} projects with tagged photos")
    
    # Analyze each project
    for project_id, photo_ids in list(photos_by_project.items())[:5]:
        # Get project name
        proj_resp = requests.get(
            f"{COMPANYCAM_API}/projects/{project_id}",
            headers={"Authorization": f"Bearer {COMPANYCAM_TOKEN}"}
        )
        project_name = proj_resp.json().get("name", "Unknown") if proj_resp.ok else "Unknown"
        
        log(f"\nProject: {project_name}")
        
        # Fetch full photo data
        photos = fetch_project_photos(project_id)
        log(f"  {len(photos)} photos")
        
        # Analyze each photo
        for photo in photos:
            analyze_photo_vision(photo)
        
        # Find pairs
        pairs = find_best_pairs(photos)
        log(f"  {len(pairs)} potential pairs found")
        
        for pair in pairs:
            log(f"    Score {pair.overall_score:.2f}: {pair.before.id} → {pair.after.id}")
            log(f"      GPS distance: {pair.gps_distance_m:.1f}m")
            log(f"      Change: {pair.change_description}")

if __name__ == "__main__":
    main()
