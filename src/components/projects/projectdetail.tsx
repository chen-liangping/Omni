"use client"
import React, { useEffect, useMemo, useState } from 'react'
import { Card, Button as AntButton, Modal, Form, Select as AntSelect, Input, Space, Tag, DatePicker, Checkbox } from 'antd'

/**
 * 这段代码实现了“项目详情”原型页：顶部项目信息 + 环境卡片列表 + 规划上线分支
 * 代码说明：环境卡片展示当前生效分支、功能说明、生效时间范围与状态。
 * 修改原因：满足 docs/定时发布.md 的项目详情需求。
 */

type Env = 'stg' | 'pre' | 'prod'
interface BranchBind { repo: string; branch: string; desc?: string; start?: string; end?: string; isDefault?: boolean }
interface EnvBind { env: Env; binds: BranchBind[] }
type HasFormat = { format: (fmt: string) => string }

export default function ProjectDetail({ projectId }: { projectId: string }) {
  const [meta, setMeta] = useState<{ name: string; repo?: string }>({ name: `project-${projectId}` })
  const [envs, setEnvs] = useState<EnvBind[]>([])
  const [choices, setChoices] = useState<string[]>([
    
    'https://github.com/ctw/omni-frontend',
    'https://github.com/ctw/omni-backend',
  ])
  const [showEdit, setShowEdit] = useState<EnvBind | null>(null)
  const [form] = Form.useForm()

  // 仓库与分支：仓库来自 projects 列表（localStorage），分支提供基础候选
  const repoChoices = choices
  const repoBranches: Record<string, string[]> = useMemo(() => {
    const base: Record<string, string[]> = {}
    choices.forEach((r) => {
      base[r] = ['main', 'develop', 'release/2025-10', 'feat/login', 'feat/api', 'feature/billing']
    })
    return base
  }, [choices])

  // 抽取：示意环境绑定，供“无本地数据”与“未命中当前项目”两处复用
  const buildDemoEnvs = (): EnvBind[] => ([
    {
      env: 'stg',
      binds: [
        { repo: 'https://github.com/ctw/omni-frontend', branch: 'main', desc: '稳定前端', start: '2025-08-01' },
        { repo: 'https://github.com/ctw/omni-frontend', branch: 'release/2025-10', desc: '10月发布前端', start: '2025-10-05' },
        { repo: 'https://github.com/ctw/omni-backend', branch: 'develop', desc: '接口联调', start: '2025-09-01', end: '2025-10-01' },
        { repo: 'https://github.com/ctw/omni-backend', branch: 'hotfix/cve', desc: '安全修复', start: '2025-10-08' },
      ],
    },
    {
      env: 'pre',
      binds: [
        { repo: 'https://github.com/ctw/omni-frontend', branch: 'release/2025-09', desc: '预发前端', start: '2025-09-05', end: '2025-09-12' },
        { repo: 'https://github.com/ctw/omni-frontend', branch: 'release/1.0.0', desc: '预发前端-下一批', start: '2025-09-01' },
        { repo: 'https://github.com/ctw/omni-backend', branch: 'release/2025-09', desc: '预发后端', start: '2025-09-05', end: '2025-09-12' },
        { repo: 'https://github.com/ctw/omni-backend', branch: 'release/1.0.0', desc: '预发后端-下一批', start: '2025-09-01' },
      ],
    },
    {
      env: 'prod',
      binds: [
        { repo: 'https://github.com/ctw/omni-frontend', branch: 'main', desc: '稳定前端版本', start: '2025-09-15' }, 
        { repo: 'https://github.com/ctw/omni-frontend', branch: '2.0.0', desc: '2.0.0 版本', start: '2025-09-01' }, 
        { repo: 'https://github.com/ctw/omni-backend', branch: 'main', desc: '稳定后端版本', start: '2025-08-01' }, 
        { repo: 'https://github.com/ctw/omni-backend', branch: 'feature/billing', desc: '计费重构', start: '2025-09-03' }, 
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

  // 从 localStorage 读取项目配置，注入两个固定仓库并生成各环境初始绑定
  useEffect(() => {
    try {
      const raw = typeof window !== 'undefined' ? localStorage.getItem('omni-projects') : null
      if (!raw) {
        // 无持久化时，直接采用你给的示意数据（两个固定仓库，且同一仓库含生效中与待生效）
        setMeta({ name: `project-${projectId}`, repo: choices[0] })
        setEnvs(buildDemoEnvs())
        return
      }
      const map = JSON.parse(raw) as Record<string, { name: string; repo?: string; repos?: string[]; envs?: Array<{ name: string; url: string }> }>
      const item = map[projectId] || Object.values(map).find(x => x.name === projectId)
      if (!item) {
        // 本地存储存在，但没有该项目：回退为示意默认数据
        setMeta({ name: `project-${projectId}`, repo: choices[0] })
        setEnvs(buildDemoEnvs())
        return
      }
      // 特例：名称为 Doraemon 的项目，进入详情时使用示意数据（而非 repos 驱动初始化）
      if (item.name === 'Doraemon' || projectId === 'Doraemon') {
        setMeta({ name: item.name, repo: choices[0] })
        setEnvs(buildDemoEnvs())
        return
      }
      const repos = (item.repos || []).slice(0, 2)
      const c = repos.length === 2 ? repos : choices
      setChoices(c)
      setMeta({ name: item.name, repo: c[0] })
      const initial: EnvBind[] = [
        { env: 'stg', binds: [
          c[0] ? { repo: c[0], branch: 'develop', desc: '前端联调', start: '2025-09-01' } : undefined,
          c[1] ? { repo: c[1], branch: 'develop', desc: '后端联调', start: '2025-09-01' } : undefined,
        ].filter(Boolean) as BranchBind[] },
        { env: 'pre', binds: [
          c[0] ? { repo: c[0], branch: 'release/2025-10', desc: '预发前端', start: '2025-10-01' } : undefined,
          c[1] ? { repo: c[1], branch: 'release/2025-10', desc: '预发后端', start: '2025-10-01' } : undefined,
        ].filter(Boolean) as BranchBind[] },
        { env: 'prod', binds: [
          c[0] ? { repo: c[0], branch: 'main', desc: '稳定前端', start: '2025-09-15' } : undefined,
          c[1] ? { repo: c[1], branch: 'main', desc: '稳定后端', start: '2025-09-15' } : undefined,
        ].filter(Boolean) as BranchBind[] },
      ]
      setEnvs(initial)
    } catch {}
  }, [projectId])

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
    form.setFieldsValue({ env: e.env, binds: bindsWithRange.length ? bindsWithRange : [{ repo: '', branch: '', desc: '', range: undefined }] })
  }

  const onSave = async () => {
    const v = await form.validateFields() as { env: Env; binds: Array<BranchBind & { range?: [unknown, unknown]; robotIds?: string[] }> }
    const normalized: Array<BranchBind & { robotIds?: string[] }> = (v.binds || []).map((b) => {
      let start: string | undefined = b.start
      let end: string | undefined = b.end
      if (b.range) {
        const [s, e] = b.range
        if (s && typeof s === 'object' && 'format' in s && typeof (s as HasFormat).format === 'function') {
          start = (s as HasFormat).format('YYYY-MM-DD')
        } else if (s != null) {
          start = String(s)
        }
        if (e && typeof e === 'object' && 'format' in e && typeof (e as HasFormat).format === 'function') {
          end = (e as HasFormat).format('YYYY-MM-DD')
        } else if (e != null) {
          end = String(e)
        }
      }
      const result: BranchBind & { robotIds?: string[] } = {
        repo: b.repo,
        branch: b.branch,
        isDefault: b.isDefault,
        desc: b.isDefault ? undefined : b.desc,
        start: b.isDefault ? undefined : start,
        end: b.isDefault ? undefined : end,
      }
      if (Array.isArray(b.robotIds)) result.robotIds = b.robotIds
      return result
    }).filter(b => !!b.repo && !!b.branch)
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

  return (
    <main style={{ padding: 24 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <div>
          <h1 style={{ color: 'var(--heading)', margin: 0 }}>{meta.name}</h1>
          {meta.repo ? <a href={meta.repo} target="_blank" rel="noreferrer">{meta.repo}</a> : <span style={{ color: '#6b7280' }}>未配置仓库</span>}
        </div>
      </div>

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
          // 固定两个仓库（前端/后端），顺序与 repoChoices 一致
          const primaryRepos = repoChoices
          type ActiveByRepo = { repo: string; bind?: BranchBind }
          const activeByRepo: ActiveByRepo[] = []
          const upcomingList: BranchBind[] = []
          primaryRepos.forEach(repo => {
            const list = repoToBinds[repo] || []
            const timedActive = list
              .filter(b => b.start && (new Date(b.start as string)).getTime() <= now.getTime())
              .filter(b => !b.end || (new Date(b.end as string)).getTime() > now.getTime())
              .sort((a, b) => (new Date(b.start as string).getTime()) - (new Date(a.start as string).getTime()))
            const defaultBind = list.find(b => b.isDefault)
            const active = timedActive[0] ?? defaultBind
            activeByRepo.push({ repo, bind: active })
            const upcoming = list
              .filter(b => b.start && (new Date(b.start as string)).getTime() > now.getTime())
              .sort((a, b) => (new Date(a.start as string).getTime()) - (new Date(b.start as string).getTime()))
            upcoming.forEach(u => upcomingList.push(u))
          })
          upcomingList.sort((a, b) => (new Date(a.start as string).getTime()) - (new Date(b.start as string).getTime()))
          return (
            <Card key={e.env} style={{ width: '100%' }} title={<Space><Tag color={e.env==='prod'?'gold': e.env==='pre'?'cyan':'blue'}>{e.env}</Tag><span>{statusOf(e)}</span></Space>} extra={<AntButton onClick={() => onOpenEdit(e)}>规划上线分支</AntButton>}>
              <div style={{ display: 'flex', gap: 16, alignItems: 'stretch' }}>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 12, color: '#6b7280', marginBottom: 6 }}>生效中</div>
                  {activeByRepo.map(({ repo, bind }, idx) => (
                    <div key={repo + idx} style={{ border: '1px solid #eee', borderRadius: 8, padding: 8, marginBottom: 8, wordBreak: 'break-word' }}>
                      <div style={{ fontSize: 12, color: '#6b7280' }}>仓库</div>
                      <div style={{ marginBottom: 4 }}><a href={repo} target="_blank" rel="noreferrer">{repo}</a></div>
                      {bind ? (
                        <>
                          <div style={{ fontSize: 12, color: '#6b7280' }}>分支</div>
                          <div style={{ marginBottom: 4, fontWeight: 600 }}>{bind.branch}{bind.isDefault ? '（默认）' : ''}</div>
                          {!bind.isDefault && (
                            <>
                              <div style={{ fontSize: 12, color: '#6b7280' }}>功能</div>
                              <div style={{ marginBottom: 4 }}>{bind.desc}</div>
                              <div style={{ fontSize: 12, color: '#6b7280' }}>生效时间</div>
                              <div>{bind.start ?? '-'} ~ {bind.end ?? '-'}</div>
                            </>
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
                          <div style={{ fontSize: 12, color: '#6b7280' }}>仓库</div>
                          <div style={{ marginBottom: 4 }}><a href={u.repo} target="_blank" rel="noreferrer">{u.repo}</a></div>
                          <div style={{ fontSize: 12, color: '#6b7280' }}>分支</div>
                          <div style={{ marginBottom: 6, fontWeight: 600 }}>{u.branch}</div>
                          <div style={{ fontSize: 12, color: '#6b7280' }}>功能</div>
                          <div style={{ marginBottom: 6 }}>{u.desc}</div>
                          <div style={{ fontSize: 12, color: '#6b7280' }}>生效时间</div>
                          <div>{u.start ?? '-'}</div>
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

      <Modal title="规划上线分支（可多个仓库与分支）" open={!!showEdit} onCancel={() => setShowEdit(null)} onOk={onSave} okText="保存" width={720}>
        <Form form={form} layout="vertical">
          <Form.Item name="env" label="环境" rules={[{ required: true }]}>
            <AntSelect options={[{value:'stg',label:'stg'},{value:'pre',label:'pre'},{value:'prod',label:'prod'}]} disabled />
          </Form.Item>
          <Form.List name="binds">
            {(fields, { add, remove }) => (
              <div style={{ display: 'grid', gap: 12 }}>
                {fields.map((field) => {
                  const { key, ...restField } = field
                  return (
                    <div key={key} style={{ border: '1px solid #eee', borderRadius: 8, padding: 12 }}>
                      <Space style={{ display: 'flex' }} direction="vertical">
                        <Form.Item {...restField} name={[restField.name, 'repo']} label="仓库地址" rules={[{ required: true }]}> 
                          <AntSelect placeholder="选择仓库" options={repoChoices.map(r => ({ value: r, label: r }))} />
                        </Form.Item>
                        <Form.Item shouldUpdate noStyle>
                          {({ getFieldValue }) => {
                            const repo = getFieldValue(['binds', restField.name, 'repo']) as string
                            const options = (repoBranches[repo] || []).map(b => ({ value: b, label: b }))
                            return (
                              <Form.Item {...restField} name={[restField.name, 'branch']} label="分支" rules={[{ required: true }]}> 
                                <AntSelect placeholder="选择分支" options={options} />
                              </Form.Item>
                            )
                          }}
                        </Form.Item>
                        <Form.Item {...restField} name={[restField.name, 'isDefault']} valuePropName="checked">
                          <Checkbox>默认分支（无需功能与时间）</Checkbox>
                        </Form.Item>
                        <Form.Item shouldUpdate noStyle>
                          {({ getFieldValue }) => {
                            const isDefault = getFieldValue(['binds', restField.name, 'isDefault'])
                            return (
                              <>
                                <Form.Item {...restField} name={[restField.name, 'desc']} label="功能说明" rules={isDefault ? [] : [{ required: true }]}>
                                  <Input placeholder="本次分支功能点说明" disabled={isDefault} />
                                </Form.Item>
                                <Form.Item {...restField} name={[restField.name, 'range']} label="生效-失效时间（时间段）" rules={isDefault ? [] : [{ required: true }]}>
                                  <DatePicker.RangePicker disabled={isDefault} />
                                </Form.Item>
                                <Form.Item {...restField} name={[restField.name, 'robotIds']} label="关联机器人">
                                  <AntSelect
                                    mode="multiple"
                                    placeholder="选择用于提醒的机器人"
                                    options={robots.map(r => ({ value: r.id, label: r.name }))}
                                  />
                                </Form.Item>
                              </>
                            )
                          }}
                        </Form.Item>
                        <div>
                          <AntButton danger onClick={() => remove(restField.name)}>移除此分支</AntButton>
                        </div>
                      </Space>
                    </div>
                  )
                })}
                <AntButton type="dashed" onClick={() => add({ repo: '', branch: '', desc: '', start: '', end: '' })}>+ 增加一个分支</AntButton>
              </div>
            )}
          </Form.List>
        </Form>
      </Modal>
    </main>
  )
}

