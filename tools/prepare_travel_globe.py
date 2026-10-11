"""Refresh the public travel snapshot and pinned, locally served map assets."""
from datetime import date
import io
import json
import os
from pathlib import Path
import subprocess
import tarfile
from urllib.request import urlopen

ROOT = Path(__file__).resolve().parents[1]
VERSION = "6.14.0"
PROFILE = "https://beeneverywhere.net/user/GeniusYe"
VISITS = "https://beeneverywhere.net/query-visits/GeniusYe"
COUNTRIES = "https://raw.githubusercontent.com/nvkelso/natural-earth-vector/master/geojson/ne_50m_admin_0_countries.geojson"

def download(url):
    if os.name == "nt":
        # Windows curl uses the OS trust store; keep certificate verification on.
        return subprocess.run(["curl.exe", "--fail", "--location", "--silent", "--show-error", url],
                              check=True, stdout=subprocess.PIPE).stdout
    with urlopen(url, timeout=60) as response:
        return response.read()

def save_json(path, value):
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(value, ensure_ascii=False, separators=(",", ":")), encoding="utf-8")

def round_coordinates(value):
    return [round_coordinates(item) for item in value] if isinstance(value, list) else round(value, 4)

def main():
    visits = json.loads(download(VISITS))
    assert visits["type"] == "FeatureCollection"
    points = []
    for feature in visits["features"]:
        geometry = feature["geometry"]
        assert geometry["type"] == "Point"
        lon, lat = geometry["coordinates"]
        assert -180 <= lon <= 180 and -90 <= lat <= 90
        points.append({"type": "Feature", "properties": {}, "geometry": geometry})
    assert len(points) == visits["stats"]["places_visited"]
    save_json(ROOT / "public/assets/globe/visits.geojson", {"type": "FeatureCollection", "features": points})

    countries = json.loads(download(COUNTRIES))
    visited = set(visits["stats"]["unp"])
    features = []
    for feature in countries["features"]:
        properties = feature["properties"]
        code = properties.get("ISO_A2_EH") or properties.get("ISO_A2")
        if code == "-99":
            code = {"KOS": "XK"}.get(properties.get("ADM0_A3"), code)
        features.append({"type": "Feature", "properties": {"name": properties["NAME"], "code": code, "visited": code in visited},
                         "geometry": {"type": feature["geometry"]["type"], "coordinates": round_coordinates(feature["geometry"]["coordinates"])}})
    save_json(ROOT / "public/assets/globe/countries.geojson", {"type": "FeatureCollection", "features": features})
    save_json(ROOT / "docs/travel-globe-source.json", {"snapshotDate": date.today().isoformat(), "profile": PROFILE,
        "pointsSource": VISITS, "pointCount": len(points), "visitedCountryCodes": sorted(visited),
        "boundariesSource": COUNTRIES, "boundariesScale": "1:50m", "maplibreVersion": VERSION})

    vendor = ROOT / "public/vendor/maplibre"
    vendor.mkdir(parents=True, exist_ok=True)
    archive = tarfile.open(fileobj=io.BytesIO(download(f"https://registry.npmjs.org/maplibre-gl/-/maplibre-gl-{VERSION}.tgz")), mode="r:gz")
    for filename in ["dist/maplibre-gl.mjs", "dist/maplibre-gl-worker.mjs", "dist/maplibre-gl.css", "LICENSE.txt"]:
        member = archive.getmember("package/" + filename)
        data = archive.extractfile(member).read()
        (vendor / Path(filename).name).write_bytes(data)
    print(f"Prepared {len(points)} visited places, {len(features)} country boundaries, and MapLibre {VERSION}.")

if __name__ == "__main__":
    main()
