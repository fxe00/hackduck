export interface HttpRequest {
    id: string;
    url: string;
    method: string;
    headers: Record<string, string>;
    body?: string;
    timestamp: number;
    status?: number;
    responseTime?: number;
    responseHeaders?: Record<string, string>;
    responseBody?: string;
    tabId: number | null;
}
export interface HttpResponse {
    id: string;
    status: number;
    statusText: string;
    headers: Record<string, string>;
    body?: string;
    timestamp: number;
}
export interface RequestFilter {
    url?: string;
    method?: string;
    status?: number;
    timeRange?: {
        start: number;
        end: number;
    };
}
export interface HackDuckState {
    isIntercepting: boolean;
    requests: HttpRequest[];
    selectedRequest?: HttpRequest;
    filters: RequestFilter;
}
export interface Message {
    type: 'REQUEST_CAPTURED' | 'REQUEST_SELECTED' | 'REQUEST_SEND' | 'TOGGLE_INTERCEPT' | 'CLEAR_REQUESTS' | 'GET_REQUESTS' | 'REQUEST_UPDATED' | 'RESPONSE_CAPTURED' | 'SEND_REQUEST';
    data?: any;
}
export declare const STORAGE_KEYS: {
    readonly REQUESTS: "hackduck_requests";
    readonly SETTINGS: "hackduck_settings";
    readonly INTERCEPTING: "hackduck_intercepting";
};
