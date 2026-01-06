/**
 * 扩展 Window 接口，声明全局配置对象
 */
declare global {
  interface Window {
    config?: {
      VITE_CHANNEL_CODE?: string;
      [key: string]: any;
    };
  }
}

/**
 * SSO 构造函数配置选项
 */
export interface SsoOptions {
  /** SSO 登录接口URL，默认值：'/authAdminService/oauth/sso/login' */
  url?: string;
  /** SSO 登出接口URL，默认值：'/authAdminService/oauth/sso/logout' */
  logoutUrl?: string;
  /** 基础URL地址 */
  baseUrl?: string;
  /** 自定义参数字段映射 */
  props?: {
    /** 客户端ID参数名，默认 'clientId' */
    clientId?: string;
    /** 授权类型参数名，默认 'grantType' */
    grantType?: string;
    /** 租户ID参数名，默认 'tenantId' */
    tenantId?: string;
    /** 渠道参数名，默认 'source' */
    source?: string;
    /** 第三方登录平台state参数名，默认 'socialState' */
    socialState?: string;
  };
  /** 登录回调函数 */
  loginCallback?: (res: SsoLoginResponse) => void;
}

/**
 * OAuth SSO 登录参数
 */
export interface OauthSsoLoginParams {
  /** 客户端ID，默认值：'e5cd7e4891bf95d1d19206ce24a7b32e' */
  clientId?: string;
  /** 授权类型，默认值：'social' */
  grantType?: string;
  /** 租户ID */
  tenantId?: string;
  /** 渠道（qq、gitee等） */
  source?: string;
  /** 第三方登录平台的code */
  socialCode?: string;
  /** 第三方登录平台的state */
  socialState?: string;
  /** SSO Token，URL中携带此参数时触发自动登录 */
  ssoToken?: string;
  /** 自定义 tokenKey 参数名 */
  tokenKey?: string;
  /** 其他额外参数 */
  [key: string]: any;
}

/**
 * SSO 登录响应数据
 */
export interface SsoLoginResponse<T = any> {
  /** 响应状态码 */
  code: number;
  /** 响应数据 */
  data?: T;
  /** 响应消息 */
  message?: string;
}

/**
 * 路由对象接口
 */
export interface Router {
  beforeEach: (guard: NavigationGuard) => void;
  [key: string]: any;
}

/**
 * 路由导航守卫
 */
export type NavigationGuard = (
  to: RouteLocationNormalized,
  from: RouteLocationNormalized,
  next: NavigationGuardNext
) => void | Promise<void>;

/**
 * 路由位置标准化对象
 */
export interface RouteLocationNormalized {
  query?: Record<string, any>;
  [key: string]: any;
}

/**
 * 导航守卫next函数
 */
export type NavigationGuardNext = () => void;

/**
 * Vue应用实例接口
 */
export interface App {
  config: {
    globalProperties: Record<string, any>;
  };
  [key: string]: any;
}

/**
 * SSO 类接口
 */
export interface ISso {
  /** SSO 登录接口URL */
  url: string;
  /** SSO 登出接口URL */
  logoutUrl: string;
  /** 返回的JSON数据 */
  retJSon: any;
  /** 基础URL地址 */
  baseUrl: string | null;
  /** 客户端ID参数名 */
  clientId: string;
  /** 授权类型参数名 */
  grantType: string;
  /** 租户ID参数名 */
  tenantId: string;
  /** 渠道参数名 */
  source: string;
  /** 第三方登录平台state参数名 */
  socialState: string;
  /** 登录回调函数 */
  loginCallback: ((res: SsoLoginResponse) => void) | null;
  /** Token 参数名，用于从 URL 中获取 socialCode */
  tokenKey: string;

  /**
   * 持久化存储数据到 sessionStorage
   * @param value - 要存储的数据对象，会与现有数据合并
   */
  setStorage(value: any): void;

  /**
   * 从 sessionStorage 获取存储的数据
   * @returns 存储的数据对象
   */
  getStorage(): Record<string, any>;

  /**
   * 清除 sessionStorage 中的 SSO 数据
   */
  clearStorage(): void;

  /**
   * 设置配置选项
   * @param options - 配置选项
   */
  setOptions(options: SsoOptions): void;

  /**
   * OAuth SSO 登录
   * @param params - 登录参数
   * @param coverParams - 是否覆盖参数，默认为 false。如果为 true，则直接使用 params 中的所有参数
   * @returns Promise<SsoLoginResponse>
   */
  oauthSsoLogin(params: OauthSsoLoginParams, coverParams?: boolean): Promise<SsoLoginResponse>;

  /**
   * OAuth SSO 登出
   * @returns Promise<SsoLoginResponse>
   */
  oauthSsoLogout(): Promise<SsoLoginResponse>;

  /**
   * 路由前置守卫
   * @param to - 目标路由
   * @param from - 来源路由
   */
  routerBeforeEach(to: RouteLocationNormalized, from: RouteLocationNormalized): Promise<any>;

  /**
   * 判断当前用户是否通过 SSO 登录
   * @returns 是否为 SSO 登录
   */
  isSsoLogin(): boolean;

  /**
   * 获取 SSO 存储的参数数据
   * @returns SSO 参数字典
   */
  getSsoParams(): Record<string, any>;

  /**
   * Vue 插件安装方法
   * @param app - Vue 应用实例
   * @param options - 配置选项
   */
  install(app: App, options: SsoOptions): void;
}
