import { useCallback, useEffect, useState } from 'react';
import { getAppShell } from '@/lib/appShell';

type FullscreenElement = HTMLElement & { webkitRequestFullscreen?: () => Promise<void> };
type FullscreenDocument = Document & {
    webkitExitFullscreen?: () => Promise<void>;
    webkitFullscreenElement?: Element | null;
};

/**
 * Wraps the real browser Fullscreen API for the app shell, so the nav, panels,
 * modals and toasts all stay on screen. Separate from the app's Immersive view,
 * and tracks whether the browser is actually fullscreen so a UI icon can reflect it.
 */
export function useBrowserFullscreen() {
    const [isFullscreen, setIsFullscreen] = useState(false);

    useEffect(() => {
        const handleFullscreenChange = () => {
            const doc = document as FullscreenDocument;
            setIsFullscreen(!!(document.fullscreenElement || doc.webkitFullscreenElement));
        };
        document.addEventListener('fullscreenchange', handleFullscreenChange);
        document.addEventListener('webkitfullscreenchange', handleFullscreenChange);
        return () => {
            document.removeEventListener('fullscreenchange', handleFullscreenChange);
            document.removeEventListener('webkitfullscreenchange', handleFullscreenChange);
        };
    }, []);

    const toggle = useCallback(async () => {
        try {
            const doc = document as FullscreenDocument;
            if (document.fullscreenElement || doc.webkitFullscreenElement) {
                if (document.exitFullscreen) {
                    await document.exitFullscreen();
                } else if (doc.webkitExitFullscreen) {
                    await doc.webkitExitFullscreen();
                }
                return;
            }

            const elem = getAppShell() as FullscreenElement | null;
            if (!elem) return;
            if (elem.requestFullscreen) {
                await elem.requestFullscreen();
            } else if (elem.webkitRequestFullscreen) {
                await elem.webkitRequestFullscreen();
            }
        } catch (error) {
            console.error('Failed to toggle browser fullscreen:', error);
        }
    }, []);

    return { isFullscreen, toggle };
}

export default useBrowserFullscreen;
