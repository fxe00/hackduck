import UrlParse from 'url-parse';

/**
 * URL解析工具类
 * 用于准确提取URL的各个组件，特别是文件扩展名
 */
export class URLParser {
  /**
   * 解析URL并提取文件扩展名
   * @param url 要解析的URL
   * @returns 文件扩展名（不包含点号），如果没有扩展名则返回null
   */
  static getFileExtension(url: string): string | null {
    try {
      const parsed = new UrlParse(url);
      const pathname = parsed.pathname;
      
      // 从路径中提取文件名
      const filename = pathname.split('/').pop();
      if (!filename) return null;
      
      // 提取扩展名
      const lastDotIndex = filename.lastIndexOf('.');
      if (lastDotIndex === -1 || lastDotIndex === filename.length - 1) {
        return null;
      }
      
      return filename.substring(lastDotIndex + 1).toLowerCase();
    } catch (error) {
      console.warn('Failed to parse URL:', url, error);
      return null;
    }
  }

  /**
   * 检查URL是否为静态资源
   * @param url 要检查的URL
   * @returns 是否为静态资源
   */
  static isStaticResource(url: string): boolean {
    const extension = this.getFileExtension(url);
    if (!extension) return false;

    const staticExtensions = [
      'js', 'css', 'png', 'jpg', 'jpeg', 'gif', 'svg', 'ico',
      'woff', 'woff2', 'ttf', 'eot', 'otf', 'mp4', 'mp3', 'wav',
      'pdf', 'zip', 'rar', '7z', 'tar', 'gz', 'webp', 'avif',
      'bmp', 'tiff', 'psd', 'ai', 'eps', 'raw', 'cr2', 'nef'
    ];

    return staticExtensions.includes(extension);
  }

  /**
   * 检查URL是否为分析/统计请求
   * @param url 要检查的URL
   * @returns 是否为分析请求
   */
  static isAnalyticsRequest(url: string): boolean {
    const lowerUrl = url.toLowerCase();
    
    // 检查文件扩展名
    const extension = this.getFileExtension(url);
    if (extension && ['gif', 'png', 'jpg', 'jpeg'].includes(extension)) {
      // 检查是否是分析请求的图片
      const analyticsPatterns = [
        '/sa.gif', '/analytics', '/track', '/beacon', '/collect',
        '/gtag', '/ga.js', '/gtm.js', '/pixel', '/count', '/log',
        '/stats', '/metric', '/measure', '/monitor', '/report'
      ];
      
      return analyticsPatterns.some(pattern => lowerUrl.includes(pattern));
    }

    // 检查URL路径和查询参数
    const analyticsKeywords = [
      'analytics', 'track', 'beacon', 'collect', 'gtag', 'pixel',
      'count', 'log', 'stats', 'metric', 'measure', 'monitor',
      'report', 'sa.gif', 'ga.js', 'gtm.js'
    ];

    return analyticsKeywords.some(keyword => lowerUrl.includes(keyword));
  }

  /**
   * 检查URL是否为字体文件
   * @param url 要检查的URL
   * @returns 是否为字体文件
   */
  static isFontRequest(url: string): boolean {
    const extension = this.getFileExtension(url);
    if (!extension) return false;

    const fontExtensions = ['woff', 'woff2', 'ttf', 'eot', 'otf'];
    return fontExtensions.includes(extension);
  }

  /**
   * 检查URL是否为favicon请求
   * @param url 要检查的URL
   * @returns 是否为favicon请求
   */
  static isFaviconRequest(url: string): boolean {
    const lowerUrl = url.toLowerCase();
    return lowerUrl.includes('favicon.ico') || lowerUrl.includes('favicon');
  }

  /**
   * 检查URL是否包含静态资源路径
   * @param url 要检查的URL
   * @returns 是否包含静态资源路径
   */
  static hasStaticPath(url: string): boolean {
    const lowerUrl = url.toLowerCase();
    const staticPaths = [
      '/static/', '/assets/', '/css/', '/js/', '/images/', '/img/',
      '/fonts/', '/media/', '/public/', '/resources/', '/dist/',
      '/build/', '/vendor/', '/lib/', '/components/'
    ];

    return staticPaths.some(path => lowerUrl.includes(path));
  }

  /**
   * 综合判断URL是否应该被过滤（隐藏）
   * @param url 要检查的URL
   * @returns 是否应该被过滤
   */
  static shouldFilter(url: string): boolean {
    return this.isStaticResource(url) ||
           this.isAnalyticsRequest(url) ||
           this.isFontRequest(url) ||
           this.isFaviconRequest(url) ||
           this.hasStaticPath(url);
  }

  /**
   * 获取URL的域名
   * @param url 要解析的URL
   * @returns 域名，解析失败返回null
   */
  static getDomain(url: string): string | null {
    try {
      const parsed = new UrlParse(url);
      return parsed.hostname;
    } catch (error) {
      console.warn('Failed to extract domain from URL:', url, error);
      return null;
    }
  }

  /**
   * 获取URL的路径部分
   * @param url 要解析的URL
   * @returns 路径，解析失败返回null
   */
  static getPath(url: string): string | null {
    try {
      const parsed = new UrlParse(url);
      return parsed.pathname;
    } catch (error) {
      console.warn('Failed to extract path from URL:', url, error);
      return null;
    }
  }
}
