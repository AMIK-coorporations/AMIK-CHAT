"use client";

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { initializeOneSignal } from '@/lib/onesignal';
import { isMedianApp, waitForMedian } from '@/lib/median-helper';
import OneSignal from 'react-onesignal';

export default function OneSignalInitializer() {
    const router = useRouter();

    useEffect(() => {
        const init = async () => {
            await initializeOneSignal();

            // Setup Event Listeners for Deep Linking
            if (isMedianApp()) {
                await waitForMedian();
                // Median / Android Native Listener
                // Using 'median_onesignal_notification_opened' event if available or custom callback
                // Median documentation generally uses `median.onesignal.notificationOpened`
                if (window.median?.onesignal) {
                    window.median.onesignal.notificationOpened = (data: any) => {
                        console.log("Median Notification Opened:", data);
                        const additionalData = data.notification?.payload?.additionalData;
                        if (additionalData?.chat_id) {
                            router.push(`/chats/${additionalData.chat_id}`);
                        }
                    };
                }
            } else {
                // Web Listener
                OneSignal.Notifications.addEventListener('click', (event: any) => {
                    console.log("Web Notification Clicked:", event);
                    const data = event.notification.additionalData;
                    if (data?.chat_id) {
                        router.push(`/chats/${data.chat_id}`);
                    }
                });
            }
        };

        init();

        // Cleanup
        return () => {
            // OneSignal Web SDK cleanup if needed
            try {
                OneSignal.Notifications.removeEventListener('click', () => { });
            } catch (e) { }
        };
    }, [router]);

    return null;
}
