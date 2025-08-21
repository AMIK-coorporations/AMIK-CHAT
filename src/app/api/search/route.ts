import { NextResponse } from 'next/server';
import { search } from '@/ai/flows/search-flow';

async function wikipediaFallback(query: string) {
	// Try Urdu Wikipedia first, then English if no results
	async function fetchWiki(lang: string) {
		const url = `https://${lang}.wikipedia.org/w/rest.php/v1/search/page?q=${encodeURIComponent(query)}&limit=5`;
		const res = await fetch(url, { headers: { 'User-Agent': 'AMIK-CHAT/1.0 (Fallback Search)' } });
		if (!res.ok) throw new Error(`Wikipedia ${lang} request failed`);
		return res.json() as Promise<{ pages?: Array<{ title: string; excerpt?: string; key?: string }>; }>;
	}

	let data;
	try {
		data = await fetchWiki('ur');
		if (!data.pages || data.pages.length === 0) {
			data = await fetchWiki('en');
		}
	} catch {
		// Final fallback: empty results
		return {
			answer: 'یہ رہے آپ کی تلاش سے متعلق نتائج۔',
			sources: [] as { title: string; url: string; snippet: string }[],
		};
	}

	const pages = data.pages || [];
	const sources = pages.map(p => ({
		title: p.title,
		url: `https://$${p.title ? '' : ''}wikipedia.org/wiki/${encodeURIComponent(p.title)}`.replace('$', ''),
		snippet: (p.excerpt || '').replace(/<[^>]+>/g, ''),
	})).slice(0, 5);

	const bullets = sources.map(s => `- **${s.title}** — ${s.snippet || 'مزید معلومات کے لیے ذریعہ دیکھیں۔'}`).join('\n');
	const answer = `میں نے آپ کی تلاش "${query}" کے لیے چند معتبر ذرائع ڈھونڈے ہیں:\n\n${bullets}\n\nمزید تفصیل کے لیے درج ذیل روابط ملاحظہ کریں۔`;

	return { answer, sources };
}

export async function POST(req: Request) {
	try {
		const body = await req.json();
		const { query } = body || {};

		if (typeof query !== 'string' || !query.trim()) {
			return NextResponse.json({ error: 'Invalid payload' }, { status: 400 });
		}

		const hasKey = !!process.env.GOOGLE_GENAI_API_KEY;
		if (!hasKey) {
			const fallback = await wikipediaFallback(query);
			return NextResponse.json(fallback);
		}

		try {
			const result = await search({ query });
			return NextResponse.json(result);
		} catch (err) {
			const fallback = await wikipediaFallback(query);
			return NextResponse.json(fallback);
		}
	} catch (error: any) {
		return NextResponse.json({ error: error?.message || 'Internal Server Error' }, { status: 500 });
	}
} 