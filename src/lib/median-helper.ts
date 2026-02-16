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
            document.addEventListener('median_library_ready', () => {
                resolve();
            }, { once: true });
            setTimeout(() => resolve(), 2000);
        }
    });
};

export const isWeb = (): boolean => {
    return !isMedianApp();
};
