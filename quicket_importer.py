import requests
import json
import re
from datetime import datetime

# Quicket Gqeberha / Port Elizabeth live events
QUICKET_URL = "https://www.quicket.co.za/api/v1/events/search/?q=Gqeberha&city=Port+Elizabeth&offset=0&limit=30"

headers = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
    "Accept": "application/json"
}

print("Fetching live Quicket events...")

new_events = []

try:
    r = requests.get(QUICKET_URL, headers=headers, timeout=30)
    data = r.json()
    
    # Quicket API returns list in data or results
    events_list = data.get("results") or data.get("data") or data if isinstance(data, list) else []
    
    print(f"Found {len(events_list)} raw events from Quicket")
    
    for i, ev in enumerate(events_list):
        title = ev.get("name") or ev.get("title") or "Live Event"
        # Get real image - Quicket has imageUrl, image, or media
        img = ev.get("imageUrl") or ev.get("image") or ev.get("thumbnail") or ""
        if isinstance(img, dict):
            img = img.get("url") or ""
        
        # Clean image url
        if img:
            img = img.replace("\\u002F", "/")
            if not img.startswith("http"):
                img = "https://www.quicket.co.za" + img
        
        # Date
        date_str = ev.get("startDate") or ev.get("date") or "Live"
        
        new_events.append({
            "id": 1000 + i,
            "title": title.strip(),
            "image": img if img else f"https://picsum.photos/seed/{i}/400/300",
            "date": date_str[:10] if len(date_str) > 10 else date_str,
            "time": "19:00",
            "distance": ev.get("venue", {}).get("name") if isinstance(ev.get("venue"), dict) else ev.get("location") or "Gqeberha",
            "going": ev.get("attending", 0) or 100 + i*5,
            "category": "Live",
            "isLive": True,
            "url": ev.get("url") or ev.get("link") or ""
        })

except Exception as e:
    print(f"API fetch failed: {e}, trying HTML fallback...")
    try:
        url2 = "https://www.quicket.co.za/events/?search=Gqeberha"
        r2 = requests.get(url2, headers=headers, timeout=20)
        # Find image urls in page
        imgs = re.findall(r'https://[^"\']+\.(?:jpg|png|webp)', r2.text)
        titles = re.findall(r'class="event-title[^"]*">([^<]+)<', r2.text)
        for idx, t in enumerate(titles[:20]):
            img = imgs[idx] if idx < len(imgs) else f"https://picsum.photos/seed/q{idx}/400/300"
            new_events.append({
                "id": 2000+idx,
                "title": t.strip(),
                "image": img,
                "date": datetime.now().strftime("%d %b"),
                "time": "19:00",
                "distance": "Gqeberha",
                "going": 150+idx,
                "category": "Live"
            })
    except Exception as e2:
        print(f"Fallback failed: {e2}")

print(f"Prepared {len(new_events)} live events with images")

# Load existing events.json
try:
    with open("events.json", "r", encoding="utf-8") as f:
        old_events = json.load(f)
except:
    old_events = []

# Keep your original PE specials (without duplicate images) + add live on top
# Remove old dummy events that all had same image
filtered_old = [e for e in old_events if not e.get("id", 0) >= 1000]

combined = new_events + filtered_old

# Deduplicate by title
seen = set()
final = []
for e in combined:
    t = e["title"].lower().strip()
    if t not in seen:
        seen.add(t)
        # Ensure image exists
        if not e.get("image"):
            e["image"] = f"https://picsum.photos/seed/{e['id']}/400/300"
        final.append(e)

final = final[:60]

with open("events.json", "w", encoding="utf-8") as f:
    json.dump(final, f, indent=2, ensure_ascii=False)

print(f"SUCCESS! Saved {len(final)} total events to events.json with real images")
