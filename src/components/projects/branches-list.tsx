"use client"
import React, { useMemo, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Table as AntTable, Button as AntButton, Space, Tag, Popover, Input, Checkbox, Divider, Empty, Popconfirm, App as AntApp, Pagination as AntPagination, Drawer, Form, Select as AntSelect } from 'antd'
import type { ColumnsType } from 'antd/es/table'
import type { TablePaginationConfig } from 'antd/es/table/interface'
import { ReloadOutlined, EyeOutlined, DeleteOutlined, StarFilled, StarOutlined, DownOutlined, SearchOutlined, BranchesOutlined, DotChartOutlined, PlusOutlined, MinusCircleOutlined } from '@ant-design/icons'

interface RepoEnvRow {
  repoId: string;
  repoName: string;
  activeBranch: string;
  shortCommitId: string;
  commitMessage: string;
  repoType: 'frontend' | 'backend';
  status: 'running' | 'stopped';
  envUrl: string;
  latestDeployAt: string;
  lastDeployer: string;
}

// 这段代码实现了「仓库有效分支一览」列表，使用了 Ant Design Table 与 React
// 代码说明：
// - 列表包含：仓库名、生效分支、短 Commit、环境 URL、最新部署时间、最后部署人、操作
// - 点击“查看”进入项目详情；“日志详情”在详情页内
export default function BranchesList() {
  // AntD v5 推荐：使用 App.useApp 的 message，避免在弹层等场景丢失
  const { message: msg } = AntApp.useApp()
  const router = useRouter()
  // 模拟项目列表与收藏
  const allProjects: { id: string; name: string; team: string }[] = [
    { id: 'p-all', name: '全部项目', team: 'all' },
    { id: 'p-a', name: 'Publisher', team: 'team-a' },
    { id: 'p-b', name: 'Omni', team: 'team-b' },
    { id: 'p-ml', name: 'Core', team: 'ml' },
  ]
  const [favoriteProjectIds, setFavoriteProjectIds] = useState<string[]>(['p-a'])
  const [currentProjectId, setCurrentProjectId] = useState<string>('p-all')
  const [projectSearch, setProjectSearch] = useState<string>('')

  // 工具：按规则格式化当前时间（YYYY-MM-DD HH:mm:ss）
  const formatNow = (): string => {
    const d = new Date()
    const pad = (n: number) => String(n).padStart(2, '0')
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`
  }

  // 仓库有效分支数据（示例）
  const initialData: RepoEnvRow[] = [
    { repoId: '1', repoName: 'order-service', activeBranch: 'feature/login', shortCommitId: 'a1b2c3d', commitMessage: '登录异常处理与埋点修复', repoType: 'frontend', status: 'running', envUrl: 'api-login-fix.stg.example.com', latestDeployAt: '2025-03-21 14:55:37', lastDeployer: 'lin.y@ctw.inc' },
    { repoId: '2', repoName: 'checkout-ui', activeBranch: 'release-2.1', shortCommitId: 'a7b7c7', commitMessage: '结算页 UX 打磨', repoType: 'frontend', status: 'running', envUrl: 'checkout-ui-release-2-1.stg.g123.jp', latestDeployAt: '2025-03-21 14:55:37', lastDeployer: 'wu.yuni@ctw.inc' },
    { repoId: '3', repoName: 'profile-ui', activeBranch: 'feature/theme', shortCommitId: 'k3j9p1', commitMessage: '主题色与字体调整', repoType: 'frontend', status: 'stopped', envUrl: 'profile-ui-feature-theme.stg.g123.jp', latestDeployAt: '2025-03-21 14:55:37', lastDeployer: 'lin.y@ctw.inc' },
    { repoId: '4', repoName: 'user-service', activeBranch: 'release-1.0', shortCommitId: 'f6g7h8i', commitMessage: '发布 1.0 稳定版', repoType: 'frontend', status: 'running', envUrl: 'user-service-release.stg.g123.jp', latestDeployAt: '2025-03-21 14:55:37', lastDeployer: 'yu.t@ctw.inc' },
    { repoId: '5', repoName: 'payment-api', activeBranch: 'hotfix-22', shortCommitId: 'j9k0l1m', commitMessage: '支付回调健壮性 hotfix', repoType: 'backend', status: 'stopped', envUrl: 'payment-api-hotfix-22.stg.g123.jp', latestDeployAt: '2025-03-21 14:55:37', lastDeployer: 'lin.y@ctw.inc' },
    { repoId: '6', repoName: 'inventory-service', activeBranch: 'release-2.0', shortCommitId: 'x1y2z3', commitMessage: '库存同步性能优化', repoType: 'frontend', status: 'running', envUrl: 'inventory-service-release-2-0.stg.g123.jp', latestDeployAt: '2025-03-21 14:55:37', lastDeployer: 'yu.t@ctw.inc' },
    { repoId: '7', repoName: 'auth-service', activeBranch: 'feature/security', shortCommitId: 's3c9u1', commitMessage: '登录安全策略升级', repoType: 'backend', status: 'running', envUrl: 'auth-service-feature-security.stg.g123.jp', latestDeployAt: '2025-03-21 14:55:37', lastDeployer: 'wu.yuni@ctw.inc' },

  ]
  const [rows, setRows] = useState<RepoEnvRow[]>(initialData)
  // 当前项目筛选的仓库（原型：仅做演示，使用 repoId 奇偶分配）
  const projectFiltered = useMemo(() => {
    if (currentProjectId === 'p-all') return rows
    if (currentProjectId === 'p-a') return rows.filter((r) => Number(r.repoId) % 2 === 1)
    if (currentProjectId === 'p-b') return rows.filter((r) => Number(r.repoId) % 2 === 0)
    return rows
  }, [rows, currentProjectId])

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

  // 环境配置 Drawer：选择多条 记录（仓库 + 仓库分支）
  const [envDrawerOpen, setEnvDrawerOpen] = useState<boolean>(false)
  const [envPairs, setEnvPairs] = useState<{ repoId: string; branch: string }[]>([])
  const [envForm] = Form.useForm()
  // 生成每个仓库的分支列表（原型：从 activeBranch + 常见分支构造去重列表）
  const repoIdToBranches: Record<string, string[]> = useMemo(() => {
    const common = ['main', 'develop', 'release-1.0']
    const map: Record<string, string[]> = {}
    rows.forEach((r) => {
      const uniq = Array.from(new Set([r.activeBranch, ...common]))
      map[r.repoId] = uniq
    })
    return map
  }, [rows])
  const repoOptions = useMemo(() => rows.map(r => ({ label: r.repoName, value: r.repoId })), [rows])
  const handleOpenEnvDrawer = () => {
    const defaultRepoId = rows[0]?.repoId ?? ''
    const defaultBranch = defaultRepoId ? (repoIdToBranches[defaultRepoId]?.[0] ?? '') : ''
    const initPairs = envPairs.length > 0 ? envPairs : (defaultRepoId ? [{ repoId: defaultRepoId, branch: defaultBranch }] : [])
    setEnvDrawerOpen(true)
    envForm.setFieldsValue({ pairs: initPairs })
  }
  const handleSaveEnvConfig = async () => {
    const values = await envForm.validateFields()
    const pairs = (values.pairs as { repoId: string; branch: string }[]) || []
    setEnvPairs(pairs)
    setEnvDrawerOpen(false)
    msg.success(`已保存环境配置（${pairs.length} 条）`)
  }

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
      title: '仓库类别',
      dataIndex: 'repoType',
      key: 'repoType',
      render: (t: 'frontend' | 'backend') => (
        <Tag color={t === 'frontend' ? 'geekblue' : 'gold'}>{t === 'frontend' ? '前端' : '后端'}</Tag>
      )
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      render: (s: 'running' | 'stopped') => (
        <Tag color={s === 'running' ? 'green' : 'default'}>{s === 'running' ? '运行中' : '停止'}</Tag>
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
            <a href="#" onClick={(e) => { e.preventDefault(); msg.info(`打开 Commit ${record.shortCommitId}`) }} style={{ fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace' }}>
              {record.shortCommitId}
            </a>
            <span style={{ color: '#8c8c8c' }}>{record.commitMessage}</span>
          </div>
        </div>
      )
    },
    { title: '可访问地址', dataIndex: 'envUrl', key: 'envUrl', render: (u: string) => <span style={{ fontFamily: 'monospace' }}>{u}</span> },
    { title: '最新部署时间', dataIndex: 'latestDeployAt', key: 'latestDeployAt' },
    { title: '最后部署人', dataIndex: 'lastDeployer', key: 'lastDeployer' },
    {
      title: '操作', key: 'actions', render: (_: unknown, record: RepoEnvRow) => {
        const isStopped = record.status === 'stopped'
        return (
        <Space>
          <Link href={`/projects/${record.repoId}`}>
          </Link>
            <Popconfirm
              title="是否重新部署当前分支"
              okText="确定"
              cancelText="取消"
              onConfirm={() => {
                setRows((prev) => prev.map((r) => {
                  if (r.repoId !== record.repoId) return r
                  if (r.status === 'stopped') {
                    return { ...r, status: 'running' }
                  }
                  return { ...r, latestDeployAt: formatNow() }
                }))
                msg.success(record.status === 'stopped' ? '状态已切换为运行中，并触发重新部署' : '已触发重新部署，时间已刷新')
              }}
            >
              <AntButton type="link" icon={<ReloadOutlined />}>重新部署</AntButton>
            </Popconfirm>
        </Space>
      )
      }
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
    <main style={{ padding: '24px 24px 24px 10px' }}>
      {/* 顶部工具条：项目切换器 + 仓库搜索 + 右侧刷新 */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
        <Space size={12} align="center">
         {/* <Popover trigger={['click']} placement="bottomLeft" content={projectListContent} overlayStyle={{ padding: 0 }}>
            <AntButton type="default" size="middle" icon={<DownOutlined />} iconPosition="end">
              {allProjects.find(p => p.id === currentProjectId)?.name || '选择项目'}
            </AntButton>
          </Popover> */}
          <Input
            style={{ width: 320 }}
            placeholder="搜索仓库"
            allowClear
            prefix={<SearchOutlined />}
            value={repoSearch}
            onChange={(e) => { setRepoSearch(e.target.value); setCurrentPage(1) }}
          />
        </Space>
        <Space>
          <AntButton onClick={handleOpenEnvDrawer}>环境配置</AntButton>
          <AntButton icon={<ReloadOutlined />} onClick={() => msg.success('已刷新')}>刷新</AntButton>
        </Space>
      </div>

      <h1 style={{ color: 'var(--heading)', margin: 0, marginBottom: 12 }}>环境一览</h1>
      {/* 卡片栅格：替代表格展示，交互与字段保持不变 */}
      <div
        className="cards-grid"
        style={{
          display: 'grid',
          gap: 16
        }}
      >
        <style>{`
          @media (max-width: 1920px) {
            .cards-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); }
          }
          @media (min-width: 1921px) {
            .cards-grid { grid-template-columns: repeat(3, minmax(0, 1fr)); }
          }
        `}</style>
        {pageData.map((record) => {
          const isStopped = record.status === 'stopped'
          return (
            <div
              key={`${record.repoId}-${record.activeBranch}`}
              onClick={() => router.push(`/projects/${record.repoId}`)}
              style={{
                background: '#fff',
                border: '1px solid #eee',
                borderRadius: 12,
                padding: 16,
                cursor: 'pointer',
                transition: 'box-shadow 0.2s ease',
                boxShadow: '0 2px 8px rgba(0,0,0,0.06)'
              }}
              onMouseEnter={(e) => { (e.currentTarget as HTMLDivElement).style.boxShadow = '0 8px 24px rgba(0,0,0,0.10)' }}
              onMouseLeave={(e) => { (e.currentTarget as HTMLDivElement).style.boxShadow = '0 2px 8px rgba(0,0,0,0.06)' }}
            >
              {/* 头部：仓库名 + 类别 + 状态 */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <div style={{ fontWeight: 700, fontSize: 16 }}>{record.repoName}</div>
                  <Tag color={record.repoType === 'frontend' ? 'geekblue' : 'gold'}>{record.repoType === 'frontend' ? '前端' : '后端'}</Tag>
                </div>
                <Tag color={record.status === 'running' ? 'green' : 'default'}>{record.status === 'running' ? '运行中' : '停止'}</Tag>
              </div>
              <div style={{ height: 1, background: '#f5f5f5', margin: '4px 0 12px' }} />

              {/* 核心信息 */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr', rowGap: 6, color: '#444' }}>
                <div>分支：<span style={{ color: '#1e90ff', fontFamily: 'monospace' }}>{record.activeBranch}</span></div>
                <div>环境URL：<span style={{ color: '#1e90ff', fontFamily: 'monospace' }}>{record.envUrl}</span></div>
                <div>最新部署时间：{record.latestDeployAt}</div>
                <div>部署人：{record.lastDeployer}</div>
              </div>

              <div style={{ height: 1, background: '#f5f5f5', margin: '12px 0' }} />

              {/* 操作区：按钮需要阻止冒泡，避免触发卡片点击 */}
              <Space>
                <Popconfirm
                  title="是否重新部署当前分支"
                  okText="确定"
                  cancelText="取消"
                  onConfirm={(e) => {
                    setRows((prev) => prev.map((r) => {
                      if (r.repoId !== record.repoId) return r
                      if (r.status === 'stopped') return { ...r, status: 'running' }
                      return { ...r, latestDeployAt: formatNow() }
                    }))
                    msg.success(record.status === 'stopped' ? '状态已切换为运行中，并触发重新部署' : '已触发重新部署，时间已刷新')
                  }}
                >
                  <AntButton
                    type="primary"
                    onMouseDown={(e) => e.stopPropagation()}
                    onClick={(e) => e.stopPropagation()}
                  >
                    重新部署
                  </AntButton>
                </Popconfirm>

                <AntButton
                  onMouseDown={(e) => e.stopPropagation()}
                  onClick={(e) => { e.stopPropagation(); router.push(`/projects/${record.repoId}`) }}
                >
                  查看日志
                </AntButton>
              </Space>
            </div>
          )
        })}
      </div>

      {/* 分页 */}
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 16 }}>
        <AntPagination
          current={currentPage}
          pageSize={pageSize}
          total={total}
          showSizeChanger
          pageSizeOptions={[5, 10, 20, 50]}
          showTotal={(t) => `共 ${t} 条`}
          onChange={(p, s) => { setCurrentPage(p); setPageSize(s) }}
        />
      </div>
      {/* 环境配置 Drawer：可多选 仓库+分支 */}
      <Drawer
        title="环境配置"
        open={envDrawerOpen}
        onClose={() => setEnvDrawerOpen(false)}
        width={560}
      >
        <div style={{ color: '#666', marginBottom: 12 }}>每一行表示一条记录：仓库 — 仓库分支。</div>
        <Form form={envForm} layout="vertical" initialValues={{ pairs: envPairs }}>
          <Form.List name="pairs">
            {(fields, { add, remove }) => (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {fields.map(({ key, name, ...rest }) => {
                  const currentRepoId: string = envForm.getFieldValue(['pairs', name, 'repoId']) || ''
                  const branchOptions = (repoIdToBranches[currentRepoId] || []).map(b => ({ label: b, value: b }))
                  return (
                    <div key={key} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr auto', gap: 12, alignItems: 'end' }}>
                      <Form.Item {...rest} name={[name, 'repoId']} label={name === 0 ? '仓库' : undefined} rules={[{ required: true, message: '请选择仓库' }]}> 
                        <AntSelect options={repoOptions} placeholder="选择仓库" onChange={(rid: string) => {
                          const firstBranch = (repoIdToBranches[rid] || [])[0] || ''
                          envForm.setFields([{ name: ['pairs', name, 'branch'], value: firstBranch }])
                        }} />
                      </Form.Item>
                      <Form.Item {...rest} name={[name, 'branch']} label={name === 0 ? '仓库分支' : undefined} rules={[{ required: true, message: '请选择分支' }]}> 
                        <AntSelect options={branchOptions} placeholder="选择分支" />
                      </Form.Item>
                      <AntButton type="text" icon={<MinusCircleOutlined />} danger onClick={() => remove(name)} />
                    </div>
                  )
                })}
                <AntButton icon={<PlusOutlined />} onClick={() => {
                  const rid = rows[0]?.repoId || ''
                  const b0 = rid ? (repoIdToBranches[rid]?.[0] || '') : ''
                  add({ repoId: rid, branch: b0 })
                }}>新增一条</AntButton>
              </div>
            )}
          </Form.List>
        </Form>
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 16 }}>
          <AntButton onClick={() => setEnvDrawerOpen(false)}>取消</AntButton>
          <AntButton type="primary" onClick={handleSaveEnvConfig}>保存配置</AntButton>
        </div>
      </Drawer>
    </main>
  )
}

