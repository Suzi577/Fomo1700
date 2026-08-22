import requests, json, os, re
from datetime import datetime

# Load existing events to keep custom ones
existing_events = []
if os.path.exists("events.json"):
    try:
        with open("events.json") as f:
            existing_events = json.load(f)
    except:
        existing_events = []

# Keep only custom PE events that are not from Quicket (to avoid duplicates)
# We'll keep IDs that don't start with quicket-
base_events = [e for e in existing_events if not str(e.get("id","")).startswith("quicket-")]

# Category detection
def detect_category(name, desc=""):
    text = f"{name} {desc}".lower()
    if any(k in text for k in ["run", "marathon", "parkrun", "yoga", "hike", "mtb", "cycle", "swim", "surf", "gym", "fitness", "soccer", "rugby", "cricket", "trail"]):
        return "sports"
    if any(k in text for k in ["art", "gallery", "exhibition", "paint", "craft", "museum"]):
        return "art"
    if any(k in text for k in ["market", "festival", "carnival", "food fest"]):
        return "festivals"
    if any(k in text for k in ["food", "burger", "pizza", "sushi", "braai", "restaurant", "tasting", "wine", "beer yard", "barney"]):
        return "food"
    if any(k in text for k in ["beach", "outdoor", "nature", "park", "cleanup", "camp", "picnic", "bay", "sardinia"]):
        return "outdoors"
    if any(k in text for k in ["kids", "family", "christmas", "easter", "carnival", "kids", "children"]):
        return "family"
    if any(k in text for k in ["party", "dj", "club", "night", "lounge", "bar", "cocktail", "nye", "halloween"]):
        return "nightlife"
    if any(k in text for k in ["music", "concert", "live", "band", "festival"]):
        return "music"
    return "festivals"

def fetch_quicket_pe():
    all_events = []
    # Quicket public search endpoint - fetch pages for PE / Gqeberha / Eastern Cape
    # Try official API v1 and fallback to search page scraping via API
    urls = [
        "https://api.quicket.co.za/api/v1/events?city=Gqeberha",
        "https://api.quicket.co.za/api/v1/events?city=Port%20Elizabeth",
        "https://api.quicket.co.za/api/v1/events?region=Eastern%20Cape",
        "https://www.quicket.co.za/api/events?search=Gqeberha",
    ]
    
    for url in urls:
        try:
            print(f"Trying {url}")
            r = requests.get(url, timeout=20, headers={"User-Agent":"Fomo1700/1.0"})
            if r.status_code != 200:
                continue
            data = r.json()
            # Handle different response shapes
            events = []
            if isinstance(data, dict):
                if "data" in data:
                    events = data["data"]
                elif "events" in data:
                    events = data["events"]
                elif "results" in data:
                    events = data["results"]
                else:
                    events = [data]
            elif isinstance(data, list):
                events = data
            
            for ev in events:
                if not isinstance(ev, dict):
                    continue
                # Filter for PE / Gqeberha
                loc = f"{ev.get('venue','')} {ev.get('city','')} {ev.get('region','')} {ev.get('location','')}".lower()
                name = ev.get("name") or ev.get("title") or ev.get("eventName") or ""
                if not name:
                    continue
                # Keep if PE related or if we got city-filtered endpoint
                if "gqeberha" in url.lower() or "port elizabeth" in url.lower() or "eastern cape" in loc or "gqeberha" in loc or "port elizabeth" in loc or "pe " in loc or " nelson mandela bay" in loc or True:
                    # Build standardized event
                    start = ev.get("startDate") or ev.get("date") or ev.get("eventDate") or datetime.now().isoformat()
                    try:
                        # Parse date
                        dt = datetime.fromisoformat(str(start).replace("Z","+00:00"))
                        iso = dt.isoformat()
                    except:
                        iso = str(start)
                    
                    title = name.strip()
                    eid = f"quicket-{ev.get('id') or ev.get('eventId') or re.sub('[^a-z0-9]+','-', title.lower())}"
                    venue = ev.get("venueName") or ev.get("venue") or ev.get("location") or "Port Elizabeth"
                    image = ev.get("imageUrl") or ev.get("image") or ev.get("bannerUrl") or f"https://images.unsplash.com/photo-1516450360452-9312abbf6f7e?w=600"
                    link = ev.get("url") or f"https://www.quicket.co.za/events/{ev.get('id','')}/"
                    
                    all_events.append({
                        "id": eid,
                        "name": title,
                        "title": title,
                        "category": detect_category(title, ev.get("description","")),
                        "start_time": iso,
                        "place": venue,
                        "location": venue,
                        "image_url": image,
                        "image": image,
                        "going": ev.get("attendees", 50),
                        "distance_km": 1.5,
                        "source": "quicket",
                        "link": link
                    })
            if all_events:
                print(f"Found {len(all_events)} from {url}")
                # If we got good PE filtered results, break
                if "gqeberha" in url.lower() or "port elizabeth" in url.lower():
                    break
        except Exception as e:
            print(f"Failed {url}: {e}")
            continue
    
    return all_events

quicket_events = fetch_quicket_pe()
print(f"Total Quicket fetched: {len(quicket_events)}")

# Deduplicate by ID
seen = set()
final = []
for e in base_events + quicket_events:
    eid = e.get("id")
    if eid in seen:
        continue
    seen.add(eid)
    final.append(e)

# Sort by start_time
def sort_key(e):
    try:
        return datetime.fromisoformat(e.get("start_time","").replace("Z","+00:00"))
    except:
        return datetime.max

final.sort(key=sort_key)

with open("events.json","w") as f:
    json.dump(final, f, indent=2)

print(f"Wrote {len(final)} events to events.json")
print(f"Base kept: {len(base_events)}, Quicket added: {len(quicket_events)}")
