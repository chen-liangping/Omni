"use client"
import React, { useEffect, useMemo, useRef, useState } from 'react'
import { Card, Button as AntButton, Drawer, Form, Select as AntSelect, Input, Space, Tag, DatePicker, Modal, message, Typography, Steps, Collapse, Tabs, Table as AntTable } from 'antd'
import dayjs from 'dayjs'
import { DeleteOutlined, ThunderboltOutlined } from '@ant-design/icons'
import { CheckCircleTwoTone, CloseCircleTwoTone } from '@ant-design/icons'
import { getDeployRecordsMock, type DeployRecord } from './deploy.shared'
import GiscusComments from '../comments/GiscusComments'

/**
 * 这段代码实现了"项目详情"原型页：顶部项目信息 + 环境卡片列表 + 规划部署 + 部署记录
 * 代码说明：环境卡片展示当前生效分支、功能说明、生效时间范围与状态。部署记录Tab展示两级表格和详情Drawer。
 * 修改原因：满足 docs/定时发布.md 的项目详情需求，并在项目详情页中集成部署记录功能。
 */

const { Text } = Typography

type Env = 'stg'
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

// 部署记录相关类型统一从 mock 引入，避免重复定义

export default function ProjectDetail({ projectId }: { projectId: string }) {
  const [meta, setMeta] = useState<{ name: string; repo?: string }>({ name: `project-${projectId}` })
  const [envs, setEnvs] = useState<EnvBind[]>([])
  const [choices, setChoices] = useState<string[]>([])
  const [showEdit, setShowEdit] = useState<EnvBind | null>(null)
  const [form] = Form.useForm()
  
  // 状态管理
  const [showImmediateModal, setShowImmediateModal] = useState<{ branch: BranchBind; env: Env } | null>(null)
  const [activeTab, setActiveTab] = useState('panel')  // 当前页Tab：panel / ops
  
  // 部署记录相关状态
  const [deployGroups, setDeployGroups] = useState<DeployRecord[]>([])
  
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

  const handleRestart = (deploymentName: string) => {
    message.success(`正在重启 ${deploymentName}...`)
    setTimeout(() => message.success('重启完成'), 1500)
  }

  const handleSync = (deploymentName: string) => {
    message.success(`正在同步 ${deploymentName}...`)
    setTimeout(() => message.success('同步完成'), 1200)
  }

  const [showRollback, setShowRollback] = useState<{ open: boolean; target?: string }>({ open: false })
  
  // 记录每个分支是否处于“状态流转中”（仅被点击的分支卡片变化）
  // key = `${env}::${repo}::${branch}`
  type FlowStage = 'building' | 'build_failed' | 'build_succeeded' | 'sync_wait' | 'releasing' | 'release_failed' | 'release_succeeded'
  const [runningStageByKey, setRunningStageByKey] = useState<Record<string, FlowStage | undefined>>({})
  const [selectedFlowBranchKey, setSelectedFlowBranchKey] = useState<string | null>(null)
  const [removedUpcomingByKey, setRemovedUpcomingByKey] = useState<Record<string, boolean>>({})
  
  // 日志折叠开关与阶段计时、发布计时
  const [logsOpenByKey, setLogsOpenByKey] = useState<Record<string, boolean>>({})
  const [releaseTimeByKey, setReleaseTimeByKey] = useState<Record<string, string>>({})
  const [releaseLogsByKey, setReleaseLogsByKey] = useState<Record<string, string[]>>({})
  const releaseTimersRef = useRef<Record<string, number[]>>({})
  const clearReleaseTimers = (key: string) => {
    const list = releaseTimersRef.current[key] || []
    list.forEach(id => clearTimeout(id))
    releaseTimersRef.current[key] = []
  }
  // 操作记录（声明上移）
  type OperationStatus = '部署成功' | '编译失败' | '部署失败' | '进行中'
  interface OperationLog { id: string; operator: string; time: string; event: string; status: OperationStatus }
  const [opLogs, setOpLogs] = useState<OperationLog[]>([])
  const appendOpLog = (log: Partial<Pick<OperationLog, 'operator'>> & Omit<OperationLog, 'id' | 'time' | 'operator'>) => {
    const operator = log.operator ?? 'system'
    const entry: OperationLog = { id: `${Date.now()}-${Math.random().toString(16).slice(2)}`, operator, time: new Date().toLocaleString('sv-SE'), event: log.event, status: log.status }
    setOpLogs(prev => [entry, ...prev].slice(0, 200))
  }
  // 启动部署模拟
  const startRelease = (key: string) => {
    setRunningStageByKey(prev => ({ ...prev, [key]: 'releasing' }))
    clearReleaseTimers(key)
    const parsed = parseBranchKey(key)
    appendOpLog({ event: `开始部署 ${parsed ? parsed.branch : ''} 分支`, status: '进行中' })
    const t = window.setTimeout(() => {
      const success = true
      setRunningStageByKey(prev => ({ ...prev, [key]: success ? 'release_succeeded' : 'release_failed' }))
      if (success) setReleaseTimeByKey(prev => ({ ...prev, [key]: new Date().toLocaleString('sv-SE') }))
      if (success) setReleaseLogsByKey(prev => ({
        ...prev,
        [key]: [
          'Traced Next.js server files in: 92.17ms',
          'Created all serverless functions in: 122.342ms',
          'Collected static files (public/, static/, .next/static): 6.928ms',
          'Build Completed in /vercel/output [40s]',
          'Deploying outputs...',
          'Deployment completed',
          'Creating build cache...',
          'Created build cache: 20.629s',
        ]
      }))
      appendOpLog({ event: `部署 ${parsed ? parsed.branch : ''} 分支`, status: success ? '部署成功' : '部署失败' })
      if (success && parsed) {
        // 将该分支设置为唯一生效分支
        const now = new Date().toLocaleString('sv-SE').replace('T', ' ').substring(0, 19)
        setEnvs(prev => prev.map(e =>
          e.env === parsed.env
            ? {
                ...e,
                binds: (e.binds || []).map(b => {
                  if (b.repo === parsed.repo && b.branch === parsed.branch) {
                    return { ...b, start: now, status: 'active' }
                  }
                  // 其他原 active 置回 testing，并标记实际失效时间
                  if (b.status === 'active') {
                    return { ...b, actualExpiredAt: now, status: 'testing' }
                  }
                  return b
                })
              }
            : e
        ))
        // 不清理部署区，让卡片与日志保留
      }
    }, 6000)
    releaseTimersRef.current[key] = [t]
  }
  const [buildElapsedByKey, setBuildElapsedByKey] = useState<Record<string, number>>({})
  const buildTimerRef = useRef<Record<string, number>>({})
  const clearBuildTimer = (key: string) => {
    const id = buildTimerRef.current[key]
    if (id != null) { clearInterval(id); delete buildTimerRef.current[key] }
  }
  const formatElapsed = (s: number) => `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`

  // 打开规划部署抽屉（仅 stg）
  const openPlanning = (env: Env) => {
    const target = envs.find(x => x.env === env)
    setShowEdit({ env, binds: target?.binds || [] })
    const bindsWithStartTime = (target?.binds || []).map((b) => ({
      ...b,
      startTime: b.start ? dayjs(b.start) : undefined,
    }))
    form.setFieldsValue({ env, binds: bindsWithStartTime.length ? bindsWithStartTime : [{ branch: '', desc: '', startTime: undefined }] })
  }

  const getBranchKey = (env: Env, bind: BranchBind) => `${env}::${bind.repo}::${bind.branch}`
  const parseBranchKey = (key: string): { env: Env; repo: string; branch: string } | null => {
    const parts = key.split('::')
    if (parts.length !== 3) return null
    const [env, repo, branch] = parts
    return { env: env as Env, repo, branch }
  }
  const openRollback = (deploymentName: string) => setShowRollback({ open: true, target: deploymentName })
  const confirmRollback = (commitId: string) => {
    message.success(`已回滚到 ${commitId}`)
    setShowRollback({ open: false, target: undefined })
  }

  
  // 类型保护：确保包含 node 与 restartCount 字段
  function hasPodRuntimeFields(p: DeployRecord | null): p is DeployRecord & { node: string; restartCount: number } {
    if (!p || typeof p !== 'object') return false
    const candidate = (p as unknown) as Record<string, unknown>
    const hasNode = 'node' in candidate && typeof candidate.node === 'string'
    const hasRestart = 'restartCount' in candidate && typeof candidate.restartCount === 'number'
    return hasNode && hasRestart
  }

  const showDeployDetails = (deploy: DeployRecord) => {
    // setShowDeployDetail(deploy) // This state is no longer needed
  }

  // 打开指定环境的部署详情（Deployment/Pod Drawer）
  const openUpcomingEnvDetails = (env: Env, bind: BranchBind) => {
    // setSelectedFlowBranchKey(getBranchKey(env, bind)) // This state is no longer needed
    // if (envDeploy) {
    //   setShowDeployDetail(envDeploy)
    // } else {
    //   message.info('暂无该环境的部署记录')
    // }
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
    const key = getBranchKey(env, branch)
    // 进入编译中
    setRunningStageByKey(prev => ({ ...prev, [key]: 'building' }))
    setSelectedFlowBranchKey(key)
    setShowImmediateModal(null)
    // 从待生效区移除该分支
    setRemovedUpcomingByKey(prev => ({ ...prev, [key]: true }))
    appendOpLog({ event: `触发立即生效：部署 ${branch.branch} 分支`, status: '进行中' })
    // 模拟编译完成（包含失败路径，可调整概率或接入真实状态）
    setTimeout(() => {
      const fail = Math.random() < 0.2 // 20% 模拟失败
      setRunningStageByKey(prev => ({ ...prev, [key]: fail ? 'build_failed' : 'build_succeeded' }))
      if (fail) {
        appendOpLog({ event: `编译 ${branch.branch} 分支`, status: '编译失败' })
      }
      if (!fail) {
        // 编译成功后进入等待 Sync 阶段，并直接打开部署详情（Deployment/Pod）Drawer
        setRunningStageByKey(prev => ({ ...prev, [key]: 'sync_wait' }))
        // 在方案B（合并视图）下，不自动打开 Drawer，由页面下方记录区承载
        if (true) {
          // const envDeploy = deployGroups.find(d => d.environment === env) // This state is no longer needed
          // if (envDeploy) setShowDeployDetail(envDeploy) // This state is no longer needed
        } else {
          // 合并视图：自动滚动至记录区
          // try { recordsSectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }) } catch {} // This ref is no longer needed
        }
      }
    }, 1200)
  }



  return (
    <main style={{ padding: 24 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <div>
          <h1 style={{ color: 'var(--heading)', margin: 0 }}>{meta.name}</h1>
          {meta.repo ? <a href={meta.repo} target="_blank" rel="noreferrer">{meta.repo}</a> : <span style={{ color: '#6b7280' }}>未配置仓库</span>}
        </div>
      </div>
      <Tabs activeKey={activeTab} onChange={setActiveTab} items={[{ key: 'panel', label: '部署面板' }, { key: 'ops', label: '操作记录' }]} />

      {activeTab === 'panel' && (
      <>
      {/* 当前生效分支（stg）基础信息卡 */}
      <Card style={{ marginBottom: 16 }} title="当前生效分支">
        {(() => {
          const primaryRepo = repoChoices[0]
          if (!primaryRepo) return <Text type="secondary">未配置仓库</Text>
          const e = envs.find(x => x.env === 'stg')
          const binds = e?.binds ?? []
          const list = binds.filter(b => b.repo === primaryRepo)
          const timedActive = list.filter(b => b.status === 'active').sort((a, b) => (new Date(b.start as string).getTime()) - (new Date(a.start as string).getTime()))
          const defaultBind = list.find(b => b.isDefault && (b.status === 'testing' || b.status === 'active'))
          const bind = timedActive[0] || defaultBind
          const latestEnvStatus = (() => {
            const envRecords = deployGroups.filter(d => d.environment === 'stg')
            const head = envRecords[0]
            return head && head.status === 'failed' ? 'failed' : 'success'
          })()
          return (
            <div style={{ border: '1px solid #f0f0f0', borderRadius: 8, padding: 12, position: 'relative' }}>
              {latestEnvStatus === 'success' ? (
                <CheckCircleTwoTone twoToneColor="#52c41a" style={{ position: 'absolute', top: 8, right: 8, fontSize: 16 }} title="部署成功" />
              ) : (
                <CloseCircleTwoTone twoToneColor="#ff4d4f" style={{ position: 'absolute', top: 8, right: 8, fontSize: 16 }} title="部署失败" />
              )}
              <Space>
                <Tag color="blue">stg</Tag>
                <span style={{ fontWeight: 600 }}>{bind ? `${bind.repo}/${bind.branch}` : '未生效'}</span>
              </Space>
              <div style={{ marginTop: 6, fontSize: 12, color: '#6b7280' }}>生效时间：{bind?.start ?? '-'}</div>
              {bind?.desc ? <div style={{ fontSize: 12, color: '#6b7280' }}>功能：{bind.desc}</div> : null}
            </div>
          )
        })()}
      </Card>

      {/* 待生效（横向排列） */}
      <div style={{ display: 'grid', gap: 12, gridTemplateColumns: '1fr', alignItems: 'stretch' }}>
        {envs.filter(e => e.env === 'stg').map(e => {
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
          // 计算当前环境最新部署状态（简化逻辑：取该环境的第一条记录，非 failed 视为 success）
          const latestEnvStatus = (() => {
            const envRecords = deployGroups.filter(d => d.environment === e.env)
            const head = envRecords[0]
            return head && head.status === 'failed' ? 'failed' : 'success'
          })()
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
            <Card key={e.env} style={{ width: '100%' }} title={<span>待生效</span>} extra={<AntButton onClick={() => openPlanning(e.env)}>规划部署</AntButton>}>
              <div>
                <div style={{ fontSize: 12, color: '#6b7280', marginBottom: 6 }}>待生效</div>
                {upcomingList.length ? (
                  <div style={{ display: 'grid', gap: 8, gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))' }}>
                    {upcomingList.filter(u => !removedUpcomingByKey[getBranchKey(e.env, u)]).map((u, i) => (
                      <div key={i} style={{ border: '1px solid #1677ff', background: '#f0f7ff', borderRadius: 8, padding: 12, wordBreak: 'break-word' }}>
                        {/* 顶行：分支 + 生效时间 */}
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 6 }}>
                          <div style={{ fontWeight: 600 }}>{u.branch}</div>
                          <div style={{ fontSize: 12, color: '#6b7280' }}>{u.start ?? '-'}</div>
                        </div>
                        {/* 功能说明 */}
                        <div style={{ fontSize: 12, color: '#6b7280', marginBottom: 8 }}>{u.desc || '暂无描述'}</div>
                        {/* 操作：立即生效 */}
                        <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                          <AntButton size="small" type="primary" icon={<ThunderboltOutlined />} onClick={() => handleImmediateEffect(u, e.env)}>立即生效</AntButton>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div style={{ border: '1px dashed #e5e7eb', borderRadius: 8, padding: 12, color: '#6b7280' }}>暂无待生效的分支</div>
                )}
              </div>
            </Card>
          )
        })}
      </div>

      {/* 编译区：展示当前步骤状态 */}
      {selectedFlowBranchKey && (() => {
        const key = selectedFlowBranchKey
        const stage = runningStageByKey[key]
        if (!stage) return null
        const stageText = stage === 'building' ? '编译中'
          : stage === 'build_succeeded' ? '编译成功'
          : stage === 'sync_wait' ? '待部署'
          : stage === 'build_failed' ? '编译失败'
          : stage === 'releasing' ? '部署中'
          : stage === 'release_succeeded' ? '部署成功'
          : stage === 'release_failed' ? '部署失败'
          : stage
        const stageColor: 'processing' | 'success' | 'error' = (stage === 'building' || stage === 'releasing') ? 'processing' : (stage.endsWith('succeeded') ? 'success' : (stage.endsWith('failed') ? 'error' : 'processing'))
        const parsed = parseBranchKey(key)
        const [logsOpen, setLogsOpen] = [Boolean(logsOpenByKey[key]), (open: boolean) => setLogsOpenByKey(prev => ({ ...prev, [key]: open }))]
        return (
          <Card size="small" style={{ marginTop: 12 }}>
            {/* 合并部署日志（原独立卡片内容） */}
            <div style={{ marginTop: 8 }}>
              <Collapse activeKey={logsOpen ? ['log'] : []} onChange={(k) => setLogsOpen(Array.isArray(k) ? (k as string[]).includes('log') : String(k) === 'log')}>
                <Collapse.Panel
                  key="log"
                  header={
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <span style={{ fontSize: 12, color: '#6b7280' }}>当前步骤：</span>
                        <Tag color={stageColor === 'success' ? 'green' : stageColor === 'error' ? 'red' : 'blue'}>{stageText}</Tag>
                        {stage === 'release_succeeded' && (
                          <span style={{ fontSize: 12, color: '#6b7280' }}>完成时间：{releaseTimeByKey[key] || '-'}</span>
                        )}
                      </div>
                      <div>
                        {(stage === 'build_succeeded' || stage === 'sync_wait') && (
                          <AntButton size="small" type="link" style={{ padding: 0 }} onClick={() => startRelease(key)}>部署</AntButton>
                        )}
                        {stage === 'build_failed' && (
                          <AntButton size="small" type="link" danger style={{ padding: 0 }} onClick={() => {
                            Modal.confirm({
                              title: '需要重新提交代码',
                              onOk: () => {
                                setRunningStageByKey(prev => { const next = { ...prev }; delete next[key]; return next })
                                setSelectedFlowBranchKey(null)
                                setRemovedUpcomingByKey(prev => { const next = { ...prev }; delete next[key]; return next })
                                const p = parseBranchKey(key)
                                appendOpLog({ event: `重新规划 ${p ? p.branch : ''} 分支`, status: '进行中' })
                              }
                            })
                          }}>重新规划</AntButton>
                        )}
                        {stage === 'release_failed' && (
                          <AntButton size="small" type="link" style={{ padding: 0 }} onClick={() => startRelease(key)}>重新部署</AntButton>
                        )}
                      </div>
                    </div>
                  }
                >
                  <div style={{ display: 'grid', gap: 12 }}>
                    <div>
                      <div style={{ fontWeight: 600, marginBottom: 6 }}>{parsed ? `${parsed.repo}/${parsed.branch} - 编译日志` : '编译日志'}</div>
                      <div style={{ fontFamily: 'monospace', fontSize: 12, background: '#fafafa', border: '1px solid #f0f0f0', borderRadius: 8, padding: 12 }}>
                        <div>[构建] 安装依赖…</div>
                        <div>[构建] 打包…</div>
                        <div>编译用时：{formatElapsed(buildElapsedByKey[key] || 0)}</div>
                        {stage === 'build_failed' && <div style={{ color: '#d84a1b' }}>[ERROR] 构建失败</div>}
                        {stage === 'build_succeeded' && <div style={{ color: '#52c41a' }}>[OK] 构建完成</div>}
                      </div>
                    </div>
                    <div>
                      <div style={{ fontWeight: 600, marginBottom: 6 }}>{parsed ? `${parsed.repo}/${parsed.branch} - 部署日志` : '部署日志'}</div>
                      <div style={{ fontFamily: 'monospace', fontSize: 12, background: '#fafafa', border: '1px solid #f0f0f0', borderRadius: 8, padding: 12 }}>
                        {stage === 'releasing' && <div>发布中…</div>}
                        {stage === 'release_failed' && <div style={{ color: '#ff4d4f' }}>[ERROR] 部署失败：镜像拉取失败</div>}
                        {stage === 'release_succeeded' && (
                          <>
                            <div style={{ color: '#52c41a' }}>[OK] 部署成功</div>
                            {(releaseLogsByKey[key] || []).map((line, idx) => (
                              <div key={idx}>{line}</div>
                            ))}
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                </Collapse.Panel>
              </Collapse>
            </div>
          </Card>
        )
      })()}

      {/* 合并后不再渲染独立日志卡片 */}
      </>
      )}

      {/* 规划部署抽屉 */}
      <Drawer
        title={`规划部署 - ${showEdit?.env?.toUpperCase()} 环境`}
        open={!!showEdit}
        onClose={() => setShowEdit(null)}
        width={800}
        extra={<Space><AntButton onClick={() => setShowEdit(null)}>取消</AntButton><AntButton type="primary" onClick={onSave}>保存</AntButton></Space>}
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

      {/* 移除 Deployment/Pod Drawer 与 Pod 日志 Drawer */}

      {/* 操作记录 */}
      {activeTab === 'ops' && (
        <Card style={{ marginTop: 16 }} title="操作记录">
          <AntTable
            size="small"
            rowKey={(r: OperationLog) => r.id}
            dataSource={opLogs}
            pagination={{ pageSize: 5 }}
            columns={[
              { title: '操作人', dataIndex: 'operator', key: 'operator', width: 120 },
              { title: '操作时间', dataIndex: 'time', key: 'time', width: 180 },
              { title: '操作事件', dataIndex: 'event', key: 'event' },
              { title: '状态', dataIndex: 'status', key: 'status', width: 120 },
            ]}
          />
        </Card>
      )}

      {/* 评论区域 */}
      <div style={{ marginTop: 24 }}>
        <GiscusComments />
      </div>

      {/* 已移除 RollbackModal */}

    </main>
  )
}

type HasFormat = { format: (fmt: string) => string }

