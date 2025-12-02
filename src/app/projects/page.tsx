/**
 * 路由：/projects
 * 页面：多环境 - 项目列表（薄壳，兼容旧路径）
 * 实现：src/components/environments/projects-overview.tsx
 */
"use client"
import ProjectsOverview from '@/components/environments/projects-overview'

// 兼容旧地址，将 /projects 显示为新的“多环境项目列表”
export default function ProjectsListRoute() {
  return <ProjectsOverview />
}

