"use client"
import React, { useEffect, useMemo, useState } from 'react'
import { Card, Button as AntButton, Drawer, Form, Select as AntSelect, Input, Space, Tag, DatePicker, Checkbox, Tabs, Modal, message, Table as AntTable, Popconfirm } from 'antd'
import { DeleteOutlined, CheckOutlined, MergeOutlined, ThunderboltOutlined, UndoOutlined, CopyOutlined } from '@ant-design/icons'
import type { ColumnsType } from 'antd/es/table'

/**
 * 这段代码实现了“项目详情”原型页：顶部项目信息 + 环境卡片列表 + 规划部署
 * 代码说明：环境卡片展示当前生效分支、功能说明、生效时间范围与状态。
 * 修改原因：满足 docs/定时发布.md 的项目详情需求。
 */

type Env = 'stg' | 'prod'
type BranchStatus = 'active' | 'testing' | 'completed' | 'merged' | 'rollback'

interface BranchBind { 
  repo: string; 
  branch: string; 
  desc?: string; 
  start?: string; 
  end?: string; 
  isDefault?: boolean;
  status?: BranchStatus;
  testCompletedAt?: string;
  mergedAt?: string;
  actualExpiredAt?: string;  // 实际失效时间
}

interface EnvBind { env: Env; binds: BranchBind[] }

interface CommitRecord {
  id: string;
  submitter: string;
  branch: string;
  desc: string;
  commitId: string;
  pullUrl: string;
  status: 'pending' | 'approved' | 'rejected';
  reviewer?: string;
  createdAt: string;
}

type HasFormat = { format: (fmt: string) => string }

export default function ProjectDetail({ projectId }: { projectId: string }) {
  const [meta, setMeta] = useState<{ name: string; repo?: string }>({ name: `project-${projectId}` })
  const [envs, setEnvs] = useState<EnvBind[]>([])
  const [choices, setChoices] = useState<string[]>([])
  const [showEdit, setShowEdit] = useState<EnvBind | null>(null)
  const [form] = Form.useForm()
  
  // 新增状态管理
  const [activeTab, setActiveTab] = useState('deployment')
  const [commits, setCommits] = useState<CommitRecord[]>([])
  const [showMergeModal, setShowMergeModal] = useState<{ branch: BranchBind; env: Env } | null>(null)
  const [showImmediateModal, setShowImmediateModal] = useState<{ branch: BranchBind; env: Env } | null>(null)
  const [showDeploySpecialModal, setShowDeploySpecialModal] = useState<Env | null>(null)
  const [mergeForm] = Form.useForm()
  const [generatedCommit, setGeneratedCommit] = useState<{ commitId: string; pullUrl: string } | null>(null)

  // 仓库与分支：仓库来自 projects 列表（localStorage），分支提供基础候选
  const repoChoices = choices
  const repoBranches: Record<string, string[]> = useMemo(() => {
    const base: Record<string, string[]> = {}
    choices.forEach((r) => {
      base[r] = ['main', 'develop', 'release/2025-10', 'feat/login', 'feat/api', 'feature/billing']
    })
    return base
  }, [choices])

  // 根据仓库地址生成mock环境绑定数据（只mock分支信息）
  const buildDemoEnvs = (repoUrl: string): EnvBind[] => ([
    {
      env: 'stg',
      binds: [
        { repo: repoUrl, branch: 'develop', desc: '2.1.X应用服务及日常优化合并dev', start: '2025-09-01 10:30', end: '2025-09-31 18:00', status: 'testing' },
        { repo: repoUrl, branch: 'feature/login', desc: '登录功能', start: '2025-09-04 14:20', end: '2025-12-31 18:00', status: 'testing' },
        { repo: repoUrl, branch: 'feature/payment', desc: 'CDN重构相关', start: '2025-09-05 09:00', end: '2025-12-31 18:00', status: 'completed', testCompletedAt: '2025-09-25 16:30' },
        { repo: repoUrl, branch: 'feature/dashboard', desc: '仪表盘功能优化', start: '2025-09-03 09:00', end: '2025-12-31 18:00', status: 'completed', testCompletedAt: '2025-10-12 10:00' },
        { repo: repoUrl, branch: 'feature/user-profile', desc: '用户资料管理', start: '2025-08-20 10:00', end: '2025-09-01 18:00', status: 'merged', mergedAt: '2025-09-01 16:20' },
        { repo: repoUrl, branch: 'hotfix/bug-fix', desc: '修复关键bug', start: '2025-08-25 14:00', end: '2025-08-30 18:00', status: 'merged', mergedAt: '2025-08-30 15:45' },
      ],
    },
    {
      env: 'prod',
      binds: [
        { repo: repoUrl, branch: 'main', desc: '稳定版本', start: '2025-09-15 09:00', isDefault: true, status: 'testing' }, 
        { repo: repoUrl, branch: 'release/2.0.0', desc: '2.0.0 版本', start: '2025-01-01 16:30', end: '2025-12-31 23:59', status: 'testing' }, 
      ],
    },
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
        binds: env.binds.map(bind => {
          // 检查分支是否到达失效时间
          if (bind.end && bind.status !== 'merged' && bind.status !== 'completed') {
            const endTime = new Date(bind.end)
            if (endTime.getTime() <= now.getTime()) {
              // 分支到达失效时间，记录实际失效时间
              console.log(`分支 ${bind.branch} 已到达失效时间，实际失效时间: ${nowStr}`)
              return { 
                ...bind, 
                actualExpiredAt: nowStr,  // 记录实际失效时间
                status: 'completed' as const  // 状态改为completed
              }
            }
          }
          return bind
        })
      })))
    }

    // 立即检查一次
    checkExpiredBranches()
    
    // 每分钟检查一次
    const interval = setInterval(checkExpiredBranches, 60000)
    
    return () => clearInterval(interval)
  }, [])

  // 监听分支状态更新（来自commit列表的拒绝操作）
  useEffect(() => {
    const handleBranchStatusUpdate = (e: StorageEvent) => {
      if (e.key === 'omni-branch-status-update' && e.newValue) {
        try {
          const update = JSON.parse(e.newValue) as { action: string; branch: string; timestamp: number }
          
          if (update.action === 'reject') {
            // 拒绝后将分支状态改回completed，并设置失效时间确保不在生效中显示
            const now = new Date().toLocaleString('sv-SE').replace('T', ' ').substring(0, 19)
            setEnvs(prev => prev.map(env => ({
              ...env,
              binds: env.binds.map(bind => 
                bind.branch === update.branch 
                  ? { 
                      ...bind, 
                      status: 'completed' as const,
                      actualExpiredAt: now  // 记录实际失效时间
                    }
                  : bind
              )
            })))
          }
        } catch (error) {
          console.error('处理分支状态更新失败:', error)
        }
      }
    }

    window.addEventListener('storage', handleBranchStatusUpdate)
    return () => window.removeEventListener('storage', handleBranchStatusUpdate)
  }, [])

  const statusOf = (e: EnvBind) => {
    if (!e.binds || e.binds.length === 0) return '待生效'
    const hasActive = e.binds.some(b => !b.end)
    const allEnded = e.binds.every(b => !!b.end)
    if (hasActive) return '运行中'
    if (allEnded) return '未运行'
    return '待生效'
  }

  const onOpenEdit = (e: EnvBind) => {
    setShowEdit(e)
    // 预填充：将 start/end 映射为 range（不做严格 dayjs 转换，保持原型轻量）
    // 注意：RangePicker 期望接收 dayjs 对象，原型不引入 dayjs，避免传 string 触发 isValid 报错
    // 因此编辑态不预填 range，保留为 undefined，让用户重新选择时间段
    const bindsWithRange = (e.binds || []).map(b => ({
      ...b,
      isDefault: b.isDefault ?? (!b.start && !b.end),
      range: undefined
    }))
    form.setFieldsValue({ env: e.env, binds: bindsWithRange.length ? bindsWithRange : [{ branch: '', desc: '', range: undefined }] })
  }

  const onSave = async () => {
    const v = await form.validateFields() as { env: Env; binds: Array<BranchBind & { range?: [unknown, unknown]; robotIds?: string[] }> }
    const normalized: Array<BranchBind & { robotIds?: string[] }> = (v.binds || []).map((b) => {
      let start: string | undefined = b.start
      let end: string | undefined = b.end
      if (b.range) {
        const [s, e] = b.range
        if (s && typeof s === 'object' && 'format' in s && typeof (s as HasFormat).format === 'function') {
          start = (s as HasFormat).format('YYYY-MM-DD HH:mm')
        } else if (s != null) {
          start = String(s)
        }
        if (e && typeof e === 'object' && 'format' in e && typeof (e as HasFormat).format === 'function') {
          end = (e as HasFormat).format('YYYY-MM-DD HH:mm')
        } else if (e != null) {
          end = String(e)
        }
      }
      const result: BranchBind & { robotIds?: string[] } = {
        repo: meta.repo || repoChoices[0], // 使用项目默认仓库
        branch: b.branch,
        isDefault: b.isDefault,
        desc: b.isDefault ? undefined : b.desc,
        start: b.isDefault ? undefined : start,
        end: b.isDefault ? undefined : end,
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

  // 新增功能函数
  const handleTestComplete = (branch: BranchBind, env: Env) => {
    // 如果分支已经是completed状态，不执行任何操作
    if (branch.status === 'completed') {
      return
    }
    
    const now = new Date().toLocaleString('sv-SE').replace('T', ' ').substring(0, 19)
    setEnvs(prev => prev.map(e => 
      e.env === env 
        ? { ...e, binds: e.binds.map(b => 
            b.branch === branch.branch && b.repo === branch.repo 
              ? { ...b, status: 'completed', testCompletedAt: now }
              : b
          )}
        : e
    ))
    message.success(`分支 ${branch.branch} 已标记为测试完成`)
  }

  const handleMergeCode = (branch: BranchBind, env: Env) => {
    setShowMergeModal({ branch, env })
    mergeForm.setFieldsValue({ desc: branch.desc || '' })
  }

  const generateCommitLink = async () => {
    if (!showMergeModal) return
    
    try {
      const values = await mergeForm.validateFields() as { desc: string }
      
      // 生成模拟的commit信息
      const commitId = Math.random().toString(36).substring(2, 8).toUpperCase()
      const pullUrl = `https://github.com/example/repo/pull/${Math.floor(Math.random() * 1000) + 1}`
      
      setGeneratedCommit({ commitId, pullUrl })
      message.success('Commit链接已生成')
    } catch (error) {
      console.error('生成链接失败:', error)
    }
  }

  const confirmMergeCode = async () => {
    if (!showMergeModal || !generatedCommit) return
    
    try {
      const values = await mergeForm.validateFields() as { desc: string }
      const { branch, env } = showMergeModal
      const now = new Date().toLocaleString('sv-SE').replace('T', ' ').substring(0, 19)
      
      // 创建commit记录
      const newCommit: CommitRecord = {
        id: String(Date.now()),
        submitter: '当前用户',
        branch: branch.branch,
        desc: values.desc,
        commitId: generatedCommit.commitId,
        pullUrl: generatedCommit.pullUrl,
        status: 'pending',
        createdAt: now
      }
      
      setCommits(prev => [newCommit, ...prev])
      
      // 同步到localStorage供commit列表页面使用
      try {
        const existingCommits = localStorage.getItem('omni-commits')
        const allCommits = existingCommits ? JSON.parse(existingCommits) : []
        const updatedCommits = [newCommit, ...allCommits]
        localStorage.setItem('omni-commits', JSON.stringify(updatedCommits))
      } catch (error) {
        console.error('保存commit数据失败:', error)
      }
      
      // 更新分支状态
      setEnvs(prev => prev.map(e => 
        e.env === env 
          ? { ...e, binds: e.binds.map(b => 
              b.branch === branch.branch && b.repo === branch.repo 
                ? { ...b, status: 'merged', mergedAt: now }
                : b
            )}
          : e
      ))
      
      setShowMergeModal(null)
      setGeneratedCommit(null)
      mergeForm.resetFields()
      message.success('代码合并请求已提交')
    } catch (error) {
      console.error('合并代码失败:', error)
    }
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
              // 如果是要立即生效的分支，更新开始时间
              if (b.branch === branch.branch && b.repo === branch.repo) {
                return { ...b, start: now }
              }
              
              // 如果是当前生效的其他分支（包括dev分支），设置失效时间
              const bindStart = b.start ? new Date(b.start) : null
              const bindEnd = b.end ? new Date(b.end) : null
              const nowTime = new Date(now)
              
              const isCurrentlyActive = !b.isDefault && 
                bindStart && bindStart.getTime() <= nowTime.getTime() &&
                (!bindEnd || bindEnd.getTime() > nowTime.getTime()) &&
                b.status !== 'completed' && b.status !== 'merged' &&
                !(b.branch === branch.branch && b.repo === branch.repo)  // 排除要立即生效的分支本身
              
              if (isCurrentlyActive) {
                // 当前生效分支失效，记录实际失效时间
                return { ...b, actualExpiredAt: now }
              }
              
              return b
            })
          }
        : e
    ))
    
    setShowImmediateModal(null)
    message.success(`分支 ${branch.branch} 已立即生效，其他生效分支已失效`)
  }

  const handleTestRollback = (branch: BranchBind, env: Env) => {
    const now = new Date()
    
    setEnvs(prev => prev.map(e => 
      e.env === env 
        ? { ...e, binds: e.binds.map(b => 
            b.branch === branch.branch && b.repo === branch.repo 
              ? (() => {
                  // 判断分支是否还在生效时间内
                  const startTime = b.start ? new Date(b.start) : null
                  const endTime = b.end ? new Date(b.end) : null
                  const isStillActive = startTime && 
                    startTime.getTime() <= now.getTime() &&
                    (!endTime || endTime.getTime() > now.getTime())
                  
                  if (isStillActive) {
                    // 如果分支还在生效时间内，保持原有时间配置，只改变状态
                    return { 
                      ...b, 
                      status: 'testing', 
                      testCompletedAt: undefined
                      // 保持原有的start和end时间
                    }
                  } else {
                    // 如果分支不在生效时间内，清除所有时间配置
                    return { 
                      ...b, 
                      status: 'testing', 
                      testCompletedAt: undefined,
                      start: undefined,  // 清除生效时间
                      end: undefined     // 清除失效时间
                    }
                  }
                })()
              : b
          )}
        : e
    ))
    
    // 根据分支是否还在生效时间内给出不同的提示
    const startTime = branch.start ? new Date(branch.start) : null
    const endTime = branch.end ? new Date(branch.end) : null
    const isStillActive = startTime && 
      startTime.getTime() <= now.getTime() &&
      (!endTime || endTime.getTime() > now.getTime())
    
    if (isStillActive) {
      message.success(`分支 ${branch.branch} 已测试回退，保持生效状态`)
    } else {
      message.success(`分支 ${branch.branch} 已测试回退，需要重新规划部署时间`)
    }
  }

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text).then(() => {
      message.success('链接已复制到剪贴板')
    }).catch(() => {
      message.error('复制失败')
    })
  }

  // 获取已测试完成的分支
  const getCompletedBranches = () => {
    const completed: Array<BranchBind & { env: Env }> = []
    envs.forEach(e => {
      e.binds.forEach(b => {
        if (b.status === 'completed') {
          completed.push({ ...b, env: e.env })
        }
      })
    })
    return completed
  }

  // 获取已合并的分支
  const getMergedBranches = (env: Env) => {
    const envData = envs.find(e => e.env === env)
    if (!envData) return []
    
    return envData.binds.filter(b => b.status === 'merged')
  }

  // 部署特殊分支（STG部署dev，PROD部署master）
  const handleDeploySpecialBranch = (env: Env) => {
    setShowDeploySpecialModal(env)
  }

  const confirmDeploySpecialBranch = () => {
    if (!showDeploySpecialModal || !meta.repo) return
    
    const env = showDeploySpecialModal
    const now = new Date().toLocaleString('sv-SE').replace('T', ' ').substring(0, 19)
    
    // 根据环境确定部署的分支
    const deployBranch = env === 'prod' ? 'master' : 'dev'
    const deployDesc = env === 'prod' ? '生产主分支部署' : '开发分支部署'
    
    // 创建特殊分支绑定
    const specialBind: BranchBind = {
      repo: meta.repo,
      branch: deployBranch,
      desc: deployDesc,
      start: now,
      status: 'testing'  // 特殊分支部署后也是testing状态，需要走测试流程
      // 没有end时间，表示持续生效
    }
    
    setEnvs(prev => prev.map(e => 
      e.env === env 
        ? { 
            ...e, 
            binds: (() => {
              const existingBinds = e.binds.map(b => {
                // 如果是当前生效的分支（非默认分支且在生效时间内），设置失效时间
                const bindStart = b.start ? new Date(b.start) : null
                const bindEnd = b.end ? new Date(b.end) : null
                const nowTime = new Date(now)
                
                const isCurrentlyActive = !b.isDefault && 
                  bindStart && bindStart.getTime() <= nowTime.getTime() &&
                  (!bindEnd || bindEnd.getTime() > nowTime.getTime()) &&
                  b.status !== 'completed' && b.status !== 'merged'
                
                if (isCurrentlyActive) {
                  // 当前生效分支失效，记录实际失效时间
                  return { ...b, actualExpiredAt: now }
                }
                
                return b
              })
              
              // 移除现有的特殊分支（如果有），然后添加新的特殊分支
              const withoutSpecialBranch = existingBinds.filter(b => b.branch !== deployBranch)
              return [specialBind, ...withoutSpecialBranch]
            })()
          }
        : e
    ))
    
    setShowDeploySpecialModal(null)
    message.success(`${env.toUpperCase()}环境已部署${deployBranch}分支，当前生效分支已失效`)
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
            label: '环境部署',
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
              .filter(b => b.start && (new Date(b.start as string)).getTime() <= now.getTime())
              .filter(b => {
                // 检查计划失效时间
                const planExpired = b.end && (new Date(b.end as string)).getTime() <= now.getTime()
                // 检查实际失效时间
                const actualExpired = b.actualExpiredAt && (new Date(b.actualExpiredAt)).getTime() <= now.getTime()
                // 只要有一个失效时间到达就认为分支失效
                return !planExpired && !actualExpired
              })
              .filter(b => b.status !== 'merged')  // 只排除已合并的分支，completed状态的分支如果未失效仍然显示
              .sort((a, b) => (new Date(b.start as string).getTime()) - (new Date(a.start as string).getTime()))
            
            const defaultBind = list.find(b => b.isDefault && b.status !== 'merged') // 默认分支只排除merged状态
            
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
            <Card key={e.env} style={{ width: '100%' }} title={<Space><Tag color={e.env==='prod'?'gold':'blue'}>{e.env}</Tag><span>{statusOf(e)}</span></Space>} extra={
              <Space>
                <AntButton onClick={() => onOpenEdit(e)}>规划部署</AntButton>
                <AntButton type="primary" onClick={() => handleDeploySpecialBranch(e.env)}>
                  {e.env === 'prod' ? '部署master' : '部署dev'}
                </AntButton>
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
                            {bind.start ?? '-'} ~ {bind.end ?? '-'}
                            {bind.actualExpiredAt && (
                              <div style={{ fontSize: 11, color: '#ff4d4f', marginTop: 2 }}>
                                实际失效：{bind.actualExpiredAt}
                              </div>
                            )}
                          </div>
                          
                          {/* 生效中卡片操作按钮 */}
                          {!bind.isDefault && (
                            <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
                              {/* 测试完成按钮 - testing状态可点击，completed状态置灰 */}
                              {(bind.status === 'testing' || bind.status === 'completed') && (
                                <AntButton 
                                  size="small" 
                                  icon={<CheckOutlined />}
                                  onClick={() => handleTestComplete(bind, e.env)}
                                  disabled={bind.status === 'completed'}
                                >
                                  {bind.status === 'completed' ? '测试完成' : '测试完成'}
                                </AntButton>
                              )}
                              
                              {/* 合并代码按钮 - 在active、testing、completed状态时都显示，但不包括已合并状态 */}
                              {(bind.status === 'active' || bind.status === 'testing' || bind.status === 'completed') && (
                                <AntButton 
                                  size="small" 
                                  icon={<MergeOutlined />}
                                  onClick={() => handleMergeCode(bind, e.env)}
                                >
                                  合并代码
                                </AntButton>
                              )}
                            </div>
                          )}
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
            key: 'completed',
            label: '测试完成',
            children: (
              <div style={{ padding: '16px 0' }}>
                <div style={{ marginBottom: 16 }}>
                  <h3 style={{ margin: 0, color: 'var(--heading)' }}>已测试完成的分支</h3>
                  <div style={{ color: '#666', fontSize: 14 }}>以下分支已完成功能测试，可以进行代码合并或测试回退操作</div>
                </div>
                
                {getCompletedBranches().length > 0 ? (
                  <div style={{ display: 'grid', gap: 12 }}>
                    {getCompletedBranches().map((branch, index) => (
                      <Card key={index} size="small">
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
                          <div style={{ flex: 1 }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                              <Tag color={branch.env === 'prod' ? 'gold' : 'blue'}>{branch.env}</Tag>
                              <span style={{ fontWeight: 600 }}>{branch.branch}</span>
                            </div>
                            <div style={{ marginBottom: 4, color: '#666' }}>{branch.desc || '暂无描述'}</div>
                            <div style={{ fontSize: 12, color: '#999' }}>
                              测试完成时间：{branch.testCompletedAt || '-'}
                            </div>
                          </div>
                          <div style={{ display: 'flex', gap: 8 }}>
                            <AntButton 
                              size="small" 
                              type="primary"
                              icon={<MergeOutlined />}
                              onClick={() => handleMergeCode(branch, branch.env)}
                            >
                              合并代码
                            </AntButton>
                            <AntButton 
                              size="small" 
                              icon={<UndoOutlined />}
                              onClick={() => handleTestRollback(branch, branch.env)}
                            >
                              测试回退
                            </AntButton>
                          </div>
                        </div>
                      </Card>
                    ))}
                  </div>
                ) : (
                  <div style={{ textAlign: 'center', padding: '40px 0', color: '#999' }}>
                    暂无已测试完成的分支
                  </div>
                )}
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
                  
                  // 收集已合并的分支
                  envs.forEach(env => {
                    env.binds.forEach(bind => {
                      if (bind.status === 'merged') {
                        unavailableBranches.add(bind.branch)
                      }
                    })
                  })
                  
                                           // 当前正在编辑的分支不受限制
                         const currentBranch = form.getFieldValue(['binds', restField.name, 'branch'])
                         const availableBranches = allBranches.filter(b => 
                           // 排除特殊分支（dev和master分支不可在规划部署中选择）
                           b !== 'dev' && b !== 'master' && 
                           (!unavailableBranches.has(b) || b === currentBranch)
                         )
                  
                  const branchOptions = availableBranches.map(b => ({ 
                    value: b, 
                    label: unavailableBranches.has(b) && b !== currentBranch ? `${b} (已合并)` : b,
                    disabled: unavailableBranches.has(b) && b !== currentBranch
                  }))
                  
                                           return (
                           <div key={key} style={{ border: '1px solid #eee', borderRadius: 8, padding: 16 }}>
                             <Form.Item {...restField} name={[restField.name, 'isDefault']} valuePropName="checked" style={{ marginBottom: 16 }}>
                               <Checkbox>默认分支（无需功能与时间配置）</Checkbox>
                             </Form.Item>
                             
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
                                   
                                   const now = new Date()
                                   const bindStart = existingBind.start ? new Date(existingBind.start) : null
                                   const bindEnd = existingBind.end ? new Date(existingBind.end) : null
                                   
                                   return bindStart && bindStart.getTime() <= now.getTime() &&
                                          (!bindEnd || bindEnd.getTime() > now.getTime()) &&
                                          existingBind.status !== 'completed' && existingBind.status !== 'merged'
                                 })()
                                 
                                 return (
                                   <>
                                     {isCurrentlyActive && (
                                       <div style={{ background: '#fff7e6', border: '1px solid #ffd591', borderRadius: 6, padding: 12, marginBottom: 16 }}>
                                         <div style={{ color: '#fa8c16', fontWeight: 600, marginBottom: 4 }}>⚠️ 当前生效分支</div>
                                         <div style={{ color: '#666', fontSize: 14 }}>该分支正在生效中，只能修改失效时间，其他信息不可更改</div>
                                       </div>
                                     )}
                                     
                                     {/* 第一行：分支、生效时间、关联机器人、删除图标 */}
                                     <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr 1.5fr auto', gap: 16, marginBottom: 16, alignItems: 'end' }}>
                                       <Form.Item {...restField} name={[restField.name, 'branch']} label="分支" rules={[{ required: true }]} style={{ margin: 0 }}>
                                         <AntSelect 
                                           placeholder="选择分支" 
                                           options={branchOptions} 
                                           disabled={!!isCurrentlyActive}  // 生效中的分支不能修改分支名
                                         />
                                       </Form.Item>
                                       <Form.Item {...restField} name={[restField.name, 'range']} label="生效-失效时间" rules={isDefault ? [] : [{ required: true }]} style={{ margin: 0 }}>
                                         <DatePicker.RangePicker 
                                           disabled={isDefault ? [true, true] : isCurrentlyActive ? [true, false] : [false, false]}  // 生效中的分支只能修改失效时间
                                           style={{ width: '100%' }} 
                                           showTime={{ format: 'HH:mm' }}
                                           format="YYYY-MM-DD HH:mm"
                                           placeholder={['开始时间', '结束时间']}
                                           allowEmpty={[true, true]}
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
                                       <Form.Item {...restField} name={[restField.name, 'desc']} label="功能说明" rules={isDefault ? [] : [{ required: true }]} style={{ margin: 0 }}>
                                         <Input 
                                           placeholder="本次分支功能点说明" 
                                           disabled={isDefault || !!isCurrentlyActive}  // 生效中的分支不能修改功能说明
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
                <AntButton type="dashed" onClick={() => add({ branch: '', desc: '', range: undefined })} block>
                  + 增加一个分支
                </AntButton>
              </div>
            )}
          </Form.List>
        </Form>
      </Drawer>

      {/* 合并代码Modal */}
      <Modal
        title="合并代码"
        open={!!showMergeModal}
        onCancel={() => {
          setShowMergeModal(null)
          setGeneratedCommit(null)
          mergeForm.resetFields()
        }}
        footer={[
          <AntButton key="cancel" onClick={() => {
            setShowMergeModal(null)
            setGeneratedCommit(null)
            mergeForm.resetFields()
          }}>
            取消
          </AntButton>,
          !generatedCommit ? (
            <AntButton key="generate" type="primary" onClick={generateCommitLink}>
              生成Commit链接
            </AntButton>
          ) : (
            <AntButton key="confirm" type="primary" onClick={confirmMergeCode}>
              确认合并
            </AntButton>
          )
        ]}
      >
        <div style={{ marginBottom: 16 }}>
          <p>合并代码将把该分支的代码合并到develop分支，请确认代码已完成功能测试</p>
          {showMergeModal && (
            <div style={{ background: '#f5f5f5', padding: 12, borderRadius: 6, marginBottom: 16 }}>
              <div><strong>分支：</strong>{showMergeModal.branch.branch}</div>
              <div><strong>环境：</strong>{showMergeModal.env}</div>
            </div>
          )}
        </div>
        
        <Form form={mergeForm} layout="vertical">
          <Form.Item 
            name="desc" 
            label="功能说明" 
            rules={[{ required: true, message: '请输入功能说明' }]}
          >
            <Input.TextArea rows={3} placeholder="请描述本次合并的功能点" />
          </Form.Item>
        </Form>

        {/* 生成的Commit链接 */}
        {generatedCommit && (
          <div style={{ marginTop: 16, padding: 16, background: '#f6ffed', border: '1px solid #b7eb8f', borderRadius: 6 }}>
            <div style={{ marginBottom: 12, fontWeight: 600, color: '#52c41a' }}>✅ Commit链接已生成</div>
            
            <div style={{ marginBottom: 8 }}>
              <span style={{ fontWeight: 600 }}>Commit ID：</span>
              <span style={{ fontFamily: 'monospace', background: '#fff', padding: '2px 6px', borderRadius: 4, marginRight: 8 }}>
                {generatedCommit.commitId}
              </span>
              <AntButton 
                type="text" 
                size="small" 
                icon={<CopyOutlined />}
                onClick={() => copyToClipboard(generatedCommit.commitId)}
                title="复制Commit ID"
              />
            </div>
            
            <div style={{ marginBottom: 8 }}>
              <span style={{ fontWeight: 600 }}>GitHub Pull链接：</span>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 4 }}>
                <a 
                  href={generatedCommit.pullUrl} 
                  target="_blank" 
                  rel="noreferrer"
                  style={{ flex: 1, wordBreak: 'break-all', fontSize: 12 }}
                >
                  {generatedCommit.pullUrl}
                </a>
                <AntButton 
                  type="text" 
                  size="small" 
                  icon={<CopyOutlined />}
                  onClick={() => copyToClipboard(generatedCommit.pullUrl)}
                  title="复制链接"
                />
              </div>
            </div>
          </div>
        )}
      </Modal>

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

      {/* 部署特殊分支 Modal */}
      <Modal
        title={showDeploySpecialModal === 'prod' ? '部署master分支' : '部署dev分支'}
        open={!!showDeploySpecialModal}
        onCancel={() => setShowDeploySpecialModal(null)}
        onOk={confirmDeploySpecialBranch}
        okText="确认部署"
        cancelText="取消"
      >
        <div>
          <p>
            确认部署吗？部署后{showDeploySpecialModal?.toUpperCase()}环境将部署
            {showDeploySpecialModal === 'prod' ? '最新master分支' : 'dev分支'}
          </p>
          
          {showDeploySpecialModal && (
            <div>
              <div style={{ marginBottom: 16 }}>
                <div style={{ fontWeight: 600, marginBottom: 8 }}>已经merge的分支和功能：</div>
                {getMergedBranches(showDeploySpecialModal).length > 0 ? (
                  <div style={{ background: '#f5f5f5', padding: 12, borderRadius: 6 }}>
                    {getMergedBranches(showDeploySpecialModal).map((branch, index) => (
                      <div key={index} style={{ marginBottom: 8, paddingBottom: 8, borderBottom: index < getMergedBranches(showDeploySpecialModal).length - 1 ? '1px solid #e0e0e0' : 'none' }}>
                        <div style={{ fontWeight: 600, color: '#1677ff' }}>{branch.branch}</div>
                        <div style={{ color: '#666', fontSize: 14 }}>{branch.desc || '暂无描述'}</div>
                        {branch.mergedAt && (
                          <div style={{ color: '#999', fontSize: 12 }}>合并时间：{branch.mergedAt}</div>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div style={{ color: '#999', fontStyle: 'italic' }}>暂无已合并的分支</div>
                )}
              </div>
              
              <div style={{ background: '#e6f7ff', padding: 12, borderRadius: 6, border: '1px solid #91d5ff' }}>
                <div style={{ color: '#1677ff', fontWeight: 600 }}>部署后效果：</div>
                <div style={{ color: '#666', fontSize: 14 }}>
                  • 生效分支：{showDeploySpecialModal === 'prod' ? 'master' : 'dev'}<br/>
                  • 生效时间：立即生效<br/>
                  • 失效时间：无（持续生效）
                </div>
              </div>
            </div>
          )}
        </div>
      </Modal>
    </main>
  )
}

