declare const originalFetch: ((input: RequestInfo | URL, init?: RequestInit) => Promise<Response>) & typeof fetch;
interface ExtendedXMLHttpRequest extends XMLHttpRequest {
    _hackduckMethod?: string;
    _hackduckUrl?: string;
}
declare const originalXHROpen: {
    (method: string, url: string | URL): void;
    (method: string, url: string | URL, async: boolean, username?: string | null, password?: string | null): void;
};
declare const originalXHRSend: (body?: Document | XMLHttpRequestBodyInit | null) => void;
