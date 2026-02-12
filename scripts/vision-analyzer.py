#!/usr/bin/env python3
"""
Vision Analyzer for CompanyCam Photos
Uses OpenAI/Anthropic vision to analyze photos and generate:
- Scene classification (before/after/during/crew/equipment)
- Quality score (1-10)
- Service type detection
- Caption suggestions
- Social media worthiness
"""

import os
import sys
import json
import base64
import requests
from datetime import datetime

# Get photo from CompanyCam and analyze it
COMPANYCAM_TOKEN = os.environ.get("COMPANYCAM_TOKEN", "")
COMPANYCAM_API = "https://api.companycam.com/v2"
SUPABASE_URL = os.environ.get("SUPABASE_URL", "")
SUPABASE_KEY = os.environ.get("SUPABASE_SERVICE_ROLE_KEY", "")

def log(msg: str):
    print(f"[{datetime.now().strftime('%Y-%m-%d %H:%M:%S')}] {msg}")

def cc_headers():
    return {"Authorization": f"Bearer {COMPANYCAM_TOKEN}"}

def supabase_headers():
    return {
        "apikey": SUPABASE_KEY,
        "Authorization": f"Bearer {SUPABASE_KEY}",
        "Content-Type": "application/json"
    }

def get_recent_photos(limit: int = 20) -> list:
    """Get most recent photos"""
    url = f"{COMPANYCAM_API}/photos"
    params = {"per_page": limit, "sort": "created_at"}
    resp = requests.get(url, headers=cc_headers(), params=params)
    resp.raise_for_status()
    return resp.json()

def get_photo_comments(photo_id: str) -> list:
    """Get comments on a photo"""
    url = f"{COMPANYCAM_API}/photos/{photo_id}/comments"
    resp = requests.get(url, headers=cc_headers())
    resp.raise_for_status()
    return resp.json()

def add_photo_comment(photo_id: str, comment: str):
    """Add AI analysis comment to photo"""
    url = f"{COMPANYCAM_API}/photos/{photo_id}/comments"
    resp = requests.post(url, headers=cc_headers(), json={"comment": {"content": comment}})
    resp.raise_for_status()
    return resp.json()

def has_ai_comment(photo_id: str) -> bool:
    """Check if photo already has AI analysis"""
    comments = get_photo_comments(photo_id)
    return any(c.get("content", "").startswith("[AI]") for c in comments)

def get_project_info(project_id: str) -> dict:
    """Get project details"""
    url = f"{COMPANYCAM_API}/projects/{project_id}"
    resp = requests.get(url, headers=cc_headers())
    resp.raise_for_status()
    return resp.json()

def create_analysis_prompt() -> str:
    """Prompt for vision analysis"""
    return """Analyze this landscaping/outdoor service photo. Respond in this exact JSON format:

{
  "scene": "before|after|during|crew|equipment|property|other",
  "stage": "description of work stage (e.g., 'Before service - overgrown lawn', 'After mowing - clean lines')",
  "services": ["list", "of", "visible", "services"],
  "quality": 7,
  "social_worthy": true,
  "composition": "good|average|poor",
  "caption_idea": "Short caption idea for Instagram",
  "best_platforms": ["instagram", "facebook"],
  "has_people": false,
  "transformation_potential": "high|medium|low|none"
}

Services to detect: lawn mowing, edging, leaf removal, mulching, bed maintenance, tree trimming, brush removal, pressure washing, christmas lights, debris cleanup, landscaping install

Quality factors (1-10):
- Clarity/focus
- Composition  
- Shows transformation clearly
- Good lighting
- Interesting angle

Social worthy = quality >= 6 AND (shows clear transformation OR crew action OR satisfying result)

Be concise. JSON only, no explanation."""

def analyze_with_openai(photo_url: str) -> dict:
    """Analyze photo using OpenAI Vision API"""
    # This would call OpenAI API directly
    # For now, return format that OpenClaw will fill in
    return {"needs_openclaw_analysis": True, "url": photo_url}

def create_post_from_analysis(photo: dict, analysis: dict, project: dict = None):
    """Create a Content Command post from analysis"""
    
    # Get photo URL
    photo_url = None
    for uri in photo.get("uris", []):
        if uri.get("type") == "original":
            photo_url = uri.get("uri")
            break
    
    if not photo_url:
        return None
    
    # Only create posts for social-worthy photos
    if not analysis.get("social_worthy", False):
        return None
    
    # Determine platforms
    platforms = analysis.get("best_platforms", ["instagram", "facebook"])
    
    # Build caption
    caption = analysis.get("caption_idea", "")
    if not caption:
        scene = analysis.get("scene", "")
        if scene == "before":
            caption = "Before we got started."
        elif scene == "after":
            caption = "The finished result."
        elif scene == "during":
            caption = "Work in progress."
        elif scene == "crew":
            caption = "The team putting in work."
    
    # Create post
    url = f"{SUPABASE_URL}/rest/v1/cc_posts"
    data = {
        "content": caption,
        "platforms": platforms,
        "status": "idea",
        "photo_urls": [photo_url],
        "photo_source": "companycam",
        "ai_generated": False,
        "posted_ids": {},
        "tags": analysis.get("services", []) + [analysis.get("scene", "")],
        "notes": f"Auto-analyzed. Scene: {analysis.get('scene')}. Quality: {analysis.get('quality')}/10. Project: {project.get('name') if project else 'Unknown'}"
    }
    
    resp = requests.post(url, headers=supabase_headers(), json=data)
    resp.raise_for_status()
    return resp.json()

def format_ai_comment(analysis: dict) -> str:
    """Format analysis as CompanyCam comment"""
    scene = analysis.get("scene", "unknown")
    stage = analysis.get("stage", "")
    services = ", ".join(analysis.get("services", []))
    quality = analysis.get("quality", 5)
    caption = analysis.get("caption_idea", "")
    social = "Yes" if analysis.get("social_worthy") else "No"
    
    return f"[AI] {scene.title()} | {stage} | Services: {services} | Quality: {quality}/10 | Social-worthy: {social} | Caption: {caption}"

def main():
    """Output photos that need analysis for OpenClaw to process"""
    log("Scanning for photos needing analysis...")
    
    photos = get_recent_photos(20)
    needs_analysis = []
    
    for photo in photos:
        photo_id = photo.get("id")
        if not has_ai_comment(photo_id):
            # Get photo URL
            photo_url = None
            for uri in photo.get("uris", []):
                if uri.get("type") == "original":
                    photo_url = uri.get("uri")
                    break
            
            if photo_url:
                needs_analysis.append({
                    "id": photo_id,
                    "url": photo_url,
                    "project_id": photo.get("project_id")
                })
    
    log(f"Found {len(needs_analysis)} photos needing analysis")
    
    # Output for OpenClaw to process
    print(json.dumps({
        "photos_needing_analysis": needs_analysis,
        "analysis_prompt": create_analysis_prompt()
    }, indent=2))

if __name__ == "__main__":
    main()
