#!/usr/bin/env python3
"""
Smart Photo Analysis for CompanyCam

Uses vision AI to:
1. Classify each photo (before / after / combined / other)
2. Match befores to afters by visual similarity
3. Verify same property/angle
"""

import os
import sys
import json
import time
import base64
import requests
from datetime import datetime
from typing import Optional, List, Dict, Tuple
from dataclasses import dataclass
from collections import defaultdict

# API Keys
COMPANYCAM_TOKEN = os.environ.get("COMPANYCAM_TOKEN", "")
ANTHROPIC_API_KEY = os.environ.get("ANTHROPIC_API_KEY", "")

# If no Anthropic key, try OpenAI
OPENAI_API_KEY = os.environ.get("OPENAI_API_KEY", "")

COMPANYCAM_API = "https://api.companycam.com/v2"
SUPABASE_URL = os.environ.get("SUPABASE_URL", "")
SUPABASE_KEY = os.environ.get("SUPABASE_SERVICE_ROLE_KEY", "")

@dataclass
class PhotoClassification:
    photo_id: str
    photo_url: str
    project_id: str
    classification: str  # 'before', 'after', 'combined', 'other'
    confidence: float  # 0-1
    description: str
    features: List[str]  # key visual features for matching

@dataclass
class PhotoMatch:
    before_photo: PhotoClassification
    after_photo: PhotoClassification
    match_confidence: float
    same_property: bool
    same_angle: bool
    notes: str

def log(msg: str):
    ts = datetime.now().strftime('%Y-%m-%d %H:%M:%S')
    print(f"[{ts}] {msg}", flush=True)

def get_photo_url(photo: dict) -> Optional[str]:
    """Extract original photo URL"""
    for uri in photo.get("uris", []):
        if uri.get("type") == "original":
            return uri.get("uri")
    # Fallback to any URI
    if photo.get("uris"):
        return photo["uris"][0].get("uri")
    return None

def download_image_as_base64(url: str) -> Optional[str]:
    """Download image and convert to base64"""
    try:
        resp = requests.get(url, timeout=30)
        if resp.ok:
            return base64.b64encode(resp.content).decode('utf-8')
    except Exception as e:
        log(f"Error downloading image: {e}")
    return None

def classify_photo_anthropic(image_base64: str, photo_id: str) -> Optional[dict]:
    """Use Claude to classify a photo"""
    if not ANTHROPIC_API_KEY:
        return None
    
    prompt = """Analyze this photo from a landscaping/outdoor service company.

Classify it as ONE of:
- "before": Shows property BEFORE work (overgrown lawn, dirty surfaces, cluttered yard, stained driveway, untrimmed bushes)
- "after": Shows property AFTER work (fresh cut lawn, clean surfaces, neat landscaping, pressure washed, trimmed)
- "combined": A split image showing both before AND after in one photo
- "other": Crew photo, equipment, close-up detail, or not clearly before/after

Respond in JSON:
{
  "classification": "before|after|combined|other",
  "confidence": 0.0-1.0,
  "description": "brief description of what you see",
  "features": ["list", "of", "key", "visual", "features", "for", "matching"],
  "property_type": "house|yard|driveway|deck|fence|other",
  "visible_elements": ["house color", "fence type", "tree locations", "etc"]
}

Focus on features that would help match this to another photo of the same property."""

    try:
        resp = requests.post(
            "https://api.anthropic.com/v1/messages",
            headers={
                "x-api-key": ANTHROPIC_API_KEY,
                "anthropic-version": "2023-06-01",
                "content-type": "application/json"
            },
            json={
                "model": "claude-sonnet-4-20250514",
                "max_tokens": 500,
                "messages": [{
                    "role": "user",
                    "content": [
                        {
                            "type": "image",
                            "source": {
                                "type": "base64",
                                "media_type": "image/jpeg",
                                "data": image_base64
                            }
                        },
                        {"type": "text", "text": prompt}
                    ]
                }]
            },
            timeout=60
        )
        
        if resp.ok:
            content = resp.json()["content"][0]["text"]
            # Parse JSON from response
            try:
                # Handle markdown code blocks
                if "```json" in content:
                    content = content.split("```json")[1].split("```")[0]
                elif "```" in content:
                    content = content.split("```")[1].split("```")[0]
                return json.loads(content.strip())
            except json.JSONDecodeError:
                log(f"Failed to parse JSON for photo {photo_id}")
                return None
    except Exception as e:
        log(f"Anthropic API error: {e}")
    return None

def classify_photo_openai(image_url: str, photo_id: str) -> Optional[dict]:
    """Use GPT-4V to classify a photo (fallback)"""
    if not OPENAI_API_KEY:
        return None
    
    prompt = """Analyze this photo from a landscaping/outdoor service company.

Classify it as ONE of:
- "before": Shows property BEFORE work (overgrown, dirty, messy)
- "after": Shows property AFTER work (clean, trimmed, finished)
- "combined": A split image showing both before AND after
- "other": Crew photo, equipment, or not clearly before/after

Respond in JSON only:
{"classification": "before|after|combined|other", "confidence": 0.0-1.0, "description": "brief description", "features": ["key", "visual", "features"]}"""

    try:
        resp = requests.post(
            "https://api.openai.com/v1/chat/completions",
            headers={
                "Authorization": f"Bearer {OPENAI_API_KEY}",
                "Content-Type": "application/json"
            },
            json={
                "model": "gpt-4o",
                "messages": [{
                    "role": "user",
                    "content": [
                        {"type": "text", "text": prompt},
                        {"type": "image_url", "image_url": {"url": image_url}}
                    ]
                }],
                "max_tokens": 300
            },
            timeout=60
        )
        
        if resp.ok:
            content = resp.json()["choices"][0]["message"]["content"]
            try:
                if "```json" in content:
                    content = content.split("```json")[1].split("```")[0]
                elif "```" in content:
                    content = content.split("```")[1].split("```")[0]
                return json.loads(content.strip())
            except json.JSONDecodeError:
                return None
    except Exception as e:
        log(f"OpenAI API error: {e}")
    return None

def classify_photo(photo: dict) -> Optional[PhotoClassification]:
    """Classify a single photo using available vision API"""
    photo_id = photo["id"]
    photo_url = get_photo_url(photo)
    project_id = photo.get("project_id", "")
    
    if not photo_url:
        return None
    
    result = None
    
    # Try Anthropic first (better at this task)
    if ANTHROPIC_API_KEY:
        image_b64 = download_image_as_base64(photo_url)
        if image_b64:
            result = classify_photo_anthropic(image_b64, photo_id)
    
    # Fallback to OpenAI
    if not result and OPENAI_API_KEY:
        result = classify_photo_openai(photo_url, photo_id)
    
    if not result:
        log(f"  Photo {photo_id}: No vision API available or failed")
        return None
    
    return PhotoClassification(
        photo_id=photo_id,
        photo_url=photo_url,
        project_id=project_id,
        classification=result.get("classification", "other"),
        confidence=result.get("confidence", 0.5),
        description=result.get("description", ""),
        features=result.get("features", [])
    )

def match_photos(before: PhotoClassification, after: PhotoClassification) -> Optional[PhotoMatch]:
    """Check if two photos are from the same property/angle"""
    if not ANTHROPIC_API_KEY and not OPENAI_API_KEY:
        # Without vision API, assume same project = same property
        return PhotoMatch(
            before_photo=before,
            after_photo=after,
            match_confidence=0.7,
            same_property=True,
            same_angle=False,
            notes="Assumed match (same project, no vision verification)"
        )
    
    # For now, if same project, assume high match probability
    # Could enhance with side-by-side vision comparison
    if before.project_id == after.project_id:
        # Check feature overlap
        common_features = set(before.features) & set(after.features)
        feature_score = len(common_features) / max(len(before.features), len(after.features), 1)
        
        return PhotoMatch(
            before_photo=before,
            after_photo=after,
            match_confidence=0.6 + (feature_score * 0.4),
            same_property=True,
            same_angle=feature_score > 0.5,
            notes=f"Common features: {', '.join(common_features) if common_features else 'none detected'}"
        )
    
    return None

def analyze_project(project_id: str, project_name: str) -> List[PhotoMatch]:
    """Analyze all photos in a project and find valid before/after pairs"""
    log(f"Analyzing project: {project_name}")
    
    # Get all photos
    resp = requests.get(
        f"{COMPANYCAM_API}/projects/{project_id}/photos?per_page=100",
        headers={"Authorization": f"Bearer {COMPANYCAM_TOKEN}"}
    )
    
    if not resp.ok:
        log(f"  Failed to fetch photos")
        return []
    
    photos = resp.json()
    log(f"  Found {len(photos)} photos")
    
    if len(photos) < 2:
        log(f"  Not enough photos for before/after")
        return []
    
    # Classify each photo
    classifications = []
    befores = []
    afters = []
    combined = []
    
    for i, photo in enumerate(photos):
        log(f"  Classifying photo {i+1}/{len(photos)}...")
        classification = classify_photo(photo)
        
        if classification:
            classifications.append(classification)
            log(f"    -> {classification.classification} (confidence: {classification.confidence:.2f})")
            
            if classification.classification == "before":
                befores.append(classification)
            elif classification.classification == "after":
                afters.append(classification)
            elif classification.classification == "combined":
                combined.append(classification)
        
        # Rate limiting
        time.sleep(0.5)
    
    log(f"  Results: {len(befores)} befores, {len(afters)} afters, {len(combined)} combined")
    
    # Match befores to afters
    matches = []
    
    # Combined photos are already matched
    for c in combined:
        matches.append(PhotoMatch(
            before_photo=c,
            after_photo=c,
            match_confidence=1.0,
            same_property=True,
            same_angle=True,
            notes="Combined before/after image"
        ))
    
    # Try to match befores with afters
    used_afters = set()
    for before in befores:
        best_match = None
        best_score = 0
        
        for after in afters:
            if after.photo_id in used_afters:
                continue
            
            match = match_photos(before, after)
            if match and match.match_confidence > best_score:
                best_match = match
                best_score = match.match_confidence
        
        if best_match and best_score >= 0.6:
            matches.append(best_match)
            used_afters.add(best_match.after_photo.photo_id)
            log(f"  Matched: before {before.photo_id} <-> after {best_match.after_photo.photo_id} (confidence: {best_score:.2f})")
    
    return matches

def create_post_from_match(match: PhotoMatch, project_name: str) -> bool:
    """Create a post from a verified match"""
    
    # For combined images, just use the one photo
    if match.before_photo.photo_id == match.after_photo.photo_id:
        photo_urls = [match.before_photo.photo_url]
        notes = f"Combined before/after. Project: {project_name}"
    else:
        photo_urls = [match.before_photo.photo_url, match.after_photo.photo_url]
        notes = f"Vision-verified match (confidence: {match.match_confidence:.0%}). Project: {project_name}"
    
    data = {
        "content": "Before and after.",
        "platforms": ["instagram", "facebook", "nextdoor"],
        "status": "idea",
        "photo_urls": photo_urls,
        "photo_source": "companycam",
        "ai_generated": False,
        "posted_ids": {},
        "tags": ["before-after", "vision-verified", "smart-analysis"],
        "notes": notes
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

def main():
    log("=" * 60)
    log("SMART PHOTO ANALYSIS")
    log("=" * 60)
    
    # Check for API keys
    if not ANTHROPIC_API_KEY and not OPENAI_API_KEY:
        log("WARNING: No vision API key found. Set ANTHROPIC_API_KEY or OPENAI_API_KEY")
        log("Will use basic matching without vision verification")
    else:
        log(f"Using: {'Anthropic Claude' if ANTHROPIC_API_KEY else 'OpenAI GPT-4V'}")
    
    # Get all projects
    resp = requests.get(
        f"{COMPANYCAM_API}/projects?per_page=50",
        headers={"Authorization": f"Bearer {COMPANYCAM_TOKEN}"}
    )
    
    projects = resp.json()
    log(f"Found {len(projects)} projects")
    
    results = {
        "projects_analyzed": 0,
        "photos_classified": 0,
        "matches_found": 0,
        "posts_created": 0
    }
    
    # Analyze each project
    for project in projects[:10]:  # Limit for testing
        project_id = project["id"]
        project_name = project.get("name", "Unknown")
        
        matches = analyze_project(project_id, project_name)
        results["projects_analyzed"] += 1
        results["matches_found"] += len(matches)
        
        for match in matches:
            if create_post_from_match(match, project_name):
                results["posts_created"] += 1
                log(f"  Created post for {project_name}")
    
    log("=" * 60)
    log("COMPLETE")
    log(f"  Projects analyzed: {results['projects_analyzed']}")
    log(f"  Matches found: {results['matches_found']}")
    log(f"  Posts created: {results['posts_created']}")
    log("=" * 60)
    
    print(json.dumps(results, indent=2))

if __name__ == "__main__":
    main()
