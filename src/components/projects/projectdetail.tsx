"use client"
import React, { useEffect, useMemo, useState } from 'react'
import { Card, Button as AntButton, Drawer, Form, Select as AntSelect, Input, Space, Tag, DatePicker, Checkbox, Modal, message, Tabs, Table as AntTable, Popconfirm, Descriptions, Typography } from 'antd'
import dayjs from 'dayjs'
import { DeleteOutlined, ThunderboltOutlined, ReloadOutlined, EyeOutlined, RollbackOutlined } from '@ant-design/icons'
import { getDeployRecordsMock } from './deployrecords.mock'

/**
 * 这段代码实现了"项目详情"原型页：顶部项目信息 + 环境卡片列表 + 规划部署 + 部署记录
 * 代码说明：环境卡片展示当前生效分支、功能说明、生效时间范围与状态。部署记录Tab展示两级表格和详情Drawer。
 * 修改原因：满足 docs/定时发布.md 的项目详情需求，并在项目详情页中集成部署记录功能。
 */

const { Text } = Typography

type Env = 'stg' | 'prod'
type BranchStatus = 'testing' | 'active'

interface BranchBind { 
  repo: string; 
  branch: string; 
  desc?: string; 
  start?: string; 
  end?: string; 
  isDefault?: boolean;
  status?: BranchStatus;
  actualExpiredAt?: string;  // 实际失效时间
}

interface EnvBind { env: Env; binds: BranchBind[] }

// 部署记录相关接口（与独立页面保持一致）
interface PodRecord {
  id: string
  name: string
  status: 'running' | 'pending' | 'failed' | 'terminated'
  node: string
  restartCount: number
  createdAt: string
}

interface ReplicaSetRecord {
  id: string
  name: string
  createdAt: string
  podStatus: {
    running: number
    failed: number
    terminated: number
  }
  uptime: string
  isCurrent: boolean
  pods: PodRecord[]
}

interface DeployRecord {
  id: string
  deployId: string
  commit: {
    hash: string
    author: string
  }
  deployTime: string
  status: 'success' | 'failed' | 'pending' | 'cancelled'
  duration: string
  environment: 'stg' | 'prod'
  replicaSets: ReplicaSetRecord[]
}

type HasFormat = { format: (fmt: string) => string }

export default function ProjectDetail({ projectId }: { projectId: string }) {
  const [meta, setMeta] = useState<{ name: string; repo?: string }>({ name: `project-${projectId}` })
  const [envs, setEnvs] = useState<EnvBind[]>([])
  const [choices, setChoices] = useState<string[]>([])
  const [showEdit, setShowEdit] = useState<EnvBind | null>(null)
  const [form] = Form.useForm()
  
  // 状态管理
  const [showImmediateModal, setShowImmediateModal] = useState<{ branch: BranchBind; env: Env } | null>(null)
  const [activeTab, setActiveTab] = useState('deployment')  // 新增Tab状态
  
  // 部署记录相关状态
  const [deployGroups, setDeployGroups] = useState<DeployRecord[]>([])
  const [showDeployDetail, setShowDeployDetail] = useState<DeployRecord | null>(null)
  const [expandedReplicaSetId, setExpandedReplicaSetId] = useState<string | null>(null)
  const [showPodLogs, setShowPodLogs] = useState<PodRecord | null>(null)

  // 仓库与分支：仓库来自 projects 列表（localStorage），分支提供基础候选
  const repoChoices = choices
  const repoBranches: Record<string, string[]> = useMemo(() => {
    const base: Record<string, string[]> = {}
    choices.forEach((r) => {
      base[r] = ['main', 'develop', 'release/2025-10', 'feat/login', 'feat/api', 'feature/billing']
    })
    return base
  }, [choices])

  // 部署记录mock数据来源统一（顶部已import）

  // 根据仓库地址生成mock环境绑定数据（只mock分支信息）
  const buildDemoEnvs = (repoUrl: string): EnvBind[] => ([
    {
      env: 'stg',
      binds: [
        { repo: repoUrl, branch: 'main', desc: '当前稳定版本', start: '2025-01-01 09:00', status: 'active' },
        { repo: repoUrl, branch: 'develop', desc: '2.1.X应用服务及日常优化合并dev', start: '2025-10-20 10:30', status: 'testing' },
        { repo: repoUrl, branch: 'feature/login', desc: '登录功能优化', start: '2025-09-15 14:20', status: 'testing' },
        { repo: repoUrl, branch: 'feature/payment', desc: 'CDN重构相关', start: '2025-10-01 09:00', status: 'testing' },
        { repo: repoUrl, branch: 'feature/dashboard', desc: '仪表板界面改版', start: '2025-09-10 16:00', status: 'testing' },
      ],
    },
    // {
    //   env: 'prod',
    //   binds: [
    //     { repo: repoUrl, branch: 'main', desc: '稳定版本', start: '2025-09-15 09:00', status: 'testing' }, 
    //     { repo: repoUrl, branch: 'release/2.0.0', desc: '2.0.0 版本', start: '2025-01-01 16:30', end: '2025-12-31 23:59', status: 'testing' }, 
    //   ],
    // },
  ])

  // 读取 Webhook 机器人（供多选关联）
  const [robots, setRobots] = useState<Array<{ id: string; name: string }>>([])
  useEffect(() => {
    try {
      const raw = typeof window !== 'undefined' ? localStorage.getItem('omni-webhooks') : null
      const arr = raw ? (JSON.parse(raw) as Array<{ id: string; name: string; enabled?: boolean }>) : []
      const enabled = Array.isArray(arr) ? arr.filter(x => x.enabled) : []
      setRobots(enabled.map(x => ({ id: x.id, name: x.name })))
    } catch { setRobots([]) }
  }, [])

  // 从 localStorage 读取项目配置，获取项目名称和仓库地址，mock分支数据
  useEffect(() => {
    try {
      const raw = typeof window !== 'undefined' ? localStorage.getItem('omni-projects') : null
      if (!raw) {
        // 无持久化数据时，使用默认值
        setMeta({ name: projectId, repo: undefined })
        setChoices([])
        setEnvs([])
        return
      }
      
      interface ProjectData {
        id: string
        name: string
        envCount: number
        createdAt: string
        repo?: string
        envs?: Array<{ name: string; url: string }>
        repos?: string[]
      }
      const map = JSON.parse(raw) as Record<string, ProjectData>
      const item = map[projectId] || Object.values(map).find(x => x.name === projectId)
      
      if (!item) {
        // 未找到项目数据时，使用项目ID作为名称
        setMeta({ name: projectId, repo: undefined })
        setChoices([])
        setEnvs([])
        return
      }

      // 从列表数据中获取项目名称和仓库地址
      const projectName = item.name
      const repoUrl = (item.repos && item.repos.length > 0) ? item.repos[0] : item.repo
      
      if (!repoUrl) {
        // 没有仓库地址时，只设置项目名称
        setMeta({ name: projectName, repo: undefined })
        setChoices([])
        setEnvs([])
        return
      }

      // 设置项目信息和仓库选择
      setMeta({ name: projectName, repo: repoUrl })
      setChoices([repoUrl])
      
      // 使用仓库地址生成mock的分支绑定数据
      setEnvs(buildDemoEnvs(repoUrl))
      
    } catch (error) {
      console.error('读取项目数据失败:', error)
      setMeta({ name: projectId, repo: undefined })
      setChoices([])
      setEnvs([])
    }
  }, [projectId])

  // 定时检查分支失效状态
  useEffect(() => {
    const checkExpiredBranches = () => {
      const now = new Date()
      const nowStr = now.toLocaleString('sv-SE').replace('T', ' ').substring(0, 19)
      
      setEnvs(prev => prev.map(env => ({
        ...env,
        binds: env.binds
      })))
    }

    // 立即检查一次
    checkExpiredBranches()
    
    // 每分钟检查一次
    const interval = setInterval(checkExpiredBranches, 60000)
    
    return () => clearInterval(interval)
  }, [])

  // 加载部署记录数据
  useEffect(() => {
    setDeployGroups(getDeployRecordsMock())
  }, [])

  // 部署记录相关函数（与独立页面保持一致）
  const getDeployStatusTag = (status: string) => {
    const statusConfig = {
      success: { color: 'success', text: '✅ 成功' },
      failed: { color: 'error', text: '❌ 失败' },
      pending: { color: 'processing', text: '🔄 部署中' },
      cancelled: { color: 'default', text: '⏹️ 已取消' }
    }
    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.cancelled
    return <Tag color={config.color}>{config.text}</Tag>
  }

  const getPodStatusTag = (status: string) => {
    const statusConfig = {
      running: { color: 'success', text: 'Running' },
      pending: { color: 'processing', text: 'Pending' },
      failed: { color: 'error', text: 'Failed' },
      terminated: { color: 'default', text: 'Terminated' }
    }
    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.terminated
    return <Tag color={config.color}>{config.text}</Tag>
  }

  const handleRedeploy = (deployId: string) => {
    setDeployGroups(prev => prev.map(deploy => 
      deploy.id === deployId 
        ? { ...deploy, status: 'pending' as const }
        : deploy
    ))
    message.success('正在重新部署...')
    
    setTimeout(() => {
      setDeployGroups(prev => prev.map(deploy => 
        deploy.id === deployId 
          ? { ...deploy, status: 'success' as const, duration: '2m30s' }
          : deploy
      ))
      message.success('重新部署完成')
    }, 3000)
  }

  const handleRollback = (deployId: string, targetImage: string) => {
    message.success(`正在回滚到 ${targetImage}...`)
    setTimeout(() => {
      message.success('回滚完成')
    }, 2000)
  }

  const handleViewPodLogs = (pod: PodRecord) => {
    setShowPodLogs(pod)
  }

  const showDeployDetails = (deploy: DeployRecord) => {
    setShowDeployDetail(deploy)
    setExpandedReplicaSetId(null)
  }

  const toggleReplicaSetDetails = (replicaSetId: string) => {
    setExpandedReplicaSetId(prev => prev === replicaSetId ? null : replicaSetId)
  }


  // 部署记录：状态标签与摘要
  const renderPodStatusSummary = (podStatus: ReplicaSetRecord['podStatus']) => {
    const { running, failed, terminated } = podStatus
    const total = running + failed + terminated
    if (total === 0) return <Text type="secondary">无Pod</Text>
    return (
      <Space size={4}>
        {running > 0 && <Text type="success">{running} running</Text>}
        {failed > 0 && <Text type="danger">{failed} failed</Text>}
        {terminated > 0 && <Text type="secondary">{terminated} terminated</Text>}
      </Space>
    )
  }


  const statusOf = (e: EnvBind) => {
    if (!e.binds || e.binds.length === 0) return '待生效'
    const hasActive = e.binds.some(b => b.status === 'active')
    if (hasActive) return '运行中'
    return '待生效'
  }

  const onOpenEdit = (e: EnvBind) => {
    setShowEdit(e)
    // 预填充：将 start/end 映射为 range（不做严格 dayjs 转换，保持原型轻量）
    // 注意：RangePicker 期望接收 dayjs 对象，原型不引入 dayjs，避免传 string 触发 isValid 报错
    // 因此编辑态不预填 range，保留为 undefined，让用户重新选择时间段
    const bindsWithStartTime = (e.binds || []).map(b => ({
      ...b,
      startTime: b.start ? dayjs(b.start) : undefined
    }))
    form.setFieldsValue({ env: e.env, binds: bindsWithStartTime.length ? bindsWithStartTime : [{ branch: '', desc: '', startTime: undefined }] })
  }

  const onSave = async () => {
    const v = await form.validateFields() as { env: Env; binds: Array<BranchBind & { startTime?: unknown; robotIds?: string[] }> }
    const normalized: Array<BranchBind & { robotIds?: string[] }> = (v.binds || []).map((b) => {
      let start: string | undefined = undefined
      
      // 处理新的startTime字段
      if (b.startTime) {
        if (dayjs.isDayjs(b.startTime)) {
          start = b.startTime.format('YYYY-MM-DD HH:mm')
        } else if (typeof b.startTime === 'object' && 'format' in b.startTime && typeof (b.startTime as HasFormat).format === 'function') {
          start = (b.startTime as HasFormat).format('YYYY-MM-DD HH:mm')
        } else if (b.startTime != null) {
          start = String(b.startTime)
        }
      }
      
      const result: BranchBind & { robotIds?: string[] } = {
        repo: meta.repo || repoChoices[0], // 使用项目默认仓库
        branch: b.branch,
        desc: b.desc,
        start: start,
        status: 'testing'  // 新规划的分支默认为testing状态
      }
      if (Array.isArray(b.robotIds)) result.robotIds = b.robotIds
      return result
    }).filter(b => !!b.branch) // 只需要检查分支不为空
    setEnvs(prev => prev.map(x => x.env === v.env ? { ...x, binds: normalized } : x))
    setShowEdit(null)
    // 模拟发送提醒
    try {
      normalized.forEach((b) => {
        if (Array.isArray(b.robotIds) && b.robotIds.length) {
          console.log('Webhook notify', { env: v.env, repo: b.repo, branch: b.branch, robots: b.robotIds })
        }
      })
    } catch {}
  }


  const handleImmediateEffect = (branch: BranchBind, env: Env) => {
    setShowImmediateModal({ branch, env })
  }

  const confirmImmediateEffect = () => {
    if (!showImmediateModal) return
    
    const { branch, env } = showImmediateModal
    const now = new Date().toLocaleString('sv-SE').replace('T', ' ').substring(0, 19)
    
    setEnvs(prev => prev.map(e => 
      e.env === env 
        ? { 
            ...e, 
            binds: e.binds.map(b => {
              // 如果是要立即生效的分支，更新开始时间并设置为active状态
              if (b.branch === branch.branch && b.repo === branch.repo) {
                return { ...b, start: now, status: 'active' }
              }
              
              // 如果是当前生效的其他分支，将其状态改为失效
              const isCurrentlyActive = b.status === 'active' &&
                !(b.branch === branch.branch && b.repo === branch.repo)  // 排除要立即生效的分支本身
              
              if (isCurrentlyActive) {
                // 当前生效分支失效，记录实际失效时间，状态保持不变但记录失效时间
                return { ...b, actualExpiredAt: now, status: 'testing' }
              }
              
              return b
            })
          }
        : e
    ))
    
    setShowImmediateModal(null)
    message.success(`分支 ${branch.branch} 已立即生效，其他生效分支已失效`)
  }



  return (
    <main style={{ padding: 24 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <div>
          <h1 style={{ color: 'var(--heading)', margin: 0 }}>{meta.name}</h1>
          {meta.repo ? <a href={meta.repo} target="_blank" rel="noreferrer">{meta.repo}</a> : <span style={{ color: '#6b7280' }}>未配置仓库</span>}
        </div>
      </div>

      <Tabs
        activeKey={activeTab}
        onChange={setActiveTab}
        items={[
          {
            key: 'deployment',
            label: '部署规划',
            children: (
      <div style={{ display: 'grid', gap: 12, gridTemplateColumns: '1fr', alignItems: 'stretch' }}>
        {envs.map(e => {
          const now = new Date()
          const binds = e.binds ?? []
          // 按仓库分组
          const repoToBinds: Record<string, BranchBind[]> = {}
          binds.forEach(b => {
            if (!repoToBinds[b.repo]) repoToBinds[b.repo] = []
            repoToBinds[b.repo].push(b)
          })
          // 只使用单个仓库
          const primaryRepos = [repoChoices[0]].filter(Boolean)
          type ActiveByRepo = { repo: string; bind?: BranchBind }
          const activeByRepo: ActiveByRepo[] = []
          const upcomingList: BranchBind[] = []
          primaryRepos.forEach(repo => {
            const list = repoToBinds[repo] || []
            
            // 获取当前生效的分支（每个仓库只取一个最新的生效分支）
            const timedActive = list
              .filter(b => b.status === 'active')  // 只显示生效中的分支
              .sort((a, b) => (new Date(b.start as string).getTime()) - (new Date(a.start as string).getTime()))
            
            const defaultBind = list.find(b => b.isDefault && (b.status === 'testing' || b.status === 'active')) // 默认分支只显示测试中和生效中状态
            
            // 每个仓库只添加一个生效分支（最新的）
            if (timedActive.length > 0) {
              activeByRepo.push({ repo, bind: timedActive[0] })  // 只取第一个（最新的）
            } else if (defaultBind) {
              activeByRepo.push({ repo, bind: defaultBind })
            }
            
            // 即将生效的分支
            const upcoming = list
              .filter(b => b.start && (new Date(b.start as string)).getTime() > now.getTime())
              .sort((a, b) => (new Date(a.start as string).getTime()) - (new Date(b.start as string).getTime()))
            upcoming.forEach(u => upcomingList.push(u))
          })
          upcomingList.sort((a, b) => (new Date(a.start as string).getTime()) - (new Date(b.start as string).getTime()))
          return (
            <Card key={e.env} style={{ width: '100%' }} title={<Space><Tag color="blue">{e.env}</Tag><span>{statusOf(e)}</span></Space>} extra={
              <Space>
                <AntButton onClick={() => onOpenEdit(e)}>规划部署</AntButton>
              </Space>
            }>
              <div style={{ display: 'flex', gap: 16, alignItems: 'stretch' }}>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 12, color: '#6b7280', marginBottom: 6 }}>生效中</div>
                  {activeByRepo.map(({ repo, bind }, idx) => (
                    <div key={repo + idx} style={{ border: '1px solid #eee', borderRadius: 8, padding: 8, marginBottom: 8, wordBreak: 'break-word' }}>
                      {bind ? (
                        <>
                          <div style={{ fontSize: 12, color: '#6b7280' }}>分支</div>
                          <div style={{ marginBottom: 4, fontWeight: 600 }}>{bind.branch}{bind.isDefault ? '（默认）' : ''}</div>
                          <div style={{ fontSize: 12, color: '#6b7280' }}>功能</div>
                          <div style={{ marginBottom: 4 }}>{bind.desc || '暂无描述'}</div>
                          <div style={{ fontSize: 12, color: '#6b7280' }}>生效时间</div>
                          <div style={{ marginBottom: 8 }}>
                            {bind.start ?? '-'}
                          </div>
                          
                        </>
                      ) : (
                        <div style={{ color: '#6b7280' }}>未配置生效中的分支</div>
                      )}
                    </div>
                  ))}
                </div>
                <div style={{ width: 320 }}>
                  <div style={{ fontSize: 12, color: '#6b7280', marginBottom: 6 }}>即将生效</div>
                  {upcomingList.length ? (
                    <div style={{ display: 'grid', gap: 8 }}>
                      {upcomingList.map((u, i) => (
                        <div key={i} style={{ border: '1px solid #1677ff', background: '#f0f7ff', borderRadius: 8, padding: 12, wordBreak: 'break-word' }}>
                          <div style={{ fontSize: 12, color: '#6b7280' }}>分支</div>
                          <div style={{ marginBottom: 6, fontWeight: 600 }}>{u.branch}</div>
                          <div style={{ fontSize: 12, color: '#6b7280' }}>功能</div>
                          <div style={{ marginBottom: 6 }}>{u.desc}</div>
                          <div style={{ fontSize: 12, color: '#6b7280' }}>生效时间</div>
                          <div style={{ marginBottom: 8 }}>{u.start ?? '-'}</div>
                          
                          {/* 立即生效按钮 */}
                          <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                            <AntButton 
                              size="small" 
                              type="primary" 
                              icon={<ThunderboltOutlined />}
                              onClick={() => handleImmediateEffect(u, e.env)}
                            >
                              立即生效
                            </AntButton>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div style={{ border: '1px dashed #e5e7eb', borderRadius: 8, padding: 12, color: '#6b7280' }}>暂无即将生效的分支</div>
                  )}
                </div>
              </div>
            </Card>
          )
        })}
      </div>
            )
          },
          {
            key: 'deployRecords',
            label: '部署记录',
            children: (
              <div>
                <AntTable<DeployRecord>
                  rowKey="id"
                  dataSource={deployGroups}
                  
                  columns={[
                    {
                      title: '部署ID',
                      dataIndex: 'deployId',
                      key: 'deployId',
                      width: 200,
                      render: (deployId: string, record: DeployRecord) => (
                        <Space>
                          <AntButton type="link" style={{ padding: 0 }} onClick={() => showDeployDetails(record)}>
                            <Text strong>{deployId}</Text>
                          </AntButton>
                          <Tag color={record.environment === 'stg' ? 'blue' : 'gold'}>
                            {record.environment.toUpperCase()}
                          </Tag>
                        </Space>
                      )
                    },
                    {
                      title: 'Commit ID',
                      key: 'commit',
                      width: 220,
                      render: (_, record: DeployRecord) => (
                        <Text code>{record.commit.hash}</Text>
                      )
                    },
                    {
                      title: '提交人',
                      dataIndex: ['commit', 'author'],
                      key: 'author',
                      width: 100
                    },
                    {
                      title: '部署时间',
                      dataIndex: 'deployTime',
                      key: 'deployTime',
                      width: 160
                    },
                    {
                      title: '状态',
                      dataIndex: 'status',
                      key: 'status',
                      width: 120,
                      render: (status: string) => getDeployStatusTag(status)
                    },
                    {
                      title: '持续时间',
                      dataIndex: 'duration',
                      key: 'duration',
                      width: 120
                    },
                    {
                      title: '最近一次更新时间',
                      dataIndex: 'deployTime',
                      key: 'updatedAt',
                      width: 180
                    },
                    {
                      title: '操作',
                      key: 'actions',
                      width: 180,
                      render: (_, record: DeployRecord) => (
                        <Space>
                          <AntButton size="small" icon={<ReloadOutlined />} onClick={() => handleRedeploy(record.id)}>
                            重新部署
                          </AntButton>
                          <AntButton size="small" icon={<EyeOutlined />} onClick={() => showDeployDetails(record)}>
                            查看
                          </AntButton>
                        </Space>
                      )
                    }
                  ]}
                />
              </div>
            )
          }
        ]}
      />

      <Drawer
        title={`规划部署 - ${showEdit?.env?.toUpperCase()} 环境`}
        open={!!showEdit}
        onClose={() => setShowEdit(null)}
        width={800}
        extra={
          <Space>
            <AntButton onClick={() => setShowEdit(null)}>取消</AntButton>
            <AntButton type="primary" onClick={onSave}>保存</AntButton>
          </Space>
        }
      >
        <Form form={form} layout="vertical">
          <div style={{ marginBottom: 16, padding: 12, background: '#f5f5f5', borderRadius: 8 }}>
            <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 4 }}>项目仓库</div>
            <div style={{ color: '#666' }}>{meta.repo || '未设置仓库地址'}</div>
          </div>
          
          <Form.Item name="env" hidden>
            <Input />
          </Form.Item>
          
          <Form.List name="binds">
            {(fields, { add, remove }) => (
              <div style={{ display: 'grid', gap: 16 }}>
                {fields.map((field) => {
                  const { key, ...restField } = field
                  const defaultRepo = meta.repo || repoChoices[0]
                  // 过滤已合并或已完成测试的分支
                  const allBranches = repoBranches[defaultRepo] || []
                  const unavailableBranches = new Set<string>()
                  
                                           // 当前正在编辑的分支不受限制
                         const currentBranch = form.getFieldValue(['binds', restField.name, 'branch'])
                         const availableBranches = allBranches.filter(b => 
                           // 排除特殊分支（dev和master分支不可在规划部署中选择）
                    b !== 'dev' && b !== 'master'
                         )
                  
                  const branchOptions = availableBranches.map(b => ({ 
                    value: b, 
                    label: b
                  }))
                  
                                           return (
                           <div key={key} style={{ border: '1px solid #eee', borderRadius: 8, padding: 16 }}>
                             
                             <Form.Item shouldUpdate noStyle>
                               {({ getFieldValue }) => {
                                 const isDefault = getFieldValue(['binds', restField.name, 'isDefault'])
                                 const currentBranchName = getFieldValue(['binds', restField.name, 'branch'])
                                 
                                 // 判断当前分支是否为生效中的分支
                                 const isCurrentlyActive = (() => {
                                   if (!currentBranchName || !showEdit) return false
                                   
                                   const envData = envs.find(e => e.env === showEdit.env)
                                   if (!envData) return false
                                   
                                   const existingBind = envData.binds.find(b => b.branch === currentBranchName)
                                   if (!existingBind || existingBind.isDefault) return false
                                   
                                   return existingBind.status === 'active'
                                 })()
                                 
                                 return (
                                   <>
                                     {isCurrentlyActive && (
                                       <div style={{ background: '#fff7e6', border: '1px solid #ffd591', borderRadius: 6, padding: 12, marginBottom: 16 }}>
                                         <div style={{ color: '#fa8c16', fontWeight: 600, marginBottom: 4 }}>⚠️ 当前生效分支</div>
                                         <div style={{ color: '#666', fontSize: 14 }}>该分支正在生效中，其他信息不可更改</div>
                                       </div>
                                     )}
                                     
                                     {/* 第一行：分支、生效时间、关联机器人、删除图标 */}
                                     <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.5fr 1.5fr auto', gap: 16, marginBottom: 16, alignItems: 'end' }}>
                                       <Form.Item {...restField} name={[restField.name, 'branch']} label="分支" rules={[{ required: true }]} style={{ margin: 0 }}>
                                         <AntSelect 
                                           placeholder="选择分支" 
                                           options={branchOptions} 
                                           disabled={!!isCurrentlyActive}  // 生效中的分支不能修改分支名
                                         />
                                       </Form.Item>
                                       <Form.Item {...restField} name={[restField.name, 'startTime']} label="生效时间" rules={[{ required: true }]} style={{ margin: 0 }}>
                                         <DatePicker 
                                           disabled={!!isCurrentlyActive}  // 生效中的分支不能修改生效时间
                                           style={{ width: '100%' }} 
                                           showTime={{ format: 'HH:mm' }}
                                           format="YYYY-MM-DD HH:mm"
                                           placeholder="选择生效时间"
                                         />
                                       </Form.Item>
                                       <Form.Item {...restField} name={[restField.name, 'robotIds']} label="关联机器人" style={{ margin: 0 }}>
                                         <AntSelect
                                           mode="multiple"
                                           placeholder="选择机器人"
                                           options={robots.map(r => ({ value: r.id, label: r.name }))}
                                           disabled={!!isCurrentlyActive}  // 生效中的分支不能修改关联机器人
                                         />
                                       </Form.Item>
                                       <AntButton 
                                         danger 
                                         icon={<DeleteOutlined />} 
                                         onClick={() => remove(restField.name)} 
                                         style={{ margin: 0 }}
                                         title="移除此分支"
                                         disabled={!!isCurrentlyActive}  // 生效中的分支不能删除
                                       />
                                     </div>
                                     
                                     {/* 第二行：功能说明单独一行 */}
                                     <div>
                                       <Form.Item {...restField} name={[restField.name, 'desc']} label="功能说明" rules={[{ required: true }]} style={{ margin: 0 }}>
                                         <Input 
                                           placeholder="本次分支功能点说明" 
                                           disabled={!!isCurrentlyActive}  // 生效中的分支不能修改功能说明
                                         />
                                       </Form.Item>
                                     </div>
                                   </>
                                 )
                               }}
                             </Form.Item>
                           </div>
                         )
                })}
                <AntButton type="dashed" onClick={() => add({ branch: '', desc: '', startTime: undefined })} block>
                  + 增加一个分支
                </AntButton>
              </div>
            )}
          </Form.List>
        </Form>
      </Drawer>


      {/* 立即生效Modal */}
      <Modal
        title="立即生效"
        open={!!showImmediateModal}
        onCancel={() => setShowImmediateModal(null)}
        onOk={confirmImmediateEffect}
        okText="确认生效"
        cancelText="取消"
      >
        <div>
          <p>确定立即生效吗？确定后环境将立即切换部署分支，请确保原分支已测试完成。</p>
          {showImmediateModal && (
            <div style={{ background: '#f5f5f5', padding: 12, borderRadius: 6, marginTop: 16 }}>
              <div><strong>分支：</strong>{showImmediateModal.branch.branch}</div>
              <div><strong>环境：</strong>{showImmediateModal.env}</div>
              <div><strong>功能：</strong>{showImmediateModal.branch.desc || '暂无描述'}</div>
            </div>
          )}
        </div>
      </Modal>

      {/* 部署记录详情Drawer（点击部署ID打开）：仅 ReplicaSet + Pod 展开 */}
      <Drawer
        title={`部署详情 - ${showDeployDetail?.deployId ?? ''}`}
        open={!!showDeployDetail}
        onClose={() => setShowDeployDetail(null)}
        width={900}
      >
        {showDeployDetail && (
          <div>
            <div style={{ marginBottom: 24 }}>
              <h3 style={{ marginBottom: 16 }}>ReplicaSet 信息</h3>
              <AntTable
                size="small"
                pagination={false}
                dataSource={showDeployDetail.replicaSets}
                rowKey="id"
                columns={[
                  { title: 'ReplicaSet', dataIndex: 'name', key: 'name', width: 240, render: (name: string) => <Text code>{name}</Text> },
                  { title: '创建时间', dataIndex: 'createdAt', key: 'createdAt', width: 140 },
                  { title: 'Pod 状态', dataIndex: 'podStatus', key: 'podStatus', width: 220, render: (podStatus: ReplicaSetRecord['podStatus']) => renderPodStatusSummary(podStatus) },
                  { title: '存活时间', dataIndex: 'uptime', key: 'uptime', width: 120 },
                ]}
                expandable={{
                  expandedRowRender: (replicaSet: ReplicaSetRecord) => (
                    <div style={{ padding: '8px 0' }}>
                      {replicaSet.pods.length === 0 ? (
                        <Text type="secondary">无运行中的Pod</Text>
                      ) : (
                        <AntTable
                          size="small"
                          pagination={false}
                          dataSource={replicaSet.pods}
                          rowKey="id"
                          columns={[
                            { title: 'Pod 名称', dataIndex: 'name', key: 'name', render: (name: string) => <Text code>{name}</Text> },
                            { title: '状态', dataIndex: 'status', key: 'status', render: (status: string) => getPodStatusTag(status) },
                            { title: '节点', dataIndex: 'node', key: 'node' },
                            { title: '重启次数', dataIndex: 'restartCount', key: 'restartCount' },
                          ]}
                        />
                      )}
                    </div>
                  ),
                  rowExpandable: (record) => record.pods.length > 0,
                }}
              />
            </div>
          </div>
        )}
      </Drawer>

      {/* Pod日志Drawer 保持不变 */}
      <Drawer
        title={`Pod 日志 - ${showPodLogs?.name}`}
        open={!!showPodLogs}
        onClose={() => setShowPodLogs(null)}
        width={800}
      >
        {showPodLogs && (
          <div>
            <Descriptions size="small" column={2} style={{ marginBottom: 16 }}>
              <Descriptions.Item label="Pod名称">{showPodLogs.name}</Descriptions.Item>
              <Descriptions.Item label="状态">{getPodStatusTag(showPodLogs.status)}</Descriptions.Item>
              <Descriptions.Item label="节点">{showPodLogs.node}</Descriptions.Item>
              <Descriptions.Item label="重启次数">{showPodLogs.restartCount}</Descriptions.Item>
            </Descriptions>
            <div style={{ background: '#000', color: '#00ff00', padding: 16, borderRadius: 6, fontFamily: 'monospace', fontSize: 12, height: 400, overflow: 'auto' }}>
              <div>2025-09-05 15:32:00 [INFO] Pod starting...</div>
              <div>2025-09-05 15:32:05 [INFO] Container image pulled successfully</div>
              <div>2025-09-05 15:32:10 [INFO] Container started</div>
              <div>2025-09-05 15:32:15 [INFO] Health check passed</div>
              <div>2025-09-05 15:32:20 [INFO] Pod ready</div>
            </div>
          </div>
        )}
      </Drawer>

    </main>
  )
}

