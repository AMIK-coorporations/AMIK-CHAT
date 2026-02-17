import { NextResponse } from 'next/server';
import { insforge } from '@/lib/insforge';
import * as OneSignal from '@onesignal/node-onesignal';

const ONESIGNAL_APP_ID = process.env.NEXT_PUBLIC_ONESIGNAL_APP_ID!;
const ONESIGNAL_REST_API_KEY = process.env.ONESIGNAL_REST_API_KEY!;

// Initialize OneSignal Client
const configuration = OneSignal.createConfiguration({
    restApiKey: ONESIGNAL_REST_API_KEY
});
const client = new OneSignal.DefaultApi(configuration);

export async function POST(request: Request) {
    try {
        const { receiverId, title, message, chatId, type } = await request.json();

        if (!receiverId || !message) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
        }

        // 1. Get Receiver's Player ID from InsForge Database
        const { data: user, error } = await insforge
            .from('users')
            .select('onesignal_player_id')
            .eq('id', receiverId)
            .single();

        if (error || !user?.onesignal_player_id) {
            console.log(`No player ID found for user ${receiverId}`);
            return NextResponse.json({ skipped: true, reason: 'User has no player ID' });
        }

        const playerId = user.onesignal_player_id;

        // 2. Send Notification
        const notification = new OneSignal.Notification();
        notification.app_id = ONESIGNAL_APP_ID;
        notification.include_player_ids = [playerId];
        notification.headings = { en: title || 'New Message' };
        notification.contents = { en: message };
        notification.data = {
            chat_id: chatId,
            type: type || 'new_message',
            sender_id: 'system' // or pass from request
        };

        // Android/Median specific
        notification.small_icon = 'ic_stat_onesignal_default';
        notification.android_accent_color = 'FF05C765'; // Your brand color

        const result = await client.createNotification(notification);

        return NextResponse.json({ success: true, id: result.id });
    } catch (error: any) {
        console.error('Push notification error:', error);
        return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
    }
}
