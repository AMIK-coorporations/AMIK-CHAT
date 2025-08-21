import { NextResponse } from 'next/server';
import { translateText } from '@/ai/flows/translate-text';

export async function POST(req: Request) {
	try {
		const body = await req.json();
		const { text, targetLanguage } = body || {};

		if (typeof text !== 'string' || typeof targetLanguage !== 'string') {
			return NextResponse.json({ error: 'Invalid payload' }, { status: 400 });
		}

		const result = await translateText({ text, targetLanguage });
		return NextResponse.json(result);
	} catch (error: any) {
		return NextResponse.json({ error: error?.message || 'Internal Server Error' }, { status: 500 });
	}
} 