import OneSignal from 'react-onesignal';
import { isMedianApp, waitForMedian } from './median-helper';

const ONESIGNAL_APP_ID = process.env.NEXT_PUBLIC_ONESIGNAL_APP_ID!;

export const initializeOneSignal = async () => {
    if (typeof window === 'undefined') return;

    try {
        if (isMedianApp()) {
            await waitForMedian();
            if (window.median?.onesignal) {
                window.median.onesignal.register();
            }
        } else {
            await OneSignal.init({
                appId: ONESIGNAL_APP_ID,
                allowLocalhostAsSecureOrigin: true,
                notifyButton: {
                    enable: true,
                },
            });
        }
    } catch (error) {
        console.error('OneSignal Initialization failed:', error);
    }
};

export const getPlayerId = async (): Promise<string | null> => {
    if (typeof window === 'undefined') return null;

    try {
        if (isMedianApp()) {
            await waitForMedian();
            if (window.median?.onesignal?.info) {
                return window.median.onesignal.info.oneSignalUserId || null;
            }
            return new Promise((resolve) => {
                if (!window.median?.onesignal) resolve(null);
                window.median.onesignal.onesignalInfo = (data: any) => {
                    resolve(data.oneSignalUserId);
                };
                window.median.onesignal.info();
            });
        } else {
            const state = await OneSignal.User.PushSubscription.id;
            return state || null;
        }
    } catch (error) {
        console.error('Error getting Player ID:', error);
        return null;
    }
};

export const setExternalUserId = async (userId: string) => {
    if (typeof window === 'undefined') return;

    try {
        if (isMedianApp()) {
            await waitForMedian();
            if (window.median?.onesignal?.setExternalUserId) {
                window.median.onesignal.setExternalUserId(userId);
            }
        } else {
            await OneSignal.login(userId);
        }
    } catch (e) {
        console.error("Error setting external user id:", e);
    }
}
