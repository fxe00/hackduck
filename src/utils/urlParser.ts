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
    
    // 排除动态请求扩展名（这些通常是业务API，不是静态资源）
    const dynamicExtensions = ['do', 'action', 'jsp', 'asp', 'aspx', 'php', 'cgi', 'py', 'rb', 'pl'];
    const extension = this.getFileExtension(url);
    if (extension && dynamicExtensions.includes(extension)) {
      return false; // 动态请求扩展名不应该被判定为分析请求
    }
    
    // 检查文件扩展名
    if (extension && ['gif', 'png', 'jpg', 'jpeg'].includes(extension)) {
      // 检查是否是分析请求的图片（需要精确匹配路径）
      const analyticsImagePatterns = [
        '/sa.gif', '/analytics.gif', '/track.gif', '/beacon.gif',
        '/pixel.gif', '/count.gif', '/log.gif'
      ];
      
      return analyticsImagePatterns.some(pattern => lowerUrl.includes(pattern));
    }

    // 检查URL路径（需要更精确的匹配，避免误判业务API）
    // 只匹配明确的分析服务路径，而不是包含关键词的任意路径
    const analyticsPathPatterns = [
      '/analytics/', '/analytics.js', '/analytics.php',
      '/track/', '/track.js', '/track.php',
      '/beacon/', '/beacon.js', '/beacon.php',
      '/gtag/', '/gtag.js',
      '/ga.js', '/gtm.js', '/analytics.js',
      '/pixel/', '/pixel.js',
      '/count/', '/count.js',
      '/log/', '/log.js',
      '/stats/', '/stats.js',
      '/metric/', '/metric.js',
      '/measure/', '/measure.js',
      '/monitor/', '/monitor.js',
      '/report/', '/report.js',
      '/collect.js', '/collect.php', '/collect.gif', // 只匹配明确的收集脚本
      '/sa.gif', '/analytics.gif'
    ];

    // 检查是否匹配分析服务路径
    const matchesAnalyticsPath = analyticsPathPatterns.some(pattern => {
      // 确保是完整的路径匹配，而不是部分匹配
      return lowerUrl.includes(pattern);
    });

    if (matchesAnalyticsPath) {
      return true;
    }

    // 检查查询参数中的分析关键词（更宽松的匹配）
    try {
      const parsed = new UrlParse(url);
      const query = parsed.query.toLowerCase();
      const analyticsQueryKeywords = [
        'utm_source', 'utm_medium', 'utm_campaign', 'utm_term', 'utm_content',
        'ga', 'gid', 'gtm', 'analytics', 'tracking', 'beacon'
      ];
      
      return analyticsQueryKeywords.some(keyword => query.includes(keyword));
    } catch {
      // 解析失败，返回 false
      return false;
    }
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
