import { NextResponse } from 'next/server';
import { suggestContacts } from '@/ai/flows/suggest-contacts';

export async function POST(req: Request) {
	try {
		const body = await req.json();
		const { profileInformation, communicationPatterns } = body || {};

		if (typeof profileInformation !== 'string' || typeof communicationPatterns !== 'string') {
			return NextResponse.json({ error: 'Invalid payload' }, { status: 400 });
		}

		const result = await suggestContacts({ profileInformation, communicationPatterns });
		return NextResponse.json(result);
	} catch (error: any) {
		return NextResponse.json({ error: error?.message || 'Internal Server Error' }, { status: 500 });
	}
} 