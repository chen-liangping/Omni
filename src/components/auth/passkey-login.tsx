'use client'

import React, { useEffect } from 'react'
import { App as AntApp, Button as AntButton } from 'antd'
import { UserOutlined } from '@ant-design/icons'
import { useRouter } from 'next/navigation'

// 这段代码实现了「登录页（Passkey 登录模拟）」的核心 UI，使用了 Ant Design 的 Button 和 Next.js 的 useRouter 路由跳转
// 代码说明：
// - 首次访问展示居中的 Sign In 页面，仅一个「Sign In with Passkey」按钮
// - 点击按钮不会做真实校验，只是在 localStorage 里打一个已登录标记，并跳转到 /environments（多环境菜单）
// - 如果本地已经登录（localStorage 标记存在），则直接重定向到 /environments，跳过登录页
export default function PasskeyLogin() {
  const router = useRouter()
  const { message: msg } = AntApp.useApp()

  useEffect(() => {
    if (typeof window === 'undefined') return
    const loggedIn = window.localStorage.getItem('omni_logged_in') === '1'
    if (loggedIn) {
      router.replace('/environments')
    }
  }, [router])

  const handleSignIn = () => {
    // 模拟登录：不做任何校验，直接标记为已登录并跳转
    if (typeof window !== 'undefined') {
      window.localStorage.setItem('omni_logged_in', '1')
    }
    msg.success('已使用 Passkey 登录（模拟）')
    router.push('/environments')
  }

  return (
    <div
      style={{
        minHeight: '60vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '40px 16px',
      }}
    >
      <h1 style={{ fontSize: 32, fontWeight: 700, color: '#1f1f3b', marginBottom: 32 }}>Sign In</h1>

      <AntButton
        type="primary"
        size="large"
        icon={<UserOutlined />}
        onClick={handleSignIn}
        style={{
          background: '#41446b',
          borderColor: '#41446b',
          padding: '0 32px',
          height: 56,
          borderRadius: 999,
          fontSize: 18,
          display: 'flex',
          alignItems: 'center',
          gap: 12,
          boxShadow: '0 10px 30px rgba(0,0,0,0.16)',
        }}
      >
        Sign In with Passkey
      </AntButton>

      <div style={{ marginTop: 24, fontSize: 14, color: '#6b7280' }}>
        Secure, fast, passwordless authentication
      </div>
    </div>
  )
}


