// HTTP请求相关类型定义
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
  cookies?: chrome.cookies.Cookie[]; // 从chrome.cookies API获取的完整cookie信息
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

// 消息类型定义
export interface Message {
  type: 'REQUEST_CAPTURED' | 'REQUEST_SELECTED' | 'REQUEST_SEND' | 'TOGGLE_INTERCEPT' | 'CLEAR_REQUESTS' | 'GET_REQUESTS' | 'GET_CURRENT_TAB' | 'GET_COOKIES_FOR_DOMAIN' | 'CHECK_AND_MARK_PANEL_CREATION' | 'PANEL_CREATED_SUCCESS' | 'PANEL_CREATION_FAILED' | 'REQUEST_UPDATED' | 'RESPONSE_CAPTURED' | 'SEND_REQUEST';
  data?: any;
}

// 存储键名
export const STORAGE_KEYS = {
  REQUESTS: 'hackduck_requests',
  SETTINGS: 'hackduck_settings',
  INTERCEPTING: 'hackduck_intercepting'
} as const;
