/**
 * 路由：/ （根路径）
 * 页面：登录页（模拟 Passkey 登录）
 * 实现：src/components/auth/passkey-login.tsx
 */
'use client'

import PasskeyLogin from '../components/auth/passkey-login'

// 这段代码实现了“薄壳”首页：默认进入登录页，登录完成后跳转到多环境页面
// 代码说明：UI 骨架（Header/Sidebar/卡片外观）由 layout.tsx 统一控制，这里只负责渲染登录业务组件
export default function Home() {
  return <PasskeyLogin />
}
