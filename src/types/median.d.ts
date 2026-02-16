export { };

declare global {
    interface Window {
        median?: {
            onesignal?: {
                register: () => void;
                info: {
                    oneSignalUserId?: string;
                };
                onesignalInfo?: (data: any) => void;
                setExternalUserId?: (id: string) => void;
                notificationOpened?: (data: any) => void;
            };
        };
    }
}
