/**
 * Browser compatibility utilities
 */

/**
 * Check if the browser supports required features
 */
export function checkBrowserCompatibility(): {
  supported: boolean;
  issues: string[];
} {
  const issues: string[] = [];

  // Check for required APIs
  if (typeof window === 'undefined') {
    return { supported: false, issues: ['Server-side rendering'] };
  }

  // Check for Fetch API
  if (!window.fetch) {
    issues.push('Fetch API not supported');
  }

  // Check for localStorage
  try {
    localStorage.setItem('test', 'test');
    localStorage.removeItem('test');
  } catch (e) {
    issues.push('localStorage not available');
  }

  // Check for WebRTC (for calls)
  if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
    issues.push('WebRTC/MediaDevices API not fully supported');
  }

  // Check for Web Share API (optional)
  if (!navigator.share) {
    // Not critical, just a note
    console.log('Web Share API not available, will use fallback');
  }

  return {
    supported: issues.length === 0,
    issues,
  };
}

/**
 * Add polyfills for older browsers
 */
export function addPolyfills(): void {
  if (typeof window === 'undefined') return;

  // Add Promise polyfill if needed (for very old browsers)
  if (typeof Promise === 'undefined') {
    console.warn('Promise not supported, app may not work correctly');
  }

  // Add fetch polyfill if needed
  if (!window.fetch) {
    console.warn('Fetch API not supported, some features may not work');
  }
}

/**
 * Initialize browser compatibility checks
 */
export function initBrowserCompatibility(): void {
  if (typeof window === 'undefined') return;

  addPolyfills();
  const compatibility = checkBrowserCompatibility();

  if (!compatibility.supported) {
    console.warn('Browser compatibility issues:', compatibility.issues);
  }
}

