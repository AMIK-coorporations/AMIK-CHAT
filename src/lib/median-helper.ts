// Utility to detect if running inside Median.co APK

// Extend window interface for median
declare global {
    interface Window {
        median?: any;
    }
}

export const isMedianApp = (): boolean => {
    if (typeof window === 'undefined') return false;
    return !!window.median;
};

export const waitForMedian = (): Promise<void> => {
    return new Promise((resolve) => {
        if (typeof window === 'undefined') {
            resolve();
            return;
        }

        if (window.median) {
            resolve();
        } else {
            // Wait for median_library_ready event
            document.addEventListener('median_library_ready', () => {
                resolve();
            }, { once: true });

            // Fallback timeout in case event already fired or never fires
            setTimeout(() => resolve(), 2000);
        }
    });
};

export const isWeb = (): boolean => {
    return !isMedianApp();
};
