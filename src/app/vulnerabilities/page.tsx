'use client'

import VulnerabilityList from '@/components/vulnerabilities/vulnerability-list'

// 这段代码实现了“漏洞列表页”的路由薄壳，使用了 Next.js App Router
// 代码说明：仅返回业务组件，主体布局由全局 layout 控制
export default function Page() {
  return <VulnerabilityList />
}


