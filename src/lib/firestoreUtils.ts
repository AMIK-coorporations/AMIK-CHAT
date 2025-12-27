/**
 * Firestore utility functions with retry logic and error handling
 */

import { 
  getDoc, 
  setDoc, 
  updateDoc, 
  deleteDoc, 
  doc, 
  query, 
  getDocs,
  onSnapshot,
  Query,
  DocumentReference,
  Unsubscribe,
  FirestoreError
} from 'firebase/firestore';
import { db } from './firebase';

const MAX_RETRIES = 3;
const RETRY_DELAY = 1000; // 1 second

/**
 * Retry a Firestore operation with exponential backoff
 */
async function retryOperation<T>(
  operation: () => Promise<T>,
  retries = MAX_RETRIES,
  delay = RETRY_DELAY
): Promise<T> {
  try {
    return await operation();
  } catch (error) {
    if (retries <= 0) {
      throw error;
    }
    
    // Check if it's a retryable error
    const firestoreError = error as FirestoreError;
    if (
      firestoreError.code === 'unavailable' ||
      firestoreError.code === 'deadline-exceeded' ||
      firestoreError.code === 'resource-exhausted' ||
      firestoreError.message?.includes('timeout') ||
      firestoreError.message?.includes('network')
    ) {
      // Wait before retrying with exponential backoff
      await new Promise(resolve => setTimeout(resolve, delay));
      return retryOperation(operation, retries - 1, delay * 2);
    }
    
    // Non-retryable error, throw immediately
    throw error;
  }
}

/**
 * Get a document with retry logic
 */
export async function getDocWithRetry<T = any>(
  docRef: DocumentReference
): Promise<T | null> {
  try {
    const docSnap = await retryOperation(() => getDoc(docRef));
    if (docSnap.exists()) {
      return { id: docSnap.id, ...docSnap.data() } as T;
    }
    return null;
  } catch (error) {
    console.error('Error getting document:', error);
    throw error;
  }
}

/**
 * Set a document with retry logic
 */
export async function setDocWithRetry(
  docRef: DocumentReference,
  data: any
): Promise<void> {
  try {
    await retryOperation(() => setDoc(docRef, data));
  } catch (error) {
    console.error('Error setting document:', error);
    throw error;
  }
}

/**
 * Update a document with retry logic
 */
export async function updateDocWithRetry(
  docRef: DocumentReference,
  data: any
): Promise<void> {
  try {
    await retryOperation(() => updateDoc(docRef, data));
  } catch (error) {
    console.error('Error updating document:', error);
    throw error;
  }
}

/**
 * Delete a document with retry logic
 */
export async function deleteDocWithRetry(
  docRef: DocumentReference
): Promise<void> {
  try {
    await retryOperation(() => deleteDoc(docRef));
  } catch (error) {
    console.error('Error deleting document:', error);
    throw error;
  }
}

/**
 * Get query results with retry logic
 */
export async function getQueryWithRetry<T = any>(
  queryRef: Query
): Promise<T[]> {
  try {
    const querySnapshot = await retryOperation(() => getDocs(queryRef));
    return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as T));
  } catch (error) {
    console.error('Error getting query results:', error);
    throw error;
  }
}

/**
 * Create a snapshot listener with error handling and retry
 */
export function onSnapshotWithRetry<T = any>(
  queryOrDoc: Query | DocumentReference,
  onNext: (data: T | T[] | null) => void,
  onError?: (error: Error) => void,
  timeout = 30000 // 30 seconds default timeout
): Unsubscribe {
  let timeoutId: NodeJS.Timeout | null = null;
  let retryCount = 0;
  let unsubscribe: Unsubscribe | null = null;

  const setupListener = () => {
    // Clear existing timeout
    if (timeoutId) {
      clearTimeout(timeoutId);
      timeoutId = null;
    }

    // Set timeout
    timeoutId = setTimeout(() => {
      console.warn('Firestore snapshot timeout, retrying...');
      if (retryCount < MAX_RETRIES) {
        retryCount++;
        if (unsubscribe) unsubscribe();
        setupListener();
      } else {
        const error = new Error('Firestore snapshot connection timeout');
        if (onError) {
          onError(error);
        } else {
          console.error('Firestore snapshot error:', error);
        }
      }
    }, timeout);

    // Setup listener
    unsubscribe = onSnapshot(
      queryOrDoc,
      (snapshot) => {
        // Clear timeout on successful data
        if (timeoutId) {
          clearTimeout(timeoutId);
          timeoutId = null;
        }
        retryCount = 0; // Reset retry count on success

        if ('docs' in snapshot) {
          // Query snapshot
          const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as T));
          onNext(data as T[]);
        } else {
          // Document snapshot
          if (snapshot.exists()) {
            onNext({ id: snapshot.id, ...snapshot.data() } as T);
          } else {
            onNext(null);
          }
        }
      },
      (error: FirestoreError) => {
        // Clear timeout on error
        if (timeoutId) {
          clearTimeout(timeoutId);
          timeoutId = null;
        }

        // Check if error is retryable
        if (
          (error.code === 'unavailable' || 
           error.code === 'deadline-exceeded' ||
           error.code === 'resource-exhausted' ||
           error.message?.includes('timeout') ||
           error.message?.includes('network')) &&
          retryCount < MAX_RETRIES
        ) {
          retryCount++;
          console.warn(`Firestore snapshot error (retry ${retryCount}/${MAX_RETRIES}):`, error);
          // Retry after delay
          setTimeout(() => {
            if (unsubscribe) unsubscribe();
            setupListener();
          }, RETRY_DELAY * retryCount);
        } else {
          // Non-retryable or max retries reached
          if (onError) {
            onError(error);
          } else {
            console.error('Firestore snapshot error:', error);
          }
        }
      }
    );
  };

  setupListener();

  // Return unsubscribe function
  return () => {
    if (timeoutId) {
      clearTimeout(timeoutId);
    }
    if (unsubscribe) {
      unsubscribe();
    }
  };
}

