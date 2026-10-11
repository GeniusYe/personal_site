/* A locally served globe using the owner's public BeenEverywhere snapshot. */
(() => {
  const container = document.querySelector("#travel-globe");
  const fallback = document.querySelector("#globe-fallback");
  const controls = document.querySelector("#globe-controls");
  const hint = document.querySelector("#globe-hint");
  const config = window.JIAJIE_SITE?.travel?.map;
  if (!container || !config) return;
  let started = false;

  async function initialize() {
    if (started) return;
    started = true;
    let map;
    function showFallback() {
      container.hidden = true;
      fallback.hidden = false;
      controls.hidden = true;
      hint.textContent = "Explore the map on BeenEverywhere.";
    }
    try {
      const { Map, NavigationControl, setWorkerUrl } = await import("./vendor/maplibre/maplibre-gl.mjs");
      setWorkerUrl(new URL("./vendor/maplibre/maplibre-gl-worker.mjs", location.href).href);
      container.hidden = false;
      const initial = { center: [30, 15], zoom: container.clientWidth < 480 ? 1.05 : 1.4, bearing: 0, pitch: 0 };
      map = new Map({
        container, ...initial, minZoom: 0.2, maxZoom: 5, maxPitch: 0,
        canvasContextAttributes: { antialias: true },
        attributionControl: { compact: true, customAttribution: '<a href="https://beeneverywhere.net/user/GeniusYe" target="_blank" rel="noopener noreferrer">BeenEverywhere</a> · <a href="https://www.naturalearthdata.com/" target="_blank" rel="noopener noreferrer">Natural Earth</a>' },
        style: {
          version: 8, projection: { type: "globe" },
          sources: {
            countries: { type: "geojson", data: config.countries, attribution: "" },
            visits: { type: "geojson", data: config.visits }
          },
          layers: [
            { id: "ocean", type: "background", paint: { "background-color": "#a8d2de" } },
            { id: "countries", type: "fill", source: "countries", paint: {
              "fill-color": ["case", ["get", "visited"], "#f5d7b8", "#efede7"], "fill-opacity": 1
            } },
            { id: "borders", type: "line", source: "countries", paint: { "line-color": "#ae8caa", "line-width": 0.6, "line-opacity": 0.8 } },
            { id: "visit-glow", type: "circle", source: "visits", paint: {
              "circle-radius": ["interpolate", ["linear"], ["zoom"], 0, 5, 5, 12],
              "circle-color": "#ffbc54", "circle-opacity": 0.65, "circle-blur": 0.55
            } },
            { id: "visited-places", type: "circle", source: "visits", paint: {
              "circle-radius": ["interpolate", ["linear"], ["zoom"], 0, 1.6, 5, 4],
              "circle-color": "#f7883e", "circle-stroke-color": "#fff2ce", "circle-stroke-width": 1.2
            } }
          ]
        }
      });
      // Wheel scrolling keeps moving the page; buttons and pinch gestures zoom.
      map.scrollZoom.disable();
      map.dragRotate.disable();
      map.addControl(new NavigationControl({ showCompass: false }), "top-right");
      map.getCanvas().setAttribute("aria-label", "Interactive globe of JiaJie's visited places. Drag or use the arrow keys to rotate; use plus and minus to zoom.");
      map.once("load", () => {
        fallback.hidden = true;
        controls.hidden = false;
        container.dataset.globeReady = "true";
      });
      map.on("error", event => {
        console.warn("Travel globe:", event.error?.message || "Map data could not load.");
        if (container.dataset.globeReady !== "true") showFallback();
      });
      const regions = [
        { id: "globe-americas", center: [-90, 15] },
        { id: "globe-europe-africa", center: [15, 20] },
        { id: "globe-asia", center: [100, 25] }
      ];
      regions.forEach(region => {
        document.getElementById(region.id).addEventListener("click", () => {
          map.easeTo({ ...initial, center: region.center, duration: 700 });
        });
      });
      window.addEventListener("pagehide", event => { if (!event.persisted) map.remove(); }, { once: true });
    } catch (error) {
      console.warn("Travel globe:", error.message);
      map?.remove();
      showFallback();
    }
  }
  if ("IntersectionObserver" in window) {
    const observer = new IntersectionObserver(entries => {
      if (entries.some(entry => entry.isIntersecting)) { observer.disconnect(); initialize(); }
    }, { rootMargin: "300px" });
    observer.observe(container.parentElement);
  } else initialize();
})();
