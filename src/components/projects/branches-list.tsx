"use client"
import React, { useMemo, useState } from 'react'
import Link from 'next/link'
import { Table as AntTable, Button as AntButton, Space, Tag, message, Popover, Input, Checkbox, Divider, Empty } from 'antd'
import type { ColumnsType } from 'antd/es/table'
import type { TablePaginationConfig } from 'antd/es/table/interface'
import { ReloadOutlined, EyeOutlined, DeleteOutlined, StarFilled, StarOutlined, DownOutlined, SearchOutlined, BranchesOutlined, DotChartOutlined } from '@ant-design/icons'

interface RepoEnvRow {
  repoId: string;
  repoName: string;
  activeBranch: string;
  shortCommitId: string;
  commitMessage: string;
  envUrl: string;
  latestDeployAt: string;
  lastDeployer: string;
}

// 这段代码实现了「仓库有效分支一览」列表，使用了 Ant Design Table 与 React
// 代码说明：
// - 列表包含：仓库名、生效分支、短 Commit、环境 URL、最新部署时间、最后部署人、操作
// - 点击“查看”进入项目详情；“日志详情”在详情页内
export default function BranchesList() {
  // 模拟项目列表与收藏
  const allProjects: { id: string; name: string; team: string }[] = [
    { id: 'p-all', name: '全部项目', team: 'all' },
    { id: 'p-a', name: 'Team A 项目', team: 'team-a' },
    { id: 'p-b', name: 'Team B 项目', team: 'team-b' },
    { id: 'p-ml', name: 'ML 平台', team: 'ml' },
  ]
  const [favoriteProjectIds, setFavoriteProjectIds] = useState<string[]>(['p-a'])
  const [currentProjectId, setCurrentProjectId] = useState<string>('p-all')
  const [projectSearch, setProjectSearch] = useState<string>('')

  // 仓库有效分支数据（示例）
  const baseData: RepoEnvRow[] = [
    { repoId: '1', repoName: 'order-service', activeBranch: 'feature/login-fix', shortCommitId: 'a1b2c3d', commitMessage: '登录异常处理与埋点修复', envUrl: 'order-service-feature-login-fix.stg.g123.jp', latestDeployAt: '2025-03-21 14:55:37', lastDeployer: '张米' },
    { repoId: '2', repoName: 'user-service', activeBranch: 'release-1.0', shortCommitId: 'f6g7h8i', commitMessage: '发布 1.0 稳定版', envUrl: 'user-service-release-1-0.stg.g123.jp', latestDeployAt: '2025-03-21 14:55:37', lastDeployer: '李米' },
    { repoId: '3', repoName: 'payment-api', activeBranch: 'hotfix-22', shortCommitId: 'j9k0l1m', commitMessage: '支付回调健壮性 hotfix', envUrl: 'payment-api-hotfix-22.stg.g123.jp', latestDeployAt: '2025-03-21 14:55:37', lastDeployer: '王米' },
    { repoId: '4', repoName: 'inventory-service', activeBranch: 'release-2.0', shortCommitId: 'x1y2z3', commitMessage: '库存同步性能优化', envUrl: 'inventory-service-release-2-0.stg.g123.jp', latestDeployAt: '2025-03-21 14:55:37', lastDeployer: '赵六' },
    { repoId: '5', repoName: 'auth-service', activeBranch: 'feature/security', shortCommitId: 's3c9u1', commitMessage: '登录安全策略升级', envUrl: 'auth-service-feature-security.stg.g123.jp', latestDeployAt: '2025-03-21 14:55:37', lastDeployer: '王武' },
    { repoId: '6', repoName: 'checkout-ui', activeBranch: 'release-2.1', shortCommitId: 'a7b7c7', commitMessage: '结算页 UX 打磨', envUrl: 'checkout-ui-release-2-1.stg.g123.jp', latestDeployAt: '2025-03-21 14:55:37', lastDeployer: '斑斑' },
    { repoId: '7', repoName: 'profile-ui', activeBranch: 'feature/theme', shortCommitId: 'k3j9p1', commitMessage: '主题色与字体调整', envUrl: 'profile-ui-feature-theme.stg.g123.jp', latestDeployAt: '2025-03-21 14:55:37', lastDeployer: '李铁' },
  ]
  // 当前项目筛选的仓库（原型：仅做演示，使用 repoId 奇偶分配）
  const projectFiltered = useMemo(() => {
    if (currentProjectId === 'p-all') return baseData
    if (currentProjectId === 'p-a') return baseData.filter((r) => Number(r.repoId) % 2 === 1)
    if (currentProjectId === 'p-b') return baseData.filter((r) => Number(r.repoId) % 2 === 0)
    return baseData
  }, [baseData, currentProjectId])

  // 仓库搜索（基于名称包含）
  const [repoSearch, setRepoSearch] = useState<string>('')
  const searchedData = useMemo(() => {
    const kw = repoSearch.trim().toLowerCase()
    if (!kw) return projectFiltered
    return projectFiltered.filter((r) => r.repoName.toLowerCase().includes(kw))
  }, [projectFiltered, repoSearch])

  // 分页（受控）
  const [currentPage, setCurrentPage] = useState<number>(1)
  const [pageSize, setPageSize] = useState<number>(5)
  const total = searchedData.length
  const pageData = useMemo(() => {
    const start = (currentPage - 1) * pageSize
    return searchedData.slice(start, start + pageSize)
  }, [searchedData, currentPage, pageSize])

  const columns: ColumnsType<RepoEnvRow> = [
    {
      title: '仓库名',
      dataIndex: 'repoName',
      key: 'repoName',
      render: (_: string, record: RepoEnvRow) => (
        <Link href={`/projects/${record.repoId}`}>{record.repoName}</Link>
      )
    },
    {
      title: '分支 / Commit',
      key: 'branchCommit',
      render: (_: string, record: RepoEnvRow) => (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 2, lineHeight: '18px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <BranchesOutlined style={{ color: '#595959' }} />
            <span style={{ fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace' }}>{record.activeBranch}</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#444' }}>
            <DotChartOutlined style={{ color: '#8c8c8c' }} />
            <a href="#" onClick={(e) => { e.preventDefault(); message.info(`打开 Commit ${record.shortCommitId}`) }} style={{ fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace' }}>
              {record.shortCommitId}
            </a>
            <span style={{ color: '#8c8c8c' }}>{record.commitMessage}</span>
          </div>
        </div>
      )
    },
    { title: '环境URL', dataIndex: 'envUrl', key: 'envUrl', render: (u: string) => <span style={{ fontFamily: 'monospace' }}>{u}</span> },
    { title: '最新部署时间', dataIndex: 'latestDeployAt', key: 'latestDeployAt' },
    { title: '最后部署人', dataIndex: 'lastDeployer', key: 'lastDeployer' },
    {
      title: '操作', key: 'actions', render: (_: unknown, record: RepoEnvRow) => (
        <Space>
          <Link href={`/projects/${record.repoId}`}>
          </Link>
          <AntButton type="link" icon={<ReloadOutlined />} onClick={() => message.success('已触发重新部署')}>重新部署</AntButton>
          <AntButton type="link" icon={<DeleteOutlined />} danger onClick={() => message.warning('已停用')}>停用</AntButton>
        </Space>
      )
    }
  ]

  // 自定义项目切换器内容（Popover）
  const projectListContent = (
    <div style={{ width: 280 }}>
      <Input
        size="small"
        placeholder="搜索项目"
        allowClear
        prefix={<SearchOutlined />}
        value={projectSearch}
        onChange={(e) => setProjectSearch(e.target.value)}
        style={{ marginBottom: 8 }}
      />
      <div style={{ fontSize: 12, color: '#999', marginBottom: 4 }}>常用项目</div>
      <div style={{ maxHeight: 140, overflow: 'auto', paddingRight: 4 }}>
        {allProjects.filter(p => favoriteProjectIds.includes(p.id)).length === 0 && <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="暂无收藏" />}
        {allProjects.filter(p => favoriteProjectIds.includes(p.id)).map((p) => (
          <div key={p.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '6px 4px', borderRadius: 6, background: currentProjectId === p.id ? 'rgba(22,119,255,0.08)' : 'transparent' }}>
            <div style={{ cursor: 'pointer' }} onClick={() => { setCurrentProjectId(p.id); setCurrentPage(1) }}>{p.name}</div>
            <StarFilled style={{ color: '#faad14', cursor: 'pointer' }} onClick={() => setFavoriteProjectIds(prev => prev.filter(id => id !== p.id))} />
          </div>
        ))}
      </div>
      <Divider style={{ margin: '8px 0' }} />
      <div style={{ fontSize: 12, color: '#999', marginBottom: 4 }}>全部项目</div>
      <div style={{ maxHeight: 160, overflow: 'auto', paddingRight: 4 }}>
        {allProjects
          .filter(p => p.name.toLowerCase().includes(projectSearch.trim().toLowerCase()))
          .map((p) => (
            <div key={p.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '6px 4px', borderRadius: 6, background: currentProjectId === p.id ? 'rgba(22,119,255,0.08)' : 'transparent' }}>
              <div style={{ cursor: 'pointer' }} onClick={() => { setCurrentProjectId(p.id); setCurrentPage(1) }}>{p.name}</div>
              {favoriteProjectIds.includes(p.id)
                ? <StarFilled style={{ color: '#faad14', cursor: 'pointer' }} onClick={() => setFavoriteProjectIds(prev => prev.filter(id => id !== p.id))} />
                : <StarOutlined style={{ color: '#d9d9d9', cursor: 'pointer' }} onClick={() => setFavoriteProjectIds(prev => [...prev, p.id])} />}
            </div>
          ))}
      </div>
    </div>
  )

  return (
    <main style={{ padding: 24 }}>
      {/* 顶部工具条：项目切换器 + 仓库搜索 + 右侧刷新 */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
        <Space size={12} align="center">
          <Popover trigger={['click']} placement="bottomLeft" content={projectListContent} overlayStyle={{ padding: 0 }}>
            <AntButton type="default" size="middle" icon={<DownOutlined />} iconPosition="end">
              {allProjects.find(p => p.id === currentProjectId)?.name || '选择项目'}
            </AntButton>
          </Popover>
          <Input
            style={{ width: 320 }}
            placeholder="搜索仓库"
            allowClear
            prefix={<SearchOutlined />}
            value={repoSearch}
            onChange={(e) => { setRepoSearch(e.target.value); setCurrentPage(1) }}
          />
        </Space>
        <div>
          <AntButton icon={<ReloadOutlined />} onClick={() => message.success('已刷新')}>刷新</AntButton>
        </div>
      </div>

      <h1 style={{ color: 'var(--heading)', margin: 0, marginBottom: 12 }}>环境一览</h1>
      <AntTable<RepoEnvRow>
        rowKey={(r) => `${r.repoId}-${r.activeBranch}`}
        columns={columns}
        dataSource={pageData}
        pagination={{
          current: currentPage,
          pageSize,
          total,
          showSizeChanger: true,
          pageSizeOptions: [5, 10, 20, 50],
          showTotal: (t) => `共 ${t} 条`,
          hideOnSinglePage: false
        }}
        onChange={(p: TablePaginationConfig) => {
          const nextCurrent = p.current ?? 1
          const nextSize = p.pageSize ?? pageSize
          setCurrentPage(nextCurrent)
          setPageSize(nextSize)
        }}
      />
    </main>
  )
}

