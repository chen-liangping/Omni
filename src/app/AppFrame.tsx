'use client'

import React, { type ReactNode } from 'react'
import { Menu } from 'antd'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { ProjectSwitcher } from '@/components/layout/ProjectSwitcher'
import { UserAvatarMenu } from '@/omni'
import Comments from '@/components/comments'

// 这段代码实现了应用级骨架：根据当前路由决定是否展示 Header + Sidebar
// - 登录相关页面（/ 和 /login）只展示登录内容，不显示菜单和头部
// - 其它业务页面保持原有后台布局（顶部导航 + 左侧菜单 + 内容卡片）
export function AppFrame({ children }: { children: ReactNode }) {
  const pathname = usePathname()
  const isAuthPage = pathname === '/' || pathname === '/login'

  if (isAuthPage) {
    // 登录页：不展示头部和侧边栏，让登录内容居中展示
    return (
      <div
        style={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: '#f5f5f7',
          padding: '40px 16px',
        }}
      >
        <div style={{ width: '100%', maxWidth: 640 }}>
          {children}
        </div>
      </div>
    )
  }

  const currentUser: { name: string; avatar: string; role: string } = {
    name: 'fuyu',
    avatar: 'local',
    role: '管理员'
  }

  const AppHeader = () => (
    <header
      style={{
        background: '#ffffff',
        padding: '0 24px',
        borderBottom: '1px solid #f0f0f0',
        height: 56,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
      }}
    >
      {/* 左侧：仅展示项目切换，下拉内容与当前项目名称 */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <ProjectSwitcher />
      </div>
      {/* 右侧：用户头像与用户名展示区（可替换为下拉菜单等交互） */}
      <UserAvatarMenu user={currentUser} />
    </header>
  )

  const AppSidebar = () => (
    <aside style={{ width: 220, flexShrink: 0 }}>
      {/* 侧边栏：全高白底 + 右侧细分割线，风格对齐截图中的左侧导航 */}
      <div
        style={{
          background: '#ffffff',
          borderRight: '1px solid #f0f0f0',
          height: '100%',
          overflow: 'hidden',
        }}
      >
        <nav style={{ width: '100%', background: 'transparent', height: '100%', padding: '8px 0' }}>
          <Menu
            mode="inline"
            defaultOpenKeys={['internal-repos', 'security', 'logs']}
            style={{ height: '100%', borderRight: 0 }}
            items={[
              {
                key: 'internal-repos',
                label: '社内资源',
                children: [
                  /*{ key: 'repository-list', label: <Link href="/repositories">仓库</Link> },*/
                  { key: 'projects-list', label: <Link href="/environments">多环境</Link> },
                ]
              },
              {
                key: 'security',
                label: '安全合规',
                children: [
                 /* { key: 'vuln-dashboard', label: <Link href="/vulnerabilities/dashboard">总览</Link> }, */
                  { key: 'vuln-list', label: <Link href="/vulnerabilities">漏洞列表</Link> },
                /*  { key: 'vuln-config', label: <Link href="/vulnerabilities/config">漏洞扫描(待开发)</Link> } */
                ]
              },
              /*
              {
                key: 'permissions-mgmt',
                label: '权限管理',
                children: [
                  { key: 'role-list', label: <Link href="/permissions/roles">角色列表</Link> },
                  { key: 'member-list', label: <Link href="/permissions/members">成员管理</Link> }
                ]
              },
              {
                key: 'logs',
                label: '日志',
                children: [
                  { key: 'api-calls', label: <Link href="/permissions">接口调用</Link> },
                  { key: 'audit-logs', label: <Link href="/permissions/audit-logs">操作日志</Link> }
                ]
              },
              {
                key: 'alerts',
                label: '社内告警(待开发)',
                children: [
                  { key: 'alert-list', label: <Link href="/alerts">告警列表</Link> },
                  { key: 'alert-config', label: <Link href="/alerts/config">告警配置</Link> }
                ]
              },
              {
                key: 'settings',
                label: '费用报表(待开发)',
                children: [
                  { key: 'expense-report', label: <Link href="/expenses">费用报表</Link> }
                ]
              }
              */
            ]}
          />
        </nav>
      </div>
    </aside>
  )

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <AppHeader />

      <div style={{ display: 'flex', flex: 1, gap: 12, padding: 12, boxSizing: 'border-box', overflow: 'hidden' }}>
        <AppSidebar />
        <main style={{ flex: 1, minWidth: 0 }}>
          {/* 主内容容器：白底 + 细边框，弱化阴影，更接近后台管理风格 */}
          <div
            style={{
              background: '#ffffff',
              borderRadius: 8,
              border: '1px solid #f0f0f0',
              padding: '16px 16px 16px 6px',
              minHeight: 80,
              overflow: 'hidden',
            }}
          >
            {children}
            {!isAuthPage && <Comments />}
          </div>
        </main>
      </div>
    </div>
  )
}


