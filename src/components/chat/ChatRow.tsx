import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import type { Chat } from "@/lib/types";
import { format } from "date-fns";
import { Check, CheckCheck } from "lucide-react";
import Link from "next/link";

interface ChatRowProps {
    chat: Chat;
    currentUserId: string;
}

export default function ChatRow({ chat, currentUserId }: ChatRowProps) {
    const otherParticipantId = chat.participantIds?.find((id) => id !== currentUserId);
    const otherParticipant = otherParticipantId
        ? chat.participantsInfo?.[otherParticipantId]
        : null;

    if (!otherParticipant) return null;

    const lastMessage = chat.lastMessage;
    const isUnread = lastMessage && !lastMessage.isRead && lastMessage.senderId !== currentUserId;

    let timestampDisplay = '';
    if (lastMessage?.timestamp) {
        const date = lastMessage.timestamp.toDate ? lastMessage.timestamp.toDate() : new Date(lastMessage.timestamp);
        if (isToday(date)) {
            timestampDisplay = format(date, 'HH:mm');
        } else if (isYesterday(date)) {
            timestampDisplay = 'کل';
        } else {
            timestampDisplay = format(date, 'dd/MM/yyyy');
        }
    }

    // Self chat handling (if otherParticipantId is undefined/same as current)
    // But generally chat.participants has 2 IDs.

    const displayName = otherParticipant.name || otherParticipant.displayName || 'Unknown';

    return (
        <Link
            href={`/chats/${chat.id}`}
            className={`flex items-center gap-3 p-4 hover:bg-muted/50 transition-colors ${isUnread ? 'bg-muted/20' : ''}`}
        >
            <Avatar className="h-12 w-12 border">
                <AvatarImage src={otherParticipant.avatarUrl || otherParticipant.photoURL} alt={displayName} />
                <AvatarFallback>{displayName.charAt(0)}</AvatarFallback>
            </Avatar>

            <div className="flex-1 overflow-hidden min-w-0">
                <div className="flex justify-between items-baseline">
                    <h3 className="font-semibold truncate text-base">{displayName}</h3>
                    {timestampDisplay && (
                        <span className={`text-xs ${isUnread ? 'text-primary font-bold' : 'text-muted-foreground'}`}>
                            {timestampDisplay}
                        </span>
                    )}
                </div>

                <div className="flex items-center gap-1">
                    {lastMessage?.senderId === currentUserId && (
                        <span className="text-muted-foreground">
                            {lastMessage.isRead ? <CheckCheck className="w-4 h-4 text-blue-500" /> : <Check className="w-4 h-4" />}
                        </span>
                    )}
                    <p className={`text-sm truncate ${isUnread ? 'font-semibold text-foreground' : 'text-muted-foreground'}`}>
                        {lastMessage?.text || 'کوئی پیغام نہیں'}
                    </p>
                </div>
            </div>
        </Link>
    );
}

function isToday(date: Date) {
    const today = new Date();
    return date.getDate() === today.getDate() &&
        date.getMonth() === today.getMonth() &&
        date.getFullYear() === today.getFullYear();
}

function isYesterday(date: Date) {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    return date.getDate() === yesterday.getDate() &&
        date.getMonth() === yesterday.getMonth() &&
        date.getFullYear() === yesterday.getFullYear();
}
