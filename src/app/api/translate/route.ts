import { NextResponse } from 'next/server';
import { translateText } from '@/ai/flows/translate-text';

export const runtime = 'nodejs';

export async function POST(req: Request) {
	try {
		const body = await req.json();
		const { text, targetLanguage } = body || {};

		if (typeof text !== 'string' || typeof targetLanguage !== 'string') {
			return NextResponse.json({ error: 'Invalid payload' }, { status: 400 });
		}

		if (!text.trim()) {
			return NextResponse.json({ error: 'Text cannot be empty' }, { status: 400 });
		}

		const result = await translateText({ text, targetLanguage });

		if (!result?.translatedText || typeof result.translatedText !== 'string') {
			return NextResponse.json({ error: 'Translation failed' }, { status: 502 });
		}

		return NextResponse.json(result);
	} catch (error: any) {
		return NextResponse.json({ 
			error: error?.message || 'Internal Server Error',
			details: error?.stack || 'No stack trace'
		}, { status: 500 });
	}
} 