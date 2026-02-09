import { db_insforge, insforge } from './insforge';

/**
 * InsForge utility functions mirroring Firestore utils
 * Includes mapping between snake_case (DB) and camelCase (App)
 */

function isLikelyId(key: string): boolean {
    return key.length >= 20 && /^[a-zA-Z0-9]+$/.test(key);
}

function toSnakeCase(obj: any): any {
    if (Array.isArray(obj)) return obj.map(toSnakeCase);
    if (obj instanceof Date) return obj.toISOString();
    // Handle Firestore Timestamp
    if (obj && typeof obj === 'object' && typeof obj.toDate === 'function') {
        return obj.toDate().toISOString();
    }
    if (obj !== null && typeof obj === 'object') {
        return Object.keys(obj).reduce((acc, key) => {
            if (isLikelyId(key)) {
                acc[key] = toSnakeCase(obj[key]);
            } else {
                const snakeKey = key.replace(/([a-z])([A-Z])/g, '$1_$2').toLowerCase();
                acc[snakeKey] = toSnakeCase(obj[key]);
            }
            return acc;
        }, {} as any);
    }
    return obj;
}

function toCamelCase(obj: any): any {
    if (Array.isArray(obj)) return obj.map(toCamelCase);
    if (obj !== null && typeof obj === 'object' && !(obj instanceof Date)) {
        return Object.keys(obj).reduce((acc, key) => {
            if (isLikelyId(key)) {
                acc[key] = toCamelCase(obj[key]);
            } else {
                const camelKey = key.replace(/([-_][a-z])/g, group => group.toUpperCase().replace('-', '').replace('_', ''));
                acc[camelKey] = toCamelCase(obj[key]);
            }
            return acc;
        }, {} as any);
    }
    return obj;
}

export async function getDocFromInsforge<T = any>(
    table: string,
    id: string
): Promise<T | null> {
    try {
        const { data, error } = await db_insforge
            .from(table)
            .select('*')
            .eq('id', id)
            .maybeSingle();

        if (error) throw error;
        return data ? toCamelCase(data) as T : null;
    } catch (error) {
        console.error(`Error getting doc from Insforge (${table}/${id}):`, error);
        return null;
    }
}

export async function setDocInInsforge(
    table: string,
    id: string,
    data: any
): Promise<void> {
    try {
        const dbData = toSnakeCase({ ...data, id });
        const { error } = await db_insforge
            .from(table)
            .upsert(dbData);

        if (error) throw error;
    } catch (error: any) {
        console.error(`Error setting doc in Insforge (${table}/${id}):`, error.message || error);
        if (error.details) console.error("Details:", error.details);
        if (error.hint) console.error("Hint:", error.hint);
        throw error;
    }
}

export async function updateDocInInsforge(
    table: string,
    id: string,
    data: any
): Promise<void> {
    try {
        const dbData = toSnakeCase(data);
        const { error } = await db_insforge
            .from(table)
            .update(dbData)
            .eq('id', id);

        if (error) throw error;
    } catch (error) {
        console.error(`Error updating doc in Insforge (${table}/${id}):`, error);
        throw error;
    }
}

export async function deleteDocFromInsforge(
    table: string,
    id: string
): Promise<void> {
    try {
        const { error } = await db_insforge
            .from(table)
            .delete()
            .eq('id', id);

        if (error) throw error;
    } catch (error) {
        console.error(`Error deleting doc from Insforge (${table}/${id}):`, error);
        throw error;
    }
}

export async function getQueryFromInsforge<T = any>(
    table: string,
    filters: (query: any) => any = (q) => q
): Promise<T[]> {
    try {
        let q = db_insforge.from(table).select('*');
        q = filters(q);
        const { data, error } = await q;

        if (error) throw error;
        return (data || []).map(toCamelCase) as T[];
    } catch (error) {
        console.error(`Error querying Insforge (${table}):`, error);
        throw error;
    }
}

export function onSnapshotFromInsforge(
    channelName: string,
    eventName: string,
    onNext: (data: any) => void
) {
    // Ensure connection is established
    const setup = async () => {
        if (insforge.realtime.connectionState !== 'connected') {
            await insforge.realtime.connect();
        }
        await insforge.realtime.subscribe(channelName);
    };
    setup().catch(console.error);

    const handler = (payload: any) => {
        onNext(toCamelCase(payload));
    };

    insforge.realtime.on(eventName, handler);

    return () => {
        insforge.realtime.off(eventName, handler);
        insforge.realtime.unsubscribe(channelName);
    };
}
