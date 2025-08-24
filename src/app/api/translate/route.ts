import { NextResponse } from 'next/server';
import { translateText } from '@/ai/flows/translate-text';

export async function POST(req: Request) {
	try {
		const body = await req.json();
		const { text, targetLanguage } = body || {};

		console.log('Translation API called with:', { text, targetLanguage });

		if (typeof text !== 'string' || typeof targetLanguage !== 'string') {
			console.error('Invalid payload:', body);
			return NextResponse.json({ error: 'Invalid payload' }, { status: 400 });
		}

		if (!text.trim()) {
			console.error('Empty text provided');
			return NextResponse.json({ error: 'Text cannot be empty' }, { status: 400 });
		}

		console.log('Calling translateText function...');
		const result = await translateText({ text, targetLanguage });
		console.log('Translation result:', result);

		if (!result.translatedText) {
			console.error('No translation received from AI');
			return NextResponse.json({ error: 'Translation failed' }, { status: 500 });
		}

		return NextResponse.json(result);
	} catch (error: any) {
		console.error('Translation API error:', error);
		return NextResponse.json({ 
			error: error?.message || 'Internal Server Error',
			details: error?.stack || 'No stack trace'
		}, { status: 500 });
	}
} 