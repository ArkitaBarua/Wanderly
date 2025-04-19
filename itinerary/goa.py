import requests
from collections import Counter

API_KEY = "5ae2e3f221c38a28845f05b60c81cca32e4b24bb77c46e7c33636c2a"

# Goa Coordinates
LON_MIN, LAT_MIN = 73.7, 15.3  
LON_MAX, LAT_MAX = 74.1, 15.6  

# Majority Preferences (Simulated User Poll)
majority_preferences = {
    "preference": "beaches",
    "bars": "yes",
    "nature": "yes",
    "food": "seafood",
    "adventure_sports": "yes"
}

# OpenTripMap 'kinds' Mapping
kinds_mapping = {
    "beaches": "beaches",
    "churches": "churches",
    "nature": "natural,waterfalls,parks",
    "bars": "bars,pubs",
    "adventure_sports": "sport,diving,paragliding"
}

# **Step 1: Test each kind separately and collect valid places**
valid_places = []
for key, kind in kinds_mapping.items():
    url = f"http://api.opentripmap.com/0.1/en/places/bbox?lon_min={LON_MIN}&lat_min={LAT_MIN}&lon_max={LON_MAX}&lat_max={LAT_MAX}&kinds={kind}&format=geojson&apikey={API_KEY}"
    response = requests.get(url)
    data = response.json()

    if "features" in data and len(data["features"]) > 0:
        for place in data["features"]:
            name = place["properties"].get("name", "Unknown Place")
            kinds = place["properties"]["kinds"]
            valid_places.append((name, kinds))

# **Step 2: Display final output in short format**
print("\n🔹 Suggested Places Based on Group Preferences:")
for name, kinds in valid_places[:10]:  # Limit output to 10 places for readability
    print(f"📍 {name} ({kinds})")
