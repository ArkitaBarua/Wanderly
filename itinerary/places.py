import requests

API_KEY = "5ae2e3f221c38a28845f05b60c81cca32e4b24bb77c46e7c33636c2a"

# Goa Coordinates (Can be adjusted)
LON_MIN, LAT_MIN = 73.7, 15.3  # South Goa
LON_MAX, LAT_MAX = 74.1, 15.6  # North Goa
KINDS = "beaches"  # Change this to "museums", "hotels", etc.

url = f"http://api.opentripmap.com/0.1/en/places/bbox?lon_min={LON_MIN}&lat_min={LAT_MIN}&lon_max={LON_MAX}&lat_max={LAT_MAX}&kinds={KINDS}&format=geojson&apikey={API_KEY}"

response = requests.get(url)
data = response.json()

# Print place names
for place in data.get("features", []):
    print(place["properties"]['name'])
