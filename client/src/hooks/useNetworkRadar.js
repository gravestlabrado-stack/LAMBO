import { useState, useEffect, useCallback, useRef } from 'react';

/**
 * Hook for managing real-time network connectivity and tactical radar status
 */
export function useNetworkRadar() {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [isChecking, setIsChecking] = useState(false);
  const [latencyMs, setLatencyMs] = useState(null);
  const [dbStatus, setDbStatus] = useState('idle'); // 'idle' | 'active' | 'syncing'
  const intervalRef = useRef(null);

  const checkConnection = useCallback(async () => {
    if (!navigator.onLine) {
      setIsOnline(false);
      setLatencyMs(null);
      return false;
    }

    setIsChecking(true);
    const start = performance.now();
    try {
      // Lightweight cache-busted ping to check genuine Internet reachability
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 4000);

      const res = await fetch('/api/trees/stats?_ping=' + Date.now(), {
        method: 'HEAD',
        signal: controller.signal,
        headers: { 'Cache-Control': 'no-cache' },
      }).catch(() => null);

      clearTimeout(timeoutId);
      const duration = Math.round(performance.now() - start);

      if (res && (res.ok || res.status === 401)) {
        setIsOnline(true);
        setLatencyMs(duration);
        return true;
      } else {
        setIsOnline(false);
        setLatencyMs(null);
        return false;
      }
    } catch {
      setIsOnline(false);
      setLatencyMs(null);
      return false;
    } finally {
      setIsChecking(false);
    }
  }, []);

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      checkConnection();
    };

    const handleOffline = () => {
      setIsOnline(false);
      setLatencyMs(null);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Initial check
    checkConnection();

    // Periodic heartbeat every 60s
    intervalRef.current = setInterval(checkConnection, 60000);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [checkConnection]);

  return {
    isOnline,
    isChecking,
    latencyMs,
    dbStatus,
    setDbStatus,
    checkConnection,
  };
}
