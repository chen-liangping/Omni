/**
 * 路由：/login
 * 页面：登录页（与根路径相同内容）
 * 实现：src/components/auth/passkey-login.tsx
 */
'use client'

import PasskeyLogin from '../../components/auth/passkey-login'

// 这段代码实现了 /login 路由的薄壳页面，与根路径共用同一套登录 UI
// 修改原因：便于后续在导航或跳转中直接使用 /login 路由，同时保持组件复用
export default function LoginPage() {
  return <PasskeyLogin />
}


