import { useEffect, useCallback, useState } from 'react';

interface MobileImmersiveState {
  isMobile: boolean;
  isFullscreen: boolean;
  isStandalone: boolean;
}

/**
 * Hook to manage mobile immersive experience for the GameBoy console.
 * Handles fullscreen requests, orientation locking, and detecting PWA mode.
 */
export function useMobileImmersive(): MobileImmersiveState {
  const [state, setState] = useState<MobileImmersiveState>({
    isMobile: false,
    isFullscreen: false,
    isStandalone: false,
  });

  // Detect if we're on a mobile device
  const checkMobile = useCallback(() => {
    if (typeof window === 'undefined') return false;
    return window.innerWidth <= 768 ||
      /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
  }, []);

  // Check if running as installed PWA
  const checkStandalone = useCallback(() => {
    if (typeof window === 'undefined') return false;
    return window.matchMedia('(display-mode: standalone)').matches ||
      window.matchMedia('(display-mode: fullscreen)').matches ||
      (window.navigator as Navigator & { standalone?: boolean }).standalone === true;
  }, []);

  // Try to lock orientation to portrait
  const lockOrientation = useCallback(async () => {
    try {
      const orientation = screen.orientation as ScreenOrientation & { lock?: (orientation: string) => Promise<void> };
      if (orientation && typeof orientation.lock === 'function') {
        await orientation.lock('portrait');
      }
    } catch {
      // Orientation lock not supported or not allowed - this is fine
    }
  }, []);

  // Request fullscreen mode
  const requestFullscreen = useCallback(async () => {
    try {
      const elem = document.documentElement;
      if (elem.requestFullscreen) {
        await elem.requestFullscreen();
      } else if ((elem as HTMLElement & { webkitRequestFullscreen?: () => Promise<void> }).webkitRequestFullscreen) {
        await (elem as HTMLElement & { webkitRequestFullscreen: () => Promise<void> }).webkitRequestFullscreen();
      }
    } catch {
      // Fullscreen not supported or denied - this is fine
    }
  }, []);

  // Handle first touch to trigger fullscreen (browsers require user gesture)
  const handleFirstTouch = useCallback(async () => {
    if (!state.isMobile || state.isStandalone) return;

    await requestFullscreen();
    await lockOrientation();

    // Remove the listener after first touch
    document.removeEventListener('touchstart', handleFirstTouch);
  }, [state.isMobile, state.isStandalone, requestFullscreen, lockOrientation]);

  // Update fullscreen state
  const handleFullscreenChange = useCallback(() => {
    setState(prev => ({
      ...prev,
      isFullscreen: !!document.fullscreenElement
    }));
  }, []);

  // Initial setup
  useEffect(() => {
    const isMobile = checkMobile();
    const isStandalone = checkStandalone();

    setState({
      isMobile,
      isFullscreen: !!document.fullscreenElement,
      isStandalone,
    });

    // If on mobile and not in standalone mode, add touch listener for fullscreen
    if (isMobile && !isStandalone) {
      document.addEventListener('touchstart', handleFirstTouch, { once: true });
    }

    // If already in standalone/PWA mode, try to lock orientation
    if (isMobile && isStandalone) {
      lockOrientation();
    }

    // Listen for fullscreen changes
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    document.addEventListener('webkitfullscreenchange', handleFullscreenChange);

    // Prevent default touch behaviors that feel "website-like"
    if (isMobile) {
      // Prevent pull-to-refresh
      document.body.style.overscrollBehavior = 'none';

      // Prevent double-tap zoom
      let lastTouchEnd = 0;
      const preventDoubleTapZoom = (e: TouchEvent) => {
        const now = Date.now();
        if (now - lastTouchEnd <= 300) {
          e.preventDefault();
        }
        lastTouchEnd = now;
      };
      document.addEventListener('touchend', preventDoubleTapZoom, { passive: false });

      return () => {
        document.removeEventListener('touchstart', handleFirstTouch);
        document.removeEventListener('fullscreenchange', handleFullscreenChange);
        document.removeEventListener('webkitfullscreenchange', handleFullscreenChange);
        document.removeEventListener('touchend', preventDoubleTapZoom);
      };
    }

    return () => {
      document.removeEventListener('touchstart', handleFirstTouch);
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
      document.removeEventListener('webkitfullscreenchange', handleFullscreenChange);
    };
  }, [checkMobile, checkStandalone, handleFirstTouch, handleFullscreenChange, lockOrientation]);

  return state;
}

export default useMobileImmersive;
