import { insforge } from './insforge';

export async function uploadUserAvatar(file: File, userId: string): Promise<string> {
    const ext = 'webp';
    const path = `${userId}/${Date.now()}.${ext}`;
    const blob = await compressImage(file);

    const { data, error } = await insforge.storage
        .from('avatars')
        .upload(path, blob);

    if (error || !data) {
        throw new Error(error?.message || 'Failed to upload avatar to InsForge');
    }

    return data.url;
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

export async function uploadUserAvatarFast(
    file: File,
    userId: string,
    onProgress?: (pct: number) => void
): Promise<string> {
    if (onProgress) onProgress(10);
    const url = await uploadUserAvatar(file, userId);
    if (onProgress) onProgress(100);
    return url;
}

export async function uploadUserAvatarReliable(
    file: File,
    userId: string,
    onProgress?: (pct: number) => void
): Promise<string> {
    // InsForge upload is usually stable, but we can keep a simple retry if desired
    try {
        return await uploadUserAvatarFast(file, userId, onProgress);
    } catch (err) {
        console.warn("Avatar upload retry 1...");
        return await uploadUserAvatarFast(file, userId, onProgress);
    }
}
