import { useState, useEffect, useCallback } from 'react';

/**
 * Hook for managing PWA install prompt lifecycle and installation status
 */
export function usePWAInstall() {
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [isInstallable, setIsInstallable] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);

  useEffect(() => {
    // Check if already in standalone mode or previously marked as installed
    const isStandalone =
      window.matchMedia('(display-mode: standalone)').matches ||
      window.navigator.standalone === true;

    if (isStandalone || localStorage.getItem('lambo_pwa_installed') === 'true') {
      setIsInstalled(true);
    }

    const handleBeforeInstall = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setIsInstallable(true);
    };

    const handleAppInstalled = () => {
      setIsInstalled(true);
      setIsInstallable(false);
      setDeferredPrompt(null);
      try {
        localStorage.setItem('lambo_pwa_installed', 'true');
      } catch {
        // Ignore localStorage errors
      }
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstall);
    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstall);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  const promptInstall = useCallback(async () => {
    if (!deferredPrompt) return false;

    try {
      deferredPrompt.prompt();
      const choice = await deferredPrompt.userChoice;
      if (choice && choice.outcome === 'accepted') {
        setIsInstalled(true);
        setIsInstallable(false);
        try {
          localStorage.setItem('lambo_pwa_installed', 'true');
        } catch {
          // Ignore
        }
        setDeferredPrompt(null);
        return true;
      }
    } catch (err) {
      console.warn('[usePWAInstall] Prompt error:', err);
    }
    setDeferredPrompt(null);
    setIsInstallable(false);
    return false;
  }, [deferredPrompt]);

  return {
    isInstallable,
    isInstalled,
    promptInstall,
  };
}
