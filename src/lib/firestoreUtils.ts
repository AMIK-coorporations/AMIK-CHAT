import { setDocInInsforge, updateDocInInsforge, deleteDocFromInsforge, getDocFromInsforge, getQueryFromInsforge, onSnapshotFromInsforge } from './insforgeUtils';

/**
 * Get a document from InsForge
 */
export async function getDocWithRetry<T = any>(
  docRef: any // This was a DocumentReference
): Promise<T | null> {
  try {
    const table = docRef.table || (docRef as any)._path?.segments[0] || (docRef.parent as any)?.id;
    const id = docRef.id;
    if (table && id) {
      return await getDocFromInsforge<T>(table, id);
    }
    return null;
  } catch (error) {
    console.error('Error getting document from InsForge:', error);
    throw error;
  }
}

/**
 * Set a document in InsForge
 */
export async function setDocWithRetry(
  docRef: any,
  data: any
): Promise<void> {
  try {
    const table = docRef.table || (docRef as any)._path?.segments[0] || (docRef.parent as any)?.id;
    const id = docRef.id;
    if (table && id) {
      await setDocInInsforge(table, id, data);
    }
  } catch (error) {
    console.error('Error setting document in InsForge:', error);
    throw error;
  }
}

/**
 * Update a document in InsForge
 */
export async function updateDocWithRetry(
  docRef: any,
  data: any
): Promise<void> {
  try {
    const table = docRef.table || (docRef as any)._path?.segments[0] || (docRef.parent as any)?.id;
    const id = docRef.id;
    if (table && id) {
      await updateDocInInsforge(table, id, data);
    }
  } catch (error) {
    console.error('Error updating document in InsForge:', error);
    throw error;
  }
}

/**
 * Delete a document from InsForge
 */
export async function deleteDocWithRetry(
  docRef: any
): Promise<void> {
  try {
    const table = docRef.table || (docRef as any)._path?.segments[0] || (docRef.parent as any)?.id;
    const id = docRef.id;
    if (table && id) {
      await deleteDocFromInsforge(table, id);
    }
  } catch (error) {
    console.error('Error deleting document from InsForge:', error);
    throw error;
  }
}

/**
 * Get query results from InsForge
 */
export async function getQueryWithRetry<T = any>(
  queryRef: any
): Promise<T[]> {
  try {
    const table = queryRef.table || (queryRef as any)._query?.path?.segments[0] || (queryRef as any).path;
    if (table) {
      return await getQueryFromInsforge<T>(table);
    }
    return [];
  } catch (error) {
    console.error('Error getting query results from InsForge:', error);
    throw error;
  }
}

/**
 * Snapshot listener using InsForge Realtime
 */
export function onSnapshotWithRetry<T = any>(
  queryOrDoc: any,
  onNext: (data: T | T[] | null) => void,
  onError?: (error: Error) => void
): () => void {
  const table = queryOrDoc.table || (queryOrDoc as any)._path?.segments[0] || (queryOrDoc as any).path || (queryOrDoc as any).parent?.id;
  const id = queryOrDoc.id;

  if (!table) {
    console.error("No table found for InsForge realtime subscription");
    return () => { };
  }

  // Subscribe to all changes on the table/record
  // We'll use a wildcard for now to mirror the general collection behavior
  const channelName = id ? `${table}:${id}` : `${table}:*`;
  const eventName = id ? `UPDATE_${table}` : `INSERT_${table}`; // This needs to match backend event names

  try {
    const unsubscribe = onSnapshotFromInsforge(channelName, '*', (payload) => {
      // For InsForge, we might need to handle the list vs single logic
      // This is a simplification
      if (id) {
        onNext(payload as T);
      } else {
        // For collections, we'd ideally fetch again or maintain a local list
        // For now, let's trigger a re-fetch or pass the single item if that's what backend sends
        onNext([payload] as T[]);
      }
    });
    return unsubscribe;
  } catch (err: any) {
    if (onError) onError(err);
    return () => { };
  }
}

