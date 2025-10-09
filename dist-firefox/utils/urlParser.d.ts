/**
 * URL解析工具类
 * 用于准确提取URL的各个组件，特别是文件扩展名
 */
export declare class URLParser {
    /**
     * 解析URL并提取文件扩展名
     * @param url 要解析的URL
     * @returns 文件扩展名（不包含点号），如果没有扩展名则返回null
     */
    static getFileExtension(url: string): string | null;
    /**
     * 检查URL是否为静态资源
     * @param url 要检查的URL
     * @returns 是否为静态资源
     */
    static isStaticResource(url: string): boolean;
    /**
     * 检查URL是否为分析/统计请求
     * @param url 要检查的URL
     * @returns 是否为分析请求
     */
    static isAnalyticsRequest(url: string): boolean;
    /**
     * 检查URL是否为字体文件
     * @param url 要检查的URL
     * @returns 是否为字体文件
     */
    static isFontRequest(url: string): boolean;
    /**
     * 检查URL是否为favicon请求
     * @param url 要检查的URL
     * @returns 是否为favicon请求
     */
    static isFaviconRequest(url: string): boolean;
    /**
     * 检查URL是否包含静态资源路径
     * @param url 要检查的URL
     * @returns 是否包含静态资源路径
     */
    static hasStaticPath(url: string): boolean;
    /**
     * 综合判断URL是否应该被过滤（隐藏）
     * @param url 要检查的URL
     * @returns 是否应该被过滤
     */
    static shouldFilter(url: string): boolean;
    /**
     * 获取URL的域名
     * @param url 要解析的URL
     * @returns 域名，解析失败返回null
     */
    static getDomain(url: string): string | null;
    /**
     * 获取URL的路径部分
     * @param url 要解析的URL
     * @returns 路径，解析失败返回null
     */
    static getPath(url: string): string | null;
}
