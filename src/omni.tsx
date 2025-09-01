"use client"
import { ReactNode, useState } from 'react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import Image from 'next/image'
import { Dropdown, type MenuProps } from 'antd'
import { DownOutlined } from '@ant-design/icons'

/**
 * 这段代码实现了：
 * - Providers：在客户端注入 React Query 的 QueryClientProvider
 * - useToast：原型期轻量提示能力（默认 console；可后续替换为 AntD message/notification）
 * 使用了：React、@tanstack/react-query
 *
 * 代码说明：
 * - Providers 必须在客户端创建 QueryClient，因此文件使用 "use client"
 * - useToast 在原型期用 console 模拟，避免引入额外 UI 依赖
 * 修改原因：
 * - 将 hooks 和 provider 合并到一个运行时文件，集中管理、便于引用
 * 参考：TanStack Query https://tanstack.com/query/latest
 */

export function Providers({ children }: { children: ReactNode }) {
  const [queryClient] = useState(() => new QueryClient())
  return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
}

export function useToast() {
  return {
    toast: ({ title, description }: { title: string; description?: string }) => {
      // 交互注释：原型期用 console 模拟 toast；可无缝替换为 AntD message
      // 示例（后续可切换）：message.success({ content: title, description })
      // 这里保持最小实现，避免多余依赖
      // eslint-disable-next-line no-console
      console.log('TOAST', title, description)
    }
  }
}

// 用户头像下拉菜单（Header 右上角）
export type User = { name: string; avatar: string; role: string }

export function UserAvatarMenu({ user }: { user: User }) {
  const localPng = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR4nGNgYAAAAAMAASsJTYQAAAAASUVORK5CYII='
  const menuItems: MenuProps['items'] = [
    { key: 'profile', label: '个人资料' },
    { key: 'settings', label: '账号设置' },
    { type: 'divider' },
    { key: 'logout', label: '退出登录', danger: true },
  ]
  const handleMenuClick: MenuProps['onClick'] = ({ key }) => {
    if (key === 'profile') console.log('跳转到个人资料')
    if (key === 'settings') console.log('打开账号设置')
    if (key === 'logout') console.log('执行退出登录')
  }
  return (
    <Dropdown trigger={["click"]} placement="bottomRight" arrow menu={{ items: menuItems, onClick: handleMenuClick }}>
      <div style={{ display: 'flex', gap: 12, alignItems: 'center', cursor: 'pointer' }} onClick={(e) => e.preventDefault()}>
        <div style={{ width: 32, height: 32, position: 'relative' }}>
          <Image src={localPng} alt="avatar" fill style={{ borderRadius: 999, objectFit: 'cover' }} />
        </div>
        <div style={{ lineHeight: 1.2 }}>
          <div style={{ fontWeight: 600, marginBottom: 2 }}>{user.name}</div>
          <div style={{ fontSize: 12, color: '#666' }}>{user.role}</div>
        </div>
        <DownOutlined style={{ color: '#999', fontSize: 12 }} />
      </div>
    </Dropdown>
  )
}

