/**
 * Vision Analysis Prompts
 * 
 * These are INTENSIVE prompts designed to extract maximum data from each photo.
 * More expensive per-call, but creates rich dataset for training.
 */

export const FULL_PHOTO_ANALYSIS_PROMPT = `You are an expert analyst for a landscaping and outdoor services company. Analyze this job site photo with EXTREME detail.

## SECTION 1: PHOTO METADATA
- Photo type: [job_site | equipment | crew | document | receipt | other]
- Time of day: [morning | midday | afternoon | evening | night]
- Weather visible: [sunny | cloudy | overcast | rainy | snowy | unclear]
- Season indicators: [spring | summer | fall | winter | unclear]

## SECTION 2: PROPERTY IDENTIFICATION
### Structure Details
- Primary building:
  - Type: [house | apartment | commercial | industrial | other]
  - Stories: [1 | 2 | 3+]
  - Exterior material: [brick | siding | stucco | stone | wood | mixed]
  - Exterior color(s): [list primary and accent colors]
  - Roof type: [shingle | metal | tile | flat]
  - Roof color: 
  - Notable features: [list: garage, carport, porch, deck, columns, shutters, etc.]

### Permanent Landmarks (for matching)
- Fence: [none | wood_privacy | wood_picket | chain_link | iron | vinyl | stone]
  - Fence color/condition:
  - Fence location in frame: [left | right | back | front | multiple]
- Trees (list each):
  - Type: [pine | oak | maple | palm | crepe_myrtle | magnolia | other]
  - Position in frame: [left_foreground | left_background | center | right_foreground | right_background]
  - Distinctive features: [tall | short | multi-trunk | leaning | dead | trimmed]
- Driveway: [concrete | asphalt | gravel | pavers | none_visible]
- Other permanent features: [shed | pool | deck | patio | gazebo | trampoline | playground | etc.]

## SECTION 3: WORK STATUS CLASSIFICATION
- Overall status: [before | during | after | unclear]
- Confidence: [0.0-1.0]

### If BEFORE:
- Problem areas (list each):
  - Location: [front_lawn | back_lawn | side_yard | driveway | walkway | beds | fence_line | roof | gutters | deck | patio]
  - Problem type: [overgrown | debris | leaves | weeds | stains | damage | clutter | dead_plants]
  - Severity: [minor | moderate | severe]
  - Suggested service: [mowing | edging | leaf_removal | pressure_washing | bed_cleanup | debris_hauling | trimming | etc.]

### If AFTER:
- Completed work visible:
  - Location:
  - Work type:
  - Quality assessment: [excellent | good | acceptable | needs_touch_up]
- Areas still needing work: [list any or "none"]

## SECTION 4: CAMERA POSITION
- View direction: [front_of_house | back_of_house | left_side | right_side | street_view | aerial | interior]
- Distance from subject: [close_up | medium | wide_shot | very_wide]
- Height: [ground_level | eye_level | elevated | drone]
- Angle: [straight_on | angled_left | angled_right | corner_shot]

## SECTION 5: MATCHING FINGERPRINT
Create a unique fingerprint for matching this to other photos of the same property/angle:
- Primary identifiers: [list 3-5 most distinctive permanent features]
- Secondary identifiers: [list 3-5 additional matching features]
- Estimated GPS quadrant of property shown: [NE | NW | SE | SW | center]

## SECTION 6: SOCIAL MEDIA POTENTIAL
- Postable as-is: [yes | no | needs_editing]
- Best use: [before_photo | after_photo | transformation_pair | crew_spotlight | equipment | not_recommended]
- Composition quality: [excellent | good | fair | poor]
- Issues: [blurry | dark | cluttered | logo_visible | faces_visible | address_visible | none]
- Suggested crop: [none | left | right | top | bottom | center_focus]

## SECTION 7: CONTENT SUGGESTIONS
- Caption ideas (if postable): [list 2-3 short caption options, NO EMOJIS]
- Hashtag suggestions: [list 5-8 relevant local/industry hashtags]
- Best platform: [instagram_feed | instagram_reels | facebook | nextdoor | all]

Respond in valid JSON format with all sections.`;

export const PAIR_COMPARISON_PROMPT = `You are comparing two photos from a landscaping job to determine if they are a valid BEFORE/AFTER pair.

PHOTO 1: {photo1_url}
PHOTO 2: {photo2_url}

Analyze with EXTREME detail:

## SECTION 1: LOCATION MATCH
- Same property: [yes | no | uncertain]
- Confidence: [0.0-1.0]
- Matching evidence:
  - House matches: [yes | no | not_visible_in_both]
  - Fence matches: [yes | no | not_visible_in_both]
  - Trees match: [yes | no | not_visible_in_both]
  - Driveway matches: [yes | no | not_visible_in_both]
  - Other matching features: [list]
- Conflicting evidence: [list any features that DON'T match]

## SECTION 2: ANGLE MATCH
- Same camera angle: [yes | similar | different | opposite]
- Angle difference description:
- Can see same area of property: [yes | partially | no]

## SECTION 3: CHANGE DETECTION
- Change detected: [yes | no | uncertain]
- Change location: [front_lawn | back_lawn | beds | driveway | etc.]
- Photo 1 condition: [describe specific area]
- Photo 2 condition: [describe same area]
- Type of change: [debris_removed | lawn_mowed | pressure_washed | trimmed | planted | cleaned | etc.]
- Change is positive (improvement): [yes | no | lateral]

## SECTION 4: TEMPORAL ORDER
- Which photo is BEFORE: [photo1 | photo2 | unclear | same_time]
- Confidence: [0.0-1.0]
- Evidence for ordering:
  - Work debris visible: [photo1 | photo2 | neither | both]
  - Equipment/crew visible: [photo1 | photo2 | neither | both]
  - Condition progression: [describe]

## SECTION 5: PAIR VALIDATION
- Valid before/after pair: [yes | no]
- Confidence: [0.0-1.0]
- If NO, rejection reason: [different_property | different_angle | no_visible_change | same_condition | wrong_order | both_before | both_after | insufficient_data]
- If YES:
  - Before photo: [photo1 | photo2]
  - After photo: [photo1 | photo2]
  - Transformation type: [describe the work]
  - Social media worthy: [yes | no | maybe]
  - Suggested caption: [one line, NO EMOJIS]

## SECTION 6: QUALITY ASSESSMENT
- Before photo quality: [excellent | good | fair | poor]
- After photo quality: [excellent | good | fair | poor]
- Transformation impact (how dramatic): [dramatic | noticeable | subtle | minimal]
- Recommended: [post_both | post_only_after | skip | needs_different_pair]

Respond in valid JSON format.`;

export const BATCH_GROUPING_PROMPT = `You are analyzing a set of photos from the same landscaping project to group them by location/angle and identify before/after pairs.

Photos to analyze:
{photos_list}

For each photo, identify:
1. Which area of the property it shows
2. The camera angle/position
3. The work status (before/during/after)

Then group photos that show the SAME view and identify valid pairs.

Respond in JSON:
{
  "groups": [
    {
      "group_id": "front_yard_straight",
      "description": "Front yard, straight-on view from street",
      "photos": ["id1", "id2", "id3"],
      "has_before": true,
      "has_after": true,
      "best_pair": {
        "before_id": "id1",
        "after_id": "id3",
        "confidence": 0.9,
        "transformation": "Leaf removal and lawn cleanup"
      }
    }
  ],
  "unpaired_photos": [
    {
      "id": "id5",
      "reason": "Only after shot of backyard, no matching before"
    }
  ],
  "recommendations": [
    "Group 1 has a strong before/after pair suitable for posting",
    "Backyard needs a before photo for future jobs"
  ]
}`;

// Cost estimate: ~$0.05-0.10 per photo for full analysis
// But extracts 10x more data than cheap prompts
