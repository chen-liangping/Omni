import './globals.css'
import { ReactNode } from 'react'
import { Inter } from 'next/font/google'
import { Providers } from '@/omni'
import { UserAvatarMenu } from '@/omni'
import { Menu } from 'antd'
import Link from 'next/link'


const inter = Inter({ subsets: ['latin'] })

export const metadata = {
  title: 'Omni Prototype',
  description: 'Next.js 15 App Router prototype',
}

export default function RootLayout({ children }: { children: ReactNode }) {
  // AppHeader：控制全局顶栏（用户信息 / 全局操作区域 / 顶栏样式）
  const AppHeader = () => {
    const currentUser: { name: string; avatar: string; role: string } = {
      name: 'fuyu',
      avatar: 'local',
      role: '管理员'
    }
    return (
      <header style={{
        background: '#f1f2f6',
        padding: '0 24px',
        borderBottom: '1px solid #f1f2f6',
        height: 56,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between'
      }}>
        {/* 平台名称（左侧） */}
        <div style={{ fontWeight: 700, fontSize: 18, letterSpacing: 0.2, color: 'var(--heading)' }}>Omni</div>
        {/* 用户头像与用户名展示区（可替换为下拉菜单等交互） */}
        <UserAvatarMenu user={currentUser} />
      </header>
    )
  }

  // AppSidebar：控制左侧边栏（导航结构与路由跳转）
  const AppSidebar = () => {
    return (
      <aside style={{ width: 200, flexShrink: 0 }}>
        {/* 侧边栏卡片容器：白底、圆角、阴影 */}
        <div style={{ background: '#fff', borderRadius: 10, boxShadow: '0 4px 20px rgba(0,0,0,0.06)', height: '100%', overflow: 'hidden' }}>
          <nav style={{ width: '100%', background: 'transparent', height: '100%' }}>
            <Menu
              mode="inline"
              defaultOpenKeys={["repository"]}
              style={{ height: '100%', borderRight: 0 }}
              items={[
                {
                  key: 'repository',
                  label: '仓库',
                  children: [
                    { key: 'repository-list', label: <Link href="/repositories">仓库列表</Link> },
                    { key: 'repository-apis', label: <Link href="/repositories/apis">接口调用情况</Link> }
                  ]
                },
                {
                  key: 'projects',
                  label: '项目',
                  children: [
                    { key: 'projects-list', label: <Link href="/projects">项目列表</Link> },
                    { key: 'webhooks', label: <Link href="/webhooks">Webhook 机器人</Link> },
                  ]
                }
               /*   
               { key: 'pipeline', label: <Link href="/pipeline">流水线</Link> },
                { key: 'release', label: <Link href="/release">定时发布</Link> }
                 */
                
              ]}
            />
          </nav>
        </div>
      </aside>
    )
  }

  // 页面主体骨架：控制全局布局（顶栏 / 侧栏容器 / 主内容容器 / 间距与卡片外观）
  return (
    <html lang="en">
      <body className={inter.className}>
        <Providers>
          <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
            <AppHeader />

            <div style={{ display: 'flex', flex: 1, gap: 12, padding: 12 }}>
              <AppSidebar />
              <main style={{ flex: 1 }}>
                {/* 主内容卡片容器：白底、圆角、阴影；与侧栏之间的 gap 让背景透出 */}
                <div style={{ background: '#fff', borderRadius: 12, boxShadow: '0 8px 28px rgba(0,0,0,0.08)', padding: 16, minHeight: 80 }}>
                  {children}
                </div>
              </main>
            </div>
          </div>
        </Providers>
      </body>
    </html>
  )
}

