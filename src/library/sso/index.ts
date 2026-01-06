import type {
    ISso,
    SsoOptions,
    OauthSsoLoginParams,
    SsoLoginResponse,
    RouteLocationNormalized,
    App
} from './types'

class Sso implements ISso {
    url: string
    logoutUrl: string
    retJSon: any
    baseUrl: string | null
    clientId: string
    grantType: string
    tenantId: string
    source: string
    socialState: string
    loginCallback: ((res: SsoLoginResponse) => void) | null
    tokenKey: string

    constructor() {
        this.retJSon = null
        this.tokenKey = 'code'
        this.url = ''
        this.logoutUrl = ''
        this.baseUrl = null
        this.clientId = 'clientId'
        this.grantType = 'grantType'
        this.tenantId = 'tenantId'
        this.source = 'source'
        this.socialState = 'socialState'
        this.loginCallback = null
    }

    // 持久化存储
    setStorage(value: any) {
        const params = this.getStorage()
        sessionStorage.setItem('ssoStorage', JSON.stringify({
            ...params,
            ...value
        }))
    }
    getStorage() {
        return JSON.parse(sessionStorage.getItem('ssoStorage') || '{}')
    }
    clearStorage() {
        sessionStorage.removeItem('ssoStorage')
    }

    setOptions(options: SsoOptions) {
        this.url = options.url || '/authAdminService/oauth/sso/login'
        this.logoutUrl = options.logoutUrl || '/authAdminService/oauth/sso/logout'
        this.baseUrl = options.baseUrl || ''
        if (options.props) {
            if (options.props.clientId) {
                this.clientId = options.props.clientId
            }
            if (options.props.grantType) {
                this.grantType = options.props.grantType
            }
            if (options.props.tenantId) {
                this.tenantId = options.props.tenantId
            }
            if (options.props.source) {
                this.source = options.props.source
            }
            if (options.props.socialState) {
                this.socialState = options.props.socialState
            }
        }
        this.loginCallback = options.loginCallback || null
    }

    oauthSsoLogin(params: OauthSsoLoginParams, coverParams = false): Promise<SsoLoginResponse> {
        let postParams: Record<string, any> = {
            clientId: params[this.clientId] || 'e5cd7e4891bf95d1d19206ce24a7b32e',
            grantType: params[this.grantType] || 'social', // 授权类型，默认值（social）
            tenantId: params[this.tenantId] || window?.config?.VITE_CHANNEL_CODE,
            source: params[this.source], // 渠道（qq、gitee）
            socialCode: params[this.tokenKey], // 第三方登录平台[code]
            socialState: params[this.socialState]
        }
        if (coverParams) {
            postParams = { ...params }
        }
        this.setStorage(
            postParams
        )
        return fetch(this.baseUrl + this.url, {
            method: 'POST',
            body: JSON.stringify(postParams),
            headers: {
                'bizCode': 'llm',
                'clientid': 'e5cd7e4891bf95d1d19206ce24a7b32e',
                'Content-Type': 'application/json'
            }
        }).then(res => {
            return res.json()
        })
    }

    oauthSsoLogout() {
        const params = this.getStorage()
        let postParams: Record<string, any> = {
            tenantId: params.tenantId,
            channel: params.source
        }
        return fetch(this.baseUrl + this.logoutUrl, {
            method: 'POST',
            body: JSON.stringify(postParams),
            headers: {
                'bizCode': 'llm',
                'clientid': 'e5cd7e4891bf95d1d19206ce24a7b32e',
                'Content-Type': 'application/json',
                'Authorization': 'Bearer ' + params.access_token
            }
        }).then(async res => {
            const json = await res.json()
            console.log('oauthSsoLogout', json)
            if (json.code === 200) {
                this.clearStorage()
            }
            return json
        })
    }

    async routerBeforeEach(to: RouteLocationNormalized, _from: RouteLocationNormalized): Promise<any> {
        // 判断是不是 sso 登录
        if (to.query && ('ssoLogin' in to.query || this.tokenKey in to.query)) {
            this.clearStorage()
            // 判断是否指定 tokenKey
            if (to.query.tokenKey) {
                this.tokenKey = to.query.tokenKey
            }
            const res = await this.oauthSsoLogin(to.query)
            this.loginCallback && this.loginCallback(res)
            if (res.code !== 200) return false
            // 登录成功
            this.setStorage({
                isSsoLogin: true,
                ...res.data
            })
        }
    }

    isSsoLogin(): boolean {
        const params = this.getStorage()
        return params.isSsoLogin === true
    }

    getSsoParams(): Record<string, any> {
        return this.getStorage()
    }

    install(app: App, options: SsoOptions) {
        // 配置此应用
        this.setOptions(options)
        const router = app.config.globalProperties.$router
        if (!router) {
            throw new Error('SSO Plugin requires Vue Router. Please install it first.')
        } else {
            router.beforeEach(this.routerBeforeEach.bind(this))
        }
        app.config.globalProperties.$sso = this
    }

}

// 导出单例实例
export const sso = new Sso()
