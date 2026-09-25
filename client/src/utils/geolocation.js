/**
 * Robust geolocation fetcher with automatic fallback from high-accuracy GPS to standard network location.
 * Gracefully handles permission denials, timeouts, and non-GPS devices (desktops/laptops).
 */
export const getCurrentCoordinates = (options = {}) => {
  return new Promise((resolve, reject) => {
    if (typeof window === 'undefined' || !navigator.geolocation) {
      return reject(new Error('Geolocation is not supported by your browser.'));
    }

    // Check secure context (Chrome & Safari block geolocation on insecure HTTP)
    if (window.isSecureContext === false && window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1') {
      return reject(
        new Error('Browser geolocation requires HTTPS. Please access via https:// or localhost.')
      );
    }

    const tryGetPosition = (opts, isFallback = false) => {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          resolve({
            lat: Number(position.coords.latitude.toFixed(6)),
            lng: Number(position.coords.longitude.toFixed(6)),
            accuracy: Math.round(position.coords.accuracy),
            isFallback,
          });
        },
        (error) => {
          // If high-accuracy timed out or unavailable, retry with standard network accuracy (common indoors or on laptops)
          if (!isFallback && (error.code === error.TIMEOUT || error.code === error.POSITION_UNAVAILABLE)) {
            console.warn('[Geolocation] High accuracy GPS timed out. Retrying with standard network accuracy...');
            tryGetPosition(
              {
                enableHighAccuracy: false,
                timeout: 12000,
                maximumAge: 60000,
              },
              true
            );
          } else {
            let message = 'Could not determine your location.';
            if (error.code === error.PERMISSION_DENIED) {
              message = 'Location access denied. Please click the tune/lock icon in your browser address bar to allow location permissions.';
            } else if (error.code === error.TIMEOUT) {
              message = 'Location request timed out. Please tap the map to place the pin manually.';
            } else if (error.code === error.POSITION_UNAVAILABLE) {
              message = 'Location is unavailable on this device. Please tap on the map to set coordinates.';
            }
            reject(new Error(message));
          }
        },
        opts
      );
    };

    // First attempt with high accuracy
    tryGetPosition({
      enableHighAccuracy: true,
      timeout: options.timeout || 8000,
      maximumAge: options.maximumAge || 10000,
    });
  });
};

export default getCurrentCoordinates;
