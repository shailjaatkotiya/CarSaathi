import { navigationApi } from "../api/navigation";

// Loads the Google Maps JavaScript API exactly once and resolves with the
// global `google` namespace. The API key + locale come from the backend
// /navigation/map-config endpoint, so no key is hard-coded in the bundle.
//
// We keep the typing loose (`any`) to avoid pulling in @types/google.maps.

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type GoogleNs = any;

declare global {
  interface Window {
    google?: GoogleNs;
  }
}

let loadPromise: Promise<GoogleNs> | null = null;

export function loadGoogleMaps(): Promise<GoogleNs> {
  if (typeof window !== "undefined" && window.google?.maps) {
    return Promise.resolve(window.google);
  }
  if (loadPromise) return loadPromise;

  loadPromise = (async () => {
    const cfg = await navigationApi.mapConfig();
    return new Promise<GoogleNs>((resolve, reject) => {
      const params = new URLSearchParams({
        key: cfg.api_key,
        language: cfg.language || "en",
        region: (cfg.region || "in").toUpperCase(),
        libraries: "marker"
      });
      const script = document.createElement("script");
      script.src = `https://maps.googleapis.com/maps/api/js?${params.toString()}`;
      script.async = true;
      script.defer = true;
      script.onload = () => {
        if (window.google?.maps) resolve(window.google);
        else reject(new Error("Google Maps failed to initialise"));
      };
      script.onerror = () => {
        loadPromise = null;
        reject(new Error("Failed to load Google Maps"));
      };
      document.head.appendChild(script);
    });
  })();

  return loadPromise;
}
