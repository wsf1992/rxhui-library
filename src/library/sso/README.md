# SSO 单点登录库

一个用于处理 OAuth SSO（单点登录）的 TypeScript 库，支持 Vue 插件方式集成。

## 安装

```bash
npm install rxhui-library
```

## 快速开始

### 作为 Vue 插件使用

```typescript
// main.ts

// 1、引入 SSO
import { sso } from 'rxhui-library' 


// 2、安装 SSO 插件（需要在 router 安装之后）
app.use(sso, {
  baseUrl: 'https://your-api-domain.com',
  loginCallback: (res) => {
    // 登录成功后的回调
    if (res.code === 200) {
      console.log('登录成功', res.data)
    }
  }
})

app.mount('#app')
```

## 配置选项

```typescript
interface SsoOptions {
  // API 基础地址，默认与当前页面同源
  baseUrl?: string
  
  // SSO 登录接口路径，默认 '/authAdminService/oauth/sso/login'
  url?: string
  
  // SSO 登出接口路径，默认 '/authAdminService/oauth/sso/logout'
  logoutUrl?: string
  
  // 登录回调函数
  loginCallback?: (res: SsoLoginResponse) => void
  
  // 自定义参数字段映射（对应 login 请求中参数取值,例如： login 请求中 clientId 参数默认会从 query.clientId 取值，配置后会从配置后的路由字段取值）
  props?: {
    clientId?: string      // 客户端ID参数名，默认 'clientId'
    grantType?: string     // 授权类型参数名，默认 'grantType'  
    tenantId?: string      // 租户ID参数名，默认 'tenantId'
    source?: string        // 渠道参数名，默认 'source'
    socialState?: string   // 第三方登录平台state参数名，默认 'socialState'
  }
}
```

## 工作原理

SSO 插件会自动在 Vue Router 的 `beforeEach` 守卫中检测 URL 参数。当检测到以下参数时会自动触发登录：

- `ssoLogin` - 标识使用 SSO 登录（可选标识参数）
- 或者 URL 中包含默认的 `tokenKey`（默认为 `code`）参数时，也会触发 SSO 登录
- `tokenKey` - 自定义 token 参数名（可选，用于指定使用哪个参数作为 code，如果 URL 中包含此参数，会动态更新 tokenKey 的值）

## 使用场景示例

### 第三方登录回调

当用户从第三方平台（如 Gitee、QQ）授权后，会重定向回你的应用：

```
https://your-app.com/callback?source=gitee&code=xxx
```

插件会自动检测 URL 中的 `ssoLogin` 参数或默认的 `code` 参数（tokenKey 默认为 'code'），并触发登录流程：

```typescript
app.use(sso, {
  baseUrl: 'https://api.your-app.com',
  loginCallback: (res) => {
    if (res.code === 200) {
      localStorage.setItem('token', res.data.token)
      router.push('/dashboard')
    } else {
      console.error('登录失败', res.message)
    }
  }
})
```

### 自定义参数名称

如果第三方平台返回的参数名与默认值不同，可以通过 `props` 配置映射：

```typescript
app.use(sso, {
  baseUrl: 'https://api.your-app.com',
  props: {
    clientId: 'client_id',     // URL 中使用 client_id 而不是 clientId
    tenantId: 'tenant_id',     // URL 中使用 tenant_id 而不是 tenantId
    source: 'platform',        // URL 中使用 platform 而不是 source
    socialState: 'state'       // URL 中使用 state 而不是 socialState
  },
  loginCallback: (res) => {
    // 处理登录结果
  }
})
```

### 自定义 tokenKey

如果需要使用自定义的 token 参数名，可以在 URL 中指定 `tokenKey` 参数：

```
https://your-app.com/callback?tokenKey=token&token=xxx&source=gitee
```

这样插件会将 `tokenKey` 设置为 `token`，并使用 URL 中 `token` 参数的值作为 `socialCode` 进行登录。

或者，如果第三方平台返回的参数名就是 `code`，可以直接使用：

```
https://your-app.com/callback?code=xxx&source=gitee
```

因为默认的 `tokenKey` 就是 `code`，插件会自动检测并触发登录。


## API 参考

### sso.install(app, options)

Vue 插件安装方法（通过 `app.use()` 调用时自动执行）。


### sso.oauthSsoLogout()

执行 SSO 登出操作。该方法会从 sessionStorage 中获取登录时保存的参数（tenantId 和 source），然后调用登出接口。

```typescript
// 在组件中使用
const { proxy } = getCurrentInstance()

// 执行登出
proxy.$sso.oauthSsoLogout().then(res => {
  console.log('登出结果', res)
  // 清除本地 token 等操作
  sessionStorage.removeItem('token')
})
```

### sso.isSsoLogin()

判断当前用户是否通过 SSO 登录。该方法从 sessionStorage 中读取登录状态。

```typescript
// 判断是否为 SSO 登录
const isSso = proxy.$sso.isSsoLogin()
// 返回 true 或 false
```

### sso.getSsoParams()

获取 SSO 存储的参数数据。该方法返回 sessionStorage 中保存的所有 SSO 相关参数。

```typescript
// 获取 SSO 参数
const params = proxy.$sso.getSsoParams()
// 返回 { clientId, grantType, tenantId, source, socialState, access_token, ... }
```

### sso.setStorage(value)

持久化存储数据到 sessionStorage，会与现有数据合并。

```typescript
// 存储额外的数据
proxy.$sso.setStorage({ customKey: 'customValue' })
```

### sso.getStorage()

从 sessionStorage 获取存储的数据。

```typescript
// 获取存储的数据
const data = proxy.$sso.getStorage()
```

## 在组件中访问

安装插件后，可以在 Vue 组件中通过 `$sso` 访问实例：

```vue
<script setup>
import { getCurrentInstance } from 'vue'

const { proxy } = getCurrentInstance()

// 判断是否为 SSO 登录
const isSso = proxy.$sso.isSsoLogin()

// 获取 SSO 参数
const params = proxy.$sso.getSsoParams()
</script>
```

或者在 Options API 中：

```vue
<script>
export default {
  mounted() {
    // 判断是否为 SSO 登录
    const isSso = this.$sso.isSsoLogin()
    
    // 获取 SSO 参数
    const params = this.$sso.getSsoParams()
  }
}
</script>
```

## 许可证

MIT
