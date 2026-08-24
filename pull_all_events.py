
"""
FOMO1700 - COMPLETE ALL CATEGORIES PULLER
Pulls EVERYTHING: restaurants, bars, cafes, fast_food, sports, DJ, kids, teens, young adults, food specials, pets
FREE - 300+ venues/events
"""
import json, requests, random, math
from datetime import datetime

GQEBERHA_LAT = -33.9608
GQEBERHA_LNG = 25.6022
RADIUS = 30000
OVERPASS_URL = "https://overpass-api.de/api/interpreter"

def get_real_image(cat, idx):
    maps = {
        "RESTAURANT": ["https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=600&h=400&fit=crop"],
        "BAR": ["https://images.unsplash.com/photo-1470337458703-46ad1756a187?w=600&h=400&fit=crop"],
        "CAFE": ["https://images.unsplash.com/photo-1554118811-8398f3c0f31d?w=600&h=400&fit=crop"],
        "FAST_FOOD": ["https://images.unsplash.com/photo-1568909344668-6f14a07b56a0?w=600&h=400&fit=crop"],
        "DJ": ["https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=600&h=400&fit=crop"],
        "SPORTS": ["https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=600&h=400&fit=crop"],
        "KIDS": ["https://images.unsplash.com/photo-1596464716127-f2a82984de30?w=600&h=400&fit=crop"],
        "TEENS": ["https://images.unsplash.com/photo-1529156069898-49953e39b3ac?w=600&h=400&fit=crop"],
        "YOUNG_ADULTS": ["https://images.unsplash.com/photo-1529156069898-49953e39b3ac?w=600&h=400&fit=crop"],
        "FOOD_SPECIAL": ["https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=600&h=400&fit=crop"],
        "PETS": ["https://images.unsplash.com/photo-1558788353-6fc6f73e2838?w=600&h=400&fit=crop"],
    }
    base = maps.get(cat, maps["RESTAURANT"])[0]
    return f"{base}&sig={idx}"

def query_overpass():
    q = f'[out:json][timeout:90];(node["amenity"~"^(restaurant|bar|pub|cafe|fast_food|nightclub|biergarten)$"](around:{RADIUS},{GQEBERHA_LAT},{GQEBERHA_LNG});way["amenity"~"^(restaurant|bar|pub|cafe|fast_food|nightclub)$"](around:{RADIUS},{GQEBERHA_LAT},{GQEBERHA_LNG}););out center 500;'
    try:
        r=requests.post(OVERPASS_URL,data={"data":q},timeout=60)
        r.raise_for_status()
        return r.json().get('elements',[])
    except:
        return []

def main():
    els=query_overpass()
    print(f"OSM live: {len(els)} venues")
    # Load comprehensive fallback (300+)
    try:
        with open("events_COMPLETE_ALL_300.json","r") as f:
            fallback=json.load(f)
    except:
        fallback=[]
    if els:
        # Convert OSM live to format
        venues=[]
        for idx,el in enumerate(els):
            tags=el.get("tags",{})
            name=tags.get("name")
            if not name: continue
            amenity=tags.get("amenity","restaurant")
            cat="FAST_FOOD" if amenity=="fast_food" else "BAR" if amenity in ["bar","pub"] else "CAFE" if amenity=="cafe" else "RESTAURANT"
            venues.append({
                "id": f"osm-live-{el.get('id',idx)}",
                "title": name,
                "venue": name,
                "area": "Gqeberha",
                "category": cat,
                "type": "venue",
                "source": "OpenStreetMap",
                "badge": "LIVE",
                "schedule": "Open evenings",
                "description": f"Live venue from OSM",
                "lat": el.get("lat") or el.get("center",{}).get("lat") or GQEBERHA_LAT,
                "lng": el.get("lon") or el.get("center",{}).get("lon") or GQEBERHA_LNG,
                "distance": "0.5 km",
                "image": get_real_image(cat, idx),
                "background_image": get_real_image(cat, idx),
                "address": "Gqeberha"
            })
        # Merge live + fallback events (keep all categories from fallback)
        fallback_non_osm=[e for e in fallback if e.get("category") not in ["RESTAURANT","BAR","CAFE","FAST_FOOD"]]
        merged=venues[:300]+fallback_non_osm
    else:
        merged=fallback
    print(f"Saving {len(merged)} total (all categories)")
    with open("events.json","w") as f:
        json.dump(merged,f,indent=2)

if __name__=="__main__":
    main()
