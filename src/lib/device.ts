export function isMobileOrTabletUserAgent(userAgent: string): boolean {
  if (!userAgent) return false;
  const ua = userAgent.toLowerCase();
  const mobilePatterns = [
    /android/i,
    /webos/i,
    /iphone/i,
    /ipad/i,
    /ipod/i,
    /blackberry/i,
    /windows phone/i,
    /iemobile/i,
    /mobile/i,
    /tablet/i,
    /silk/i,
    /kindle/i,
  ];

  for (const pattern of mobilePatterns) {
    if (pattern.test(ua)) return true;
  }

  // iPad on iOS 13+ detection (reports as MacIntel with touch support)
  if (ua.includes("macintosh") && typeof navigator !== "undefined" && navigator.maxTouchPoints > 1) {
    return true;
  }

  return false;
}

export function isMobileOrTabletClient(): boolean {
  if (typeof window === "undefined") return true;

  // 1. Check navigator.userAgent
  const ua = window.navigator.userAgent || "";
  if (isMobileOrTabletUserAgent(ua)) return true;

  // 2. Touch support and screen size heuristic (max width 1024px and has touch)
  const hasTouch = "ontouchstart" in window || navigator.maxTouchPoints > 0;
  const isSmallScreen = window.innerWidth <= 1024;

  if (hasTouch && isSmallScreen) {
    return true;
  }

  return false;
}
