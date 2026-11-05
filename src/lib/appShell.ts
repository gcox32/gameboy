// The element browser fullscreen targets. Only its descendants stay visible
// while fullscreen, so anything that must stay on screen has to render inside it.
export const APP_SHELL_ID = 'app-shell';

export const getAppShell = () => document.getElementById(APP_SHELL_ID);
