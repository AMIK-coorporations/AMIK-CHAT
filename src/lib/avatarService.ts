import { storage } from '@/lib/firebase';
import { getDownloadURL, ref, uploadBytes, uploadBytesResumable } from 'firebase/storage';

export async function uploadUserAvatar(file: File, userId: string): Promise<string> {
	const ext = file.name.split('.').pop() || 'jpg';
	const path = `avatars/${userId}/${Date.now()}.${ext}`;
	const storageRef = ref(storage, path);
	const snapshot = await uploadBytes(storageRef, file, { contentType: file.type });
	const url = await getDownloadURL(snapshot.ref);
	return url;
}

export function downloadImage(url: string, suggestedName = 'avatar.jpg') {
	const link = document.createElement('a');
	link.href = url;
	link.download = suggestedName;
	link.rel = 'noopener';
	document.body.appendChild(link);
	link.click();
	link.remove();
}

export async function compressImage(file: File, maxSize = 384): Promise<Blob> {
	const img = document.createElement('img');
	const dataUrl = await new Promise<string>((resolve, reject) => {
		const reader = new FileReader();
		reader.onload = () => resolve(reader.result as string);
		reader.onerror = reject;
		reader.readAsDataURL(file);
	});
	await new Promise<void>((res, rej) => { img.onload = () => res(); img.onerror = rej; img.src = dataUrl; });
	const canvas = document.createElement('canvas');
	const ctx = canvas.getContext('2d')!;
	let { width, height } = img;
	const scale = Math.min(1, maxSize / Math.max(width, height));
	width = Math.round(width * scale); height = Math.round(height * scale);
	canvas.width = width; canvas.height = height;
	ctx.drawImage(img, 0, 0, width, height);
	return await new Promise<Blob>((resolve) => canvas.toBlob(b => resolve(b!), 'image/webp', 0.8));
}

async function uploadWithResumableThenFallback(
	blob: Blob,
	path: string,
	onProgress?: (pct: number) => void
): Promise<string> {
	const storageRef = ref(storage, path);
	const task = uploadBytesResumable(storageRef, blob, { contentType: 'image/webp' });
	let lastPct = 0;
	if (onProgress) onProgress(1);
	return await new Promise<string>((resolve, reject) => {
		let settled = false;
		const stall = setTimeout(async () => {
			// If still stuck <=5%, cancel and fallback
			if (!settled && lastPct <= 5) {
				try { task.cancel(); } catch {}
				try {
					const snap = await uploadBytes(storageRef, blob, { contentType: 'image/webp' });
					const url = await getDownloadURL(snap.ref);
					if (onProgress) onProgress(100);
					settled = true; clearTimeout(stall); resolve(url);
					return;
				} catch (err) {
					settled = true; clearTimeout(stall); reject(err);
					return;
				}
			}
		}, 4000);
		task.on('state_changed', (snap) => {
			lastPct = Math.round((snap.bytesTransferred / snap.totalBytes) * 100);
			if (onProgress) onProgress(Math.max(5, lastPct));
		}, async (err) => {
			clearTimeout(stall);
			// If canceled due to our fallback, ignore because fallback will resolve; otherwise reject
			if ((err as any)?.code === 'storage/canceled') return;
			reject(err);
		}, async () => {
			clearTimeout(stall);
			if (settled) return; // already handled by fallback
			const url = await getDownloadURL(task.snapshot.ref);
			if (onProgress) onProgress(100);
			resolve(url);
		});
	});
}

export async function uploadUserAvatarFast(
	file: File,
	userId: string,
	onProgress?: (pct: number) => void
): Promise<string> {
	const ext = 'webp';
	const path = `avatars/${userId}/${Date.now()}.${ext}`;
	const blob = await compressImage(file);
	return uploadWithResumableThenFallback(blob, path, onProgress);
}

export async function uploadUserAvatarReliable(
	file: File,
	userId: string,
	onProgress?: (pct: number) => void
): Promise<string> {
	const maxAttempts = 2;
	let attempt = 0;
	let lastErr: any = null;
	while (attempt < maxAttempts) {
		try {
			return await uploadUserAvatarFast(file, userId, onProgress);
		} catch (err) {
			lastErr = err;
			await new Promise(res => setTimeout(res, 600 * (attempt + 1)));
			attempt++;
		}
	}
	throw lastErr ?? new Error('Upload failed');
} 