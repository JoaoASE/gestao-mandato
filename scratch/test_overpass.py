import urllib.request
import json

query = """
[out:json][timeout:25];
area["name"="Uberlândia"]["admin_level"="8"]->.a;
(
  relation["admin_level"="10"](area.a);
  way["admin_level"="10"](area.a);
);
out geom;
"""

url = "https://overpass-api.de/api/interpreter"
data = query.encode("utf-8")

req = urllib.request.Request(url, data=data)
try:
    with urllib.request.urlopen(req) as response:
        res = json.loads(response.read().decode('utf-8'))
        elements = res.get('elements', [])
        names = [e.get('tags', {}).get('name') for e in elements if 'tags' in e and 'name' in e['tags']]
        print(f"Found {len(elements)} elements")
        print("Sample names:", names[:10])
except Exception as e:
    print(e)
