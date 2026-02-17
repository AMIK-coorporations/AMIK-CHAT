export { };

declare global {
    interface Window {
        median?: {
            onesignal?: {
                register: () => void;
                info: (() => void) & {
                    oneSignalUserId?: string;
                };
                onesignalInfo?: (data: any) => void;
                setExternalUserId?: (id: string) => void;
                notificationOpened?: (data: any) => void;
            };
        };
    }
}
