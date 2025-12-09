'use client'

import React, { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { Tabs, Table as AntTable, Tag, Button as AntButton, Space, Drawer, App as AntApp, Modal, Form, Input, Popconfirm, Select as AntSelect, Alert, Divider, Checkbox, Radio, Tooltip } from 'antd'
import type { ColumnsType } from 'antd/es/table'
import { DeleteOutlined, SettingOutlined, EditOutlined, BranchesOutlined, DotChartOutlined, RedoOutlined, CheckOutlined, SwapOutlined } from '@ant-design/icons'

type DeployStatus = '部署完成' | '测试完成' | '失败'
interface DeploymentRow {
  id: string
  prNumber: string
  branch: string
  envUrl: string
  prMsg: string
  author: string
  result: '成功' | '失败'
  status: DeployStatus
  date: string
}

interface RepoYaml {
  repo: string
  yaml: string
  content: string
  directory?: string
}

// 这段代码实现了「项目详情页（多环境）」，使用了 Ant Design Tabs/Table/Drawer/Modal
// 代码说明：
// - Tab1 部署列表：列含仓库、commit、结果、分支、信息、提交人、状态、日期、动作（测试完成、销毁环境）；点击 commit 打开日志 Drawer
// - Tab2 设置：基本信息（仓库名、仓库地址、关联项目）、环境参数（包含 YAML 和文件目录），未配置项以 Alert 提示
export default function EnvironmentProjectDetail({ id, embedded = false }: { id: string, embedded?: boolean }) {
  const { message: msg } = AntApp.useApp()
  const [activeTab, setActiveTab] = useState<'deployments' | 'settings'>('deployments')

  // 基本信息与部署数据（mock）
  // id 映射：1 -> doraemon (Doraemon), 2 -> publisher (Publisher), 3 -> publisher-cp (Publisher)
  const repoNameInit = useMemo(() => {
    return id === '1' ? 'doraemon' : id === '2' ? 'publisher' : 'publisher-cp'
  }, [id])
  const projectInit = id === '1' ? 'Doraemon' : 'Publisher'
  const isPublisher = id === '2' || id === '3' // Publisher 项目标识

  const [repoName, setRepoName] = useState<string>(repoNameInit)
  // 仓库地址支持多选，这里使用 string[] 存储，默认包含一个基于 repoName 的地址
  const [repoUrl, setRepoUrl] = useState<string[]>([`company/${repoNameInit}`])
  // 产品主域名（Basic Info）
  const [primaryDomain, setPrimaryDomain] = useState<string>(id === '1' ? 'doraemon.ctw.inc' : 'publisher.ctw.inc')
  // 其它域名（多条可选）
  const [extraDomains, setExtraDomains] = useState<string[]>([])
  const [webhookUrl, setWebhookUrl] = useState<string>('')
  
  const [titleHover, setTitleHover] = useState<boolean>(false)
  const [editingTitle, setEditingTitle] = useState<boolean>(false)
  const [tempTitle, setTempTitle] = useState<string>(repoNameInit)

  // 监听 id 变化更新状态（解决组件复用时的状态不同步问题）
  useEffect(() => {
    setRepoName(repoNameInit)
    setRepoUrl([`company/${repoNameInit}`])
    setPrimaryDomain(id === '1' ? 'doraemon.ctw.inc' : 'publisher.ctw.inc')
    setExtraDomains([])
    setWebhookUrl('')
    setTempTitle(repoNameInit)
    setRepoYamls([
      { repo: repoNameInit, yaml: 'ci.yml', content: 'name: CI\non: [push]\njobs:\n  build:\n    runs-on: ubuntu-latest', directory: '/' }
    ])
  }, [repoNameInit, projectInit])

  const deployments: DeploymentRow[] = useMemo(() => {
    if (isPublisher) {
      // Publisher 项目：固定 URL，每个用户只有一条最新状态
      return [
        { 
          id: 'p1', 
          prNumber: 'a1b2c3d', 
          branch: 'feature/optimization', 
          envUrl: 'https://publisher-dev.ctw.inc', 
          prMsg: '优化构建流程', 
          author: 'lin.y@ctw.inc', 
          result: '成功', 
          status: '测试完成', 
          date: '2025-11-26 14:10:03',
          environment: 'Preview',
          duration: '2m 10s',
          created: '2h ago',
          fullDate: '2025-11-26 14:10:03'
        } as DeploymentRow,
        { 
          id: 'p2', 
          prNumber: 'f6g7h8i', 
          branch: 'main', 
          envUrl: 'https://publisher-prod.ctw.inc', 
          prMsg: 'Production Release 1.2', 
          author: 'yu.t@ctw.inc', 
          result: '成功', 
          status: '部署完成', 
          date: '2025-11-25 09:30:11',
          environment: 'Production',
          duration: '5m 30s',
          created: '1d ago',
          fullDate: '2025-11-25 09:30:11'
        } as DeploymentRow
      ]
    }
    
    // Doraemon 项目：动态 URL，保留原有逻辑
    return [
      { id: 'd1', prNumber: '667', branch: 'feature/login-fix', envUrl: `d.stg.g123.jp/__preview/pr-667`, prMsg: '登录异常处理与埋点修复', author: 'lin.y@ctw.inc', result: '成功', status: '部署完成', date: '2025-11-26 12:10:03', environment: 'Preview', duration: '49s', created: '3d ago', fullDate: '2025-11-26 12:10:03' } as DeploymentRow,
      { id: 'd2', prNumber: '668', branch: 'release-1.0', envUrl: `d.stg.g123.jp/__production/pr-668`, prMsg: '发布 1.0 稳定版', author: 'yu.t@ctw.inc', result: '成功', status: '测试完成', date: '2025-11-21 09:30:11', environment: 'Production', duration: '1m 18s', created: 'Nov 11', fullDate: '2025-11-21 09:30:11' } as DeploymentRow,
      { id: 'd3', prNumber: '669', branch: 'bugfix-889', envUrl: `d.stg.g123.jp/__preview/pr-669`, prMsg: '修复缓存穿透', author: 'wu.yuni@ctw.inc', result: '失败', status: '失败', date: '2025-11-13 17:40:55', environment: 'Preview', duration: '--', created: 'Just now', fullDate: '2025-11-13 17:40:55' } as DeploymentRow,
    ]
  }, [repoNameInit, isPublisher])

  // 部署行状态（支持在表格中更新状态）
  const [deploymentRows, setDeploymentRows] = useState<DeploymentRow[]>(deployments)

  useEffect(() => {
    setDeploymentRows(deployments)
  }, [deployments])

  // 日志 Drawer
  const [logOpen, setLogOpen] = useState<boolean>(false)
  const [activeCommit, setActiveCommit] = useState<string>('')

  // Test Done 弹窗
  const [testModalOpen, setTestModalOpen] = useState(false)
  const [testForm] = Form.useForm()
  const [activeDeploymentId, setActiveDeploymentId] = useState<string | null>(null)

  // 前端域名编辑弹窗
  const [domainModalOpen, setDomainModalOpen] = useState(false)
  const [domainForm] = Form.useForm()
  const [activeDomainDeploymentId, setActiveDomainDeploymentId] = useState<string | null>(null)

  const columns: ColumnsType<DeploymentRow> = [
    { 
      title: '环境URL', 
      dataIndex: 'envUrl',
      width: 200, 
      key: 'envUrl', 
      render: (u: string) => 
        u ? (
          <a
            href={/^(http|https):/.test(u) ? u : `https://${u}`}
            target="_blank"
            rel="noopener noreferrer"
            style={{
              fontFamily: 'monospace',
              color: '#1677ff',
              textDecoration: 'underline',
              wordBreak: 'break-all',
              borderRadius: 9999, // fully rounded corners
              padding: '2px 8px',
              transition: 'background 0.2s',
              display: 'inline-block',
            }}
            onClick={e => e.stopPropagation()}
          >
            {u}
          </a>
        ) : null
    },
    {
      title: 'Branch',
      dataIndex: 'branch',
      key: 'branch',
      width: 200,
      render: (branch: string) => (
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 14 }}>
          <BranchesOutlined style={{ color: '#595959' }} />
          <span
            style={{
              fontFamily:
                'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace',
            }}
          >
            {branch}
          </span>
        </div>
      ),
    },
    {
      title: 'Comment',
      key: 'comment',
      width: 200,
      render: (_: unknown, r: DeploymentRow) => (
        <div style={{ fontSize: 12, color: '#8c8c8c', lineHeight: '18px' }}>{r.prMsg}</div>
      ),
    },

    { title: 'Author', dataIndex: 'author',width: 80, key: 'author' },
    { title: '状态', dataIndex: 'status',width: 120, key: 'status', render: (s: DeployStatus) => {
      const color = s === '测试完成' ? '#1677ff' : s === '部署完成' ? '#32CD32' : '#ff4d4f'
      return (
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
          <span style={{ width: 8, height: 8, borderRadius: '50%', background: color }} />
          <span>{s}</span>
        </span>
      )
    }},
    { title: '最新部署时间', dataIndex: 'date',width: 150, key: 'date' },
    {
      title: '操作',
      key: 'actions',
      width: 200,
      render: (_: unknown, r: DeploymentRow) => (
        <Space>
          <Tooltip title="标记测试完成">
            <AntButton
              size="small"
              shape="circle"
              icon={<CheckOutlined />}
              onClick={() => {
                setActiveDeploymentId(r.id)
                testForm.resetFields()
                testForm.setFieldsValue({ comment: '', notify: true })
                setTestModalOpen(true)
              }}
              disabled={r.status === '测试完成'}
            />
          </Tooltip>
          <Tooltip title="切换前端域名">
            <AntButton
              size="small"
              shape="circle"
              icon={<SwapOutlined />}
              onClick={() => {
                // 点击切换前端域名时，数据来源为「环境配置」中填写的其它域名
                if (!extraDomains || extraDomains.length === 0) {
                  msg.warning('请先在环境配置中添加「其它域名」')
                  return
                }
                setActiveDomainDeploymentId(r.id)
                const current = r.envUrl || ''
                // 尝试从当前 URL 中匹配已有的其它域名，找不到则默认选中第一个
                const matched = extraDomains.find(d => current.includes(d))
                const currentDomain = matched || extraDomains[0]
                domainForm.setFieldsValue({ domain: currentDomain })
                setDomainModalOpen(true)
              }}
            />
          </Tooltip>
          <Tooltip title="销毁环境">
            <Popconfirm title="确定销毁该临时环境？" onConfirm={() => msg.success('已销毁环境')}>
              <AntButton size="small" shape="circle" danger icon={<DeleteOutlined />} />
            </Popconfirm>
          </Tooltip>
          <Tooltip title="重新部署">
            <AntButton size="small" shape="circle" icon={<RedoOutlined />} />
          </Tooltip>
        </Space>
      )
    },
  ]

  // 设置 Tab：环境参数（父级持有数据，传给子组件渲染与保存）
  const [repoYamls, setRepoYamls] = useState<RepoYaml[]>([
    {
      // 默认以首个仓库地址为维度进行环境参数配置
      repo: `company/${repoNameInit}`,
      yaml: 'ci.yml',
      content: 'name: CI\non: [push]\njobs:\n  build:\n    runs-on: ubuntu-latest',
      directory: '/'
    }
  ])

  return (
    <div style={{ padding: embedded ? 0 : 16 }}>
      {!embedded && (
        <div style={{ marginBottom: 8 }}>
          <Link href="/environments"><AntButton type="link">返回仓库列表</AntButton></Link>
        </div>
      )}

      <Tabs
        activeKey={activeTab}
        onChange={(k) => setActiveTab(k as 'deployments' | 'settings')}
        items={[
          {
            key: 'deployments',
            label: '环境列表',
            children: (
              <AntTable<DeploymentRow>
                rowKey="id"
                columns={columns}
                dataSource={deploymentRows}
                pagination={{ pageSize: 10 }}
              />
            )
          },
          {
            key: 'settings',
            label: '环境配置',
            children: (
              <SettingsContent
                repoName={repoName}
                repoUrl={repoUrl}
                webhookUrl={webhookUrl}
                primaryDomain={primaryDomain}
                extraDomains={extraDomains}
                onSaveBasic={(name, url, webhook, primary, extras) => {
                  setRepoName(name)
                  setRepoUrl(url)
                  setWebhookUrl(webhook)
                  setPrimaryDomain(primary)
                  setExtraDomains(extras)
                  msg.success('已保存')
                }}
                repoYamls={repoYamls}
                onSaveYamls={(next) => { setRepoYamls(next); msg.success('环境参数已保存') }}
              />
            )
          }
        ]}
      />

      {/* 部署日志 Drawer */}
      <Drawer
        title={`部署日志 - ${activeCommit}`}
        width={720}
        open={logOpen}
        onClose={() => setLogOpen(false)}
        destroyOnClose
      >
{`[17:01:15.735] Running build in Washington, D.C., USA (East) – iad1
[17:01:15.735] Build machine configuration: 2 cores, 8 GB
[17:01:19.903] Running "vercel build"
[17:01:20.301] Vercel CLI 47.1.1
[17:02:11.013] 20:3  Warning: 'Tag' is defined but never used.  @typescript-eslint/no-unused-vars
[17:02:11.049] Error: Command "npm run build" exited with 1`}
      </Drawer>

      <Modal
        title="标记为测试完成"
        open={testModalOpen}
        onCancel={() => setTestModalOpen(false)}
        onOk={async () => {
          const values = await testForm.validateFields()
          if (activeDeploymentId) {
            setDeploymentRows(prev =>
              prev.map(item =>
                item.id === activeDeploymentId ? { ...item, status: '测试完成' } : item
              )
            )
            if (values.notify) {
              msg.success('已标记为测试完成并发送通知')
            } else {
              msg.success('已标记为测试完成')
            }
          }
          setTestModalOpen(false)
        }}
        okText="确定"
        cancelText="取消"
      >
        <Form form={testForm} layout="vertical" initialValues={{ notify: true }}>
          <Form.Item name="comment" label="备注说明">
            <Input.TextArea rows={4} placeholder="可填写本次测试结论、风险说明等" />
          </Form.Item>
          <Form.Item name="notify" valuePropName="checked">
            <Checkbox>发送通知</Checkbox>
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        title="编辑前端域名"
        open={domainModalOpen}
        onCancel={() => setDomainModalOpen(false)}
        onOk={async () => {
          const values = await domainForm.validateFields()
          const domain: string = values.domain
          if (activeDomainDeploymentId && domain) {
            setDeploymentRows(prev =>
              prev.map(item => {
                if (item.id !== activeDomainDeploymentId) return item
                const current = item.envUrl || ''
                let nextUrl = current
                if (current) {
                  // 如果当前 URL 中包含某个「其它域名」，则用选中的域名替换之；否则前面拼接选中域名
                  const matched = extraDomains.find(d => current.includes(d))
                  if (matched) {
                    nextUrl = current.replace(matched, domain)
                  } else {
                    nextUrl = `${domain}${current.startsWith('/') ? '' : ''}${current}`
                  }
                } else {
                  nextUrl = domain
                }
                return { ...item, envUrl: nextUrl }
              })
            )
            msg.success('前端域名已更新')
          }
          setDomainModalOpen(false)
        }}
        okText="确定"
        cancelText="取消"
        okButtonProps={{ disabled: !extraDomains || extraDomains.length === 0 }}
      >
        <Form form={domainForm} layout="vertical">
          <Form.Item
            name="domain"
            label="前端域名"
            rules={[{ required: true, message: '请选择前端域名' }]}
          >
            {extraDomains && extraDomains.length > 0 ? (
              <Radio.Group>
                {extraDomains.map(domain => (
                  <Radio key={domain} value={domain} style={{ display: 'block', marginTop: 4 }}>
                    {domain}
                  </Radio>
                ))}
              </Radio.Group>
            ) : (
              <div style={{ color: '#999' }}>暂无可用域名，请先在环境配置中添加「其它域名」</div>
            )}
          </Form.Item>
        </Form>
      </Modal>
    </div>
  )
}

function SettingsContent(props: {
  repoName: string
  repoUrl: string[]
  webhookUrl: string
  primaryDomain: string
  extraDomains: string[]
  onSaveBasic: (name: string, url: string[], webhook: string, primaryDomain: string, extraDomains: string[]) => void
  repoYamls: RepoYaml[]
  onSaveYamls: (yamls: RepoYaml[]) => void
}) {
  const { message: msg } = AntApp.useApp()
  const [formBasic] = Form.useForm()
  const [editorForm] = Form.useForm()
  const [yamlList, setYamlList] = useState<RepoYaml[]>(props.repoYamls)
  const [editorOpen, setEditorOpen] = useState<boolean>(false)
  const [editingIndex, setEditingIndex] = useState<number | null>(null)

  // 基本信息编辑模式
  const [basicEditing, setBasicEditing] = useState<boolean>(false)

  // 仓库地址候选列表（多选下拉），包含当前仓库名和几个示例仓库
  const repoUrlOptions: { label: string; value: string }[] = Array.from(
    new Map(
      [
        { label: `company/${props.repoName}`, value: `company/${props.repoName}` },
        { label: 'company/doraemon', value: 'company/doraemon' },
        { label: 'company/publisher', value: 'company/publisher' },
        { label: 'company/publisher-cp', value: 'company/publisher-cp' },
        { label: 'company/omni', value: 'company/omni' },
      ].map(item => [item.value, item])
    ).values()
  )

  // 当仓库地址列表变化时，自动为每个地址准备一份环境参数配置（非必填，未配置时为占位）
  React.useEffect(() => {
    setYamlList((prev) => {
      const map = new Map(prev.map(item => [item.repo, item]))
      const next: RepoYaml[] = props.repoUrl.map(url => {
        return map.get(url) || {
          repo: url,
          yaml: '',
          content: '',
          directory: './'
        }
      })
      return next
    })
  }, [props.repoUrl])

  return (
    <div style={{ display: 'grid', gap: 24 }}>
      {/* 基本信息卡片 */}
      <div style={{ background: '#fff', padding: 24, borderRadius: 12, border: '1px solid #f0f0f0' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <div style={{ fontWeight: 700, fontSize: 16 }}>基本信息</div>
          {!basicEditing && (
            <AntButton type="primary" ghost onClick={() => {
              setBasicEditing(true)
              formBasic.setFieldsValue({
                repoName: props.repoName,
                repoUrl: props.repoUrl,
                webhookUrl: props.webhookUrl,
                primaryDomain: props.primaryDomain,
                extraDomains: props.extraDomains,
              })
            }}>配置</AntButton>
          )}
        </div>
        
        {basicEditing ? (
          <Form
            form={formBasic}
            layout="vertical"
            initialValues={{
              repoName: props.repoName,
              repoUrl: props.repoUrl,
              webhookUrl: props.webhookUrl,
              primaryDomain: props.primaryDomain,
              extraDomains: props.extraDomains,
            }}
            onFinish={(values) => {
              // 更新 Basic Info
              props.onSaveBasic(
                values.repoName,
                values.repoUrl || [],
                values.webhookUrl || '',
                values.primaryDomain || '',
                values.extraDomains || []
              )
              
              setBasicEditing(false)
            }}
          >
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 16 }}>
              <Form.Item name="repoName" label="产品名称" rules={[{ required: true }]}><Input /></Form.Item>
              <Form.Item name="primaryDomain" label="产品主域名" rules={[{ required: true, message: '请输入主域名' }]}>
                <Input placeholder="例如 doraemon.ctw.inc" />
              </Form.Item>
              {/* 仓库地址改为下拉多选框，支持选择多个地址 */}
              <Form.Item
                name="repoUrl"
                label="仓库地址"
                rules={[{ required: true, message: '请选择至少一个仓库地址' }]}
              >
                <AntSelect
                  mode="multiple"
                  placeholder="请选择关联仓库地址"
                  options={repoUrlOptions}
                />
              </Form.Item>
            </div>
            <div style={{ marginTop: 16 }}>
              <Form.Item label="其它域名" required={false}>
                <Form.List name="extraDomains">
                  {(fields, { add, remove }) => (
                    <>
                      {fields.map((field) => (
                        <div key={field.key} style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
                          <Form.Item
                            {...field}
                            style={{ flex: 1, marginBottom: 0 }}
                          >
                            <Input placeholder="例如 preview.doraemon.ctw.inc" />
                          </Form.Item>
                          <AntButton type="link" danger onClick={() => remove(field.name)}>
                            删除
                          </AntButton>
                        </div>
                      ))}
                      <AntButton type="link" onClick={() => add()}>
                        新增其它域名
                      </AntButton>
                    </>
                  )}
                </Form.List>
              </Form.Item>
              <Form.Item name="webhookUrl" label="Webhook 地址">
                <Input placeholder="例如 https://hooks.example.com/xxx" />
              </Form.Item>
            </div>
            <Space>
              <AntButton type="primary" htmlType="submit">保存信息</AntButton>
              <AntButton onClick={() => setBasicEditing(false)}>取消</AntButton>
              <Popconfirm title="确认删除该仓库？该操作不可恢复">
                <AntButton danger type="text">删除仓库</AntButton>
              </Popconfirm>
            </Space>
          </Form>
        ) : (
          <>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 16 }}>
              <div>
                <div style={{ color: '#8c8c8c', fontSize: 12, marginBottom: 4 }}>产品名称</div>
                <div style={{ fontSize: 14, fontWeight: 500 }}>{props.repoName}</div>
              </div>
              <div>
                <div style={{ color: '#8c8c8c', fontSize: 12, marginBottom: 4 }}>产品主域名</div>
                <div style={{ fontSize: 14, fontFamily: 'monospace' }}>
                  {props.primaryDomain || <span style={{ color: '#999' }}>未配置</span>}
                </div>
              </div>
              <div>
                <div style={{ color: '#8c8c8c', fontSize: 12, marginBottom: 4 }}>仓库地址</div>
                <div style={{ fontSize: 14, fontFamily: 'monospace', display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                  {props.repoUrl && props.repoUrl.length > 0 ? (
                    props.repoUrl.map((url) => (
                      <span
                        key={url}
                        style={{
                          padding: '2px 10px',
                          borderRadius: 9999,
                          background: '#f5f5f5',
                          display: 'inline-flex',
                          alignItems: 'center',
                        }}
                      >
                        {url}
                      </span>
                    ))
                  ) : (
                    <span style={{ color: '#999' }}>未配置</span>
                  )}
                </div>
              </div>
            </div>
            <div style={{ marginTop: 12 }}>
              <div style={{ color: '#8c8c8c', fontSize: 12, marginBottom: 4 }}>其它域名</div>
              <div style={{ fontSize: 14, fontFamily: 'monospace', display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                {props.extraDomains && props.extraDomains.length > 0 ? (
                  props.extraDomains.map((d) => (
                    <span
                      key={d}
                      style={{
                        padding: '2px 10px',
                        borderRadius: 9999,
                        background: '#f5f5f5',
                        display: 'inline-flex',
                        alignItems: 'center',
                      }}
                    >
                      {d}
                    </span>
                  ))
                ) : (
                  <span style={{ color: '#999' }}>未配置</span>
                )}
              </div>
            </div>
            <div style={{ marginTop: 12 }}>
              <div style={{ color: '#8c8c8c', fontSize: 12, marginBottom: 4 }}>Webhook 地址</div>
              <div style={{ fontSize: 14, fontFamily: 'monospace' }}>
                {props.webhookUrl || <span style={{ color: '#999' }}>未配置</span>}
              </div>
            </div>
          </>
        )}
      </div>

      {/* 环境参数卡片 */}
      <div style={{ background: '#fff', padding: 24, borderRadius: 12, border: '1px solid #f0f0f0' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <div style={{ fontWeight: 700, fontSize: 16 }}>环境参数配置</div>
        </div>
        
        <div style={{ display: 'grid', gap: 12 }}>
          {yamlList.map((item, idx) => (
            <div
              key={idx}
              style={{ display: 'grid', gridTemplateColumns: '150px 1fr 1fr auto', alignItems: 'center', gap: 16, padding: '12px 16px', border: '1px solid #f0f0f0', borderRadius: 8, background: '#fafafa' }}
            >
              <div style={{ fontWeight: 500 }}>{item.repo}</div>
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                 <span style={{ fontSize: 12, color: '#999' }}>YAML 文件</span>
                 <span style={{ fontFamily: 'monospace', color: item.yaml ? '#1e90ff' : '#999' }}>{item.yaml || '未配置'}</span>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                 <span style={{ fontSize: 12, color: '#999' }}>文件存放目录</span>
                 <span style={{ fontFamily: 'monospace' }}>{item.directory || './'}</span>
              </div>
              <AntButton
                size="small"
                onClick={() => {
                  setEditingIndex(idx)
                  editorForm.setFieldsValue({ repo: item.repo, yaml: item.yaml, content: item.content, directory: item.directory || './' })
                  setEditorOpen(true)
                }}
              >
                编辑配置
              </AntButton>
            </div>
          ))}
          {yamlList.length === 0 && <div style={{ color: '#999', textAlign: 'center', padding: 20 }}>暂无配置，请在上方基本信息中进行配置</div>}
        </div>

        <Modal
          title="编辑 YAML 配置"
          open={editorOpen}
          onCancel={() => setEditorOpen(false)}
          onOk={async () => {
            const values = await editorForm.validateFields()
            if (editingIndex !== null) {
              const next = yamlList.slice()
              next[editingIndex] = {
                ...next[editingIndex],
                yaml: values.yaml as string,
                content: values.content as string,
                directory: values.directory as string
              }
              setYamlList(next)
              props.onSaveYamls(next)
              setEditorOpen(false)
              msg.success('YAML 配置已更新')
            }
          }}
          width={720}
          okText="保存更改"
          cancelText="取消"
        >
          <Form form={editorForm} layout="vertical">
            <Form.Item name="repo" label="关联仓库">
              <Input disabled />
            </Form.Item>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
              <Form.Item name="yaml" label="YAML 文件名" rules={[{ required: true }]}>
                <Input placeholder="例如 ci.yml" />
              </Form.Item>
              <Form.Item name="directory" label="文件存放目录" rules={[{ required: true }]}>
                <Input placeholder="例如 .github/workflows" />
              </Form.Item>
            </div>
            <Form.Item name="content" label="YAML 内容" rules={[{ required: true }]}>
              <Input.TextArea rows={12} style={{ fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace' }} />
            </Form.Item>
          </Form>
        </Modal>
      </div>
      
    </div>
  )
}


