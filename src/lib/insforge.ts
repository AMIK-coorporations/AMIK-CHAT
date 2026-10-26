import { createClient } from '@insforge/sdk';

const baseUrl = process.env.NEXT_PUBLIC_INSFORGE_API_BASE_URL || 'https://484txp7m.ap-southeast.insforge.app';

const anonKey = process.env.NEXT_PUBLIC_INSFORGE_ANON_KEY || '';

// لاگ اِن سیشن کی کوکی (insforge_refresh_token) اپنے ڈومین پر رکھنے کے لیے
// صرف /api/auth/* والی درخواستیں اسی ویب سائٹ کے ذریعے بھیجی جاتی ہیں
// (next.config.mjs میں rewrite انہیں InsForge تک پہنچاتا ہے)۔
// باقی سب (ڈیٹا بیس، اسٹوریج، ریئل ٹائم) پہلے کی طرح سیدھا InsForge پر جاتا ہے۔
const sameOriginAuthFetch: typeof fetch = (input, init) => {
    if (typeof window !== 'undefined') {
        try {
            const raw = input instanceof Request ? input.url : String(input);
            const url = new URL(raw);
            const base = new URL(baseUrl);
            if (url.origin === base.origin && url.pathname.startsWith('/api/auth/')) {
                const proxied = `${window.location.origin}${url.pathname}${url.search}`;
                if (input instanceof Request) {
                    return fetch(new Request(proxied, input), init);
                }
                return fetch(proxied, init);
            }
        } catch {
            // اگر URL پڑھا نہ جا سکے تو عام طریقے سے بھیج دیں
        }
    }
    return fetch(input, init);
};

export const insforge = createClient({
    baseUrl,
    anonKey,
    fetch: sameOriginAuthFetch,
});

export const db_insforge = insforge.database;
