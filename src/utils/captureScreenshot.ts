/**
 * Captures the game screen as a PNG. The canvas is read the moment this is called, so
 * call it before anything else lets the game move on. Saving still works without a
 * screenshot, so a failure resolves to null rather than throwing.
 */
export function captureScreenshot(canvas: HTMLCanvasElement | null): Promise<File | null> {
    return new Promise((resolve) => {
        if (!canvas) {
            resolve(null);
            return;
        }
        try {
            canvas.toBlob((blob) => {
                resolve(blob ? new File([blob], 'screenshot.png', { type: 'image/png' }) : null);
            }, 'image/png');
        } catch (error) {
            console.error('Failed to capture screenshot:', error);
            resolve(null);
        }
    });
}
