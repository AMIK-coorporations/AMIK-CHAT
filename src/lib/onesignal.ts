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
                    prenotify: true,
                    showCredit: false,
                    text: {
                        'tip.state.unsubscribed': 'Subscribe to notifications',
                        'tip.state.subscribed': "You're subscribed to notifications",
                        'tip.state.blocked': "You've blocked notifications",
                        'message.action.subscribed': "Thanks for subscribing!",
                        'message.action.resubscribed': "You're subscribed to notifications",
                        'message.action.unsubscribed': "You won't receive notifications again",
                        'dialog.main.title': 'Manage Site Notifications',
                        'dialog.main.button.subscribe': 'SUBSCRIBE',
                        'dialog.main.button.unsubscribe': 'UNSUBSCRIBE',
                        'dialog.blocked.title': 'Unblock Notifications',
                        'dialog.blocked.message': 'Follow these instructions to allow notifications:',
                        'message.action.subscribing': "Subscribing...",
                        'message.prenotify': "Click to subscribe to notifications"
                    }
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
                if (!window.median?.onesignal) {
                    resolve(null);
                    return;
                }
                const os = window.median.onesignal;
                os.onesignalInfo = (data: any) => {
                    resolve(data.oneSignalUserId);
                };
                if (typeof os.info === 'function') {
                    os.info();
                } else {
                    // Fallback if info is just an object property in some versions
                    resolve((os.info as any)?.oneSignalUserId || null);
                }

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
