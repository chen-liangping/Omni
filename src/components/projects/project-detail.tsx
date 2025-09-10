"use client"
import React, { useMemo, useState } from 'react'
import Link from 'next/link'
import { Table as AntTable, Button as AntButton, Space, Tag, Popconfirm, message, Modal, Form, Input, Select as AntSelect, Drawer, Tabs } from 'antd'
import type { ColumnsType } from 'antd/es/table'
import { SettingOutlined, PlusOutlined, MinusCircleOutlined } from '@ant-design/icons'

interface DeployRecord {
  id: string;
  time: string;
  branch: string;
  commitId: string;
  status: '成功' | '失败';
  operator: string;
}

interface RepoMeta {
  name: string;
  activeBranch: string;
  envUrl: string;
  latestDeployAt: string;
  lastDeployer: string;
}

// 这段代码实现了项目详情页，使用了 Ant Design 表格、按钮与标签
// 代码说明：顶部展示仓库信息（生效分支、环境URL、最新部署时间、最后部署人、Commit ID 链接）；下方为部署记录表，含日志详情、重新部署、删除记录
export default function ProjectDetail({ projectId }: { projectId: string }) {
  // 设置弹窗（仅 Dev 环境）
  type EnvVar = { key: string; value: string }
  const [envModalOpen, setEnvModalOpen] = useState<boolean>(false)
  const [form] = Form.useForm()

  const repoMeta: RepoMeta = {
    name: projectId === '1' ? 'order-service' : projectId === '2' ? 'user-service' : 'payment-api',
    activeBranch: projectId === '1' ? 'feature/login-fix' : projectId === '2' ? 'release-1.0' : 'hotfix-22',
    envUrl: projectId === '1' ? 'order-service-feature-login-fix.stg.g123.jp' : projectId === '2' ? 'user-service-release-1-0.stg.g123.jp' : 'payment-api-hotfix-22.stg.g123.jp',
    latestDeployAt: projectId === '1' ? '09/10 14:32' : projectId === '2' ? '09/09 11:15' : '09/05 19:42',
    lastDeployer: projectId === '1' ? '李铁' : projectId === '2' ? '牛牛' : '斑斑',
  }

  const shortCommitId: string = projectId === '1' ? 'a1b2c3d' : projectId === '2' ? 'f6g7h8i' : 'j9k0l1m'
  const records: DeployRecord[] = [
    { id: 'log-1', time: '2025-03-21 14:55:37', branch: repoMeta.activeBranch, commitId: shortCommitId, status: '成功', operator: repoMeta.lastDeployer },
    { id: 'log-2', time: '2025-03-21 14:55:37', branch: repoMeta.activeBranch, commitId: 'z9y8x7w', status: '失败', operator: repoMeta.lastDeployer },
    { id: 'log-3', time: '2025-03-21 14:55:37', branch: 'bugfix-123', commitId: 'l4m5n6o', status: '成功', operator: '斑斑' },
  ]

  // 日志 Drawer 状态
  const [logDrawerOpen, setLogDrawerOpen] = useState<boolean>(false)
  const [activeLog, setActiveLog] = useState<DeployRecord | null>(null)

  // Dev 环境：分支选择 + 环境变量（仅本地状态）
  const branchOptions: { label: string; value: string }[] = useMemo(() => {
    const set = new Set<string>([repoMeta.activeBranch, ...records.map(r => r.branch)])
    return Array.from(set).map(b => ({ label: b, value: b }))
  }, [repoMeta.activeBranch, records])
  const [devBranch, setDevBranch] = useState<string>(repoMeta.activeBranch)
  const [devEnvVars, setDevEnvVars] = useState<EnvVar[]>([
    { key: 'API_BASE', value: 'https://dev-api.example.com' },
    { key: 'FEATURE_FLAG_A', value: 'false' }
  ])

  const columns: ColumnsType<DeployRecord> = [
    { title: 'commit id', dataIndex: 'commitId', key: 'commitId', render: (c: string, record: DeployRecord) => (
      <a
        href="#"
        onClick={(e) => {
          e.preventDefault()
          e.stopPropagation()
          setActiveLog(record)
          setLogDrawerOpen(true)
        }}
      >
        {c}
      </a>
    ), width: 120 },
    { title: '分支', dataIndex: 'branch', key: 'branch', render: (b: string) => <Tag color="blue">{b}</Tag>, width: 160 },
    { title: '状态', dataIndex: 'status', key: 'status', render: (s: DeployRecord['status']) => <Tag color={s === '成功' ? 'green' : 'red'}>{s}</Tag>, width: 60 },
    { title: '部署人', dataIndex: 'operator', key: 'operator', width: 100 },
    { title: '部署时间', dataIndex: 'time', key: 'time', width: 180 },
    { title: '操作', key: 'actions', width: 140, render: (_: unknown, record: DeployRecord) => (
      <Space>
        <Popconfirm title="删除记录" description="确定删除该部署记录？" okText="删除" cancelText="取消" onConfirm={() => message.success('记录已删除')}>
          <AntButton
            type="link"
            danger
            onMouseDown={(e) => e.stopPropagation()}
            onClick={(e) => e.stopPropagation()}
          >
            删除记录
          </AntButton>
        </Popconfirm>
      </Space>
    ) }
  ]

  return (
    <div style={{ padding: 24 }}>
      {/* 顶部：返回列表在上方，标题与操作在下一行 */}
      <div style={{ marginBottom: 8 }}>
        <Link href="/projects"><AntButton type="link">返回列表</AntButton></Link>
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
        <div style={{ fontSize: 18, fontWeight: 700, color: 'var(--heading)' }}>仓库详情： {repoMeta.name}</div>
        <Space>
          {/* 打开环境变量设置弹窗（仅 Dev） */}
          <AntButton icon={<SettingOutlined />} onClick={() => { setEnvModalOpen(true); form.setFieldsValue({ devBranch, envs: devEnvVars }) }}>设置</AntButton>
          <AntButton onClick={() => message.success('已触发重新部署')}>🔄 重新部署</AntButton>
          <Popconfirm title="停用/删除" description="确定要停用/删除该仓库？" okText="删除" cancelText="取消" onConfirm={() => message.warning('仓库已停用/删除')}>
            <AntButton danger>🗑 停用</AntButton>
          </Popconfirm>
        </Space>
      </div>

      <div style={{ background: '#fff', border: '1px solid #eee', borderRadius: 8, padding: 16, marginBottom: 16 }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16 }}>
          <div>
            <div style={{ color: '#2f3542', fontWeight: 800, marginBottom: 8 }}>当前生效分支</div>
            <Tag color="blue">{repoMeta.activeBranch}</Tag>
          </div>
          <div>
            <div style={{ color: '#2f3542', fontWeight: 800, marginBottom: 8 }}>环境 URL</div>
            <div style={{ fontFamily: 'monospace' }}>{repoMeta.envUrl}</div>
          </div>
          <div>
            <div style={{ color: '#2f3542', fontWeight: 800, marginBottom: 8 }}>最新部署时间</div>
            <div>{repoMeta.latestDeployAt}</div>
          </div>
          <div>
            <div style={{ color: '#2f3542', fontWeight: 800, marginBottom: 8 }}>最后部署人</div>
            <div>{repoMeta.lastDeployer}</div>
          </div>
          <div>
            <div style={{ color: '#2f3542', fontWeight: 800, marginBottom: 8 }}>Commit ID</div>
            <a href="#" onClick={(e) => { e.preventDefault(); message.info(`打开 Commit ${shortCommitId}`) }}>{shortCommitId}</a>
          </div>
        </div>
      </div>

      <div>
        <Tabs
          type="card"
          items={[
            {
              key: 'deployments',
              label: '部署记录',
              children: (
                <AntTable<DeployRecord>
                  rowKey={(r) => r.id}
                  columns={columns}
                  dataSource={records}
                  pagination={false}
                />
              )
            }
          ]}
        />
      </div>

      {/* Dev 环境设置弹窗 */}
      <Modal
        title="Dev 环境设置"
        open={envModalOpen}
        onCancel={() => setEnvModalOpen(false)}
        onOk={async () => {
          const values = await form.validateFields()
          setDevEnvVars((values.envs as EnvVar[] | undefined) ?? [])
          setDevBranch(values.devBranch as string)
          setEnvModalOpen(false)
          message.success('Dev 环境设置已保存')
        }}
        okText="保存"
        cancelText="取消"
        width={720}
      >
        <Form form={form} layout="vertical" initialValues={{ devBranch, envs: devEnvVars }}>
          <Form.Item name="devBranch" label="Dev 分支" rules={[{ required: true, message: '请选择 Dev 分支' }]}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <AntSelect options={branchOptions} style={{ width: 320 }} onChange={(v: string) => setDevBranch(v)} />
              <span style={{ color: '#8c8c8c' }}>选择分支后，提交PR会触发临时环境部署</span>
            </div>
          </Form.Item>
          <Form.List name="envs">
            {(fields, { add, remove }) => (
              <div>
                {fields.map(({ key, name, ...restField }) => (
                  <div key={key} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr auto', gap: 12, marginBottom: 8 }}>
                    <Form.Item
                      {...restField}
                      name={[name, 'key']}
                      label={name === 0 ? '变量名' : undefined}
                      rules={[{ required: true, message: '请输入变量名' }]}
                    >
                      <Input placeholder="例如: API_BASE" />
                    </Form.Item>
                    <Form.Item
                      {...restField}
                      name={[name, 'value']}
                      label={name === 0 ? '变量值' : undefined}
                      rules={[{ required: true, message: '请输入变量值' }]}
                    >
                      <Input placeholder="例如: https://stg-api.example.com" />
                    </Form.Item>
                    <div style={{ display: 'flex', alignItems: 'end', paddingBottom: 2 }}>
                      <AntButton type="text" danger icon={<MinusCircleOutlined />} onClick={() => remove(name)} />
                    </div>
                  </div>
                ))}
                <AntButton type="dashed" icon={<PlusOutlined />} onClick={() => add({ key: '', value: '' })}>新增变量</AntButton>
                <div style={{ color: '#888', marginTop: 8, fontSize: 12 }}>提示：仅配置 Dev 环境，数据保存在本页状态，不会调用后端。</div>
              </div>
            )}
          </Form.List>
        </Form>
      </Modal>

      {/* 日志详情 Drawer（就地查看） */}
      <Drawer
        title="部署日志详情"
        width={720}
        open={logDrawerOpen}
        onClose={() => { setLogDrawerOpen(false); setActiveLog(null) }}
        destroyOnClose
      >
        {activeLog && (
          <div>
            <div style={{ background: '#fff', border: '1px solid #eee', borderRadius: 8, padding: 16, marginBottom: 16 }}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 12 }}>
                <div>仓库名：{repoMeta.name}</div>
                <div>分支：{activeLog.branch}</div>
                <div>Commit ID：{activeLog.commitId}</div>
                <div>部署时间：{activeLog.time}</div>
                <div>部署人：{activeLog.operator}</div>
                <div>状态：{activeLog.status}</div>
              </div>
            </div>
            <div style={{ fontFamily: 'monospace', background: '#0d1117', color: '#c9d1d9', padding: 16, borderRadius: 8, whiteSpace: 'pre-wrap' }}>
{`[14:32:01] 开始部署任务\n...[14:32:02] 拉取代码：git clone https://git.company.com/${repoMeta.name}.git\n...[14:32:05] 检出分支：${activeLog.branch} (commit ${activeLog.commitId})\n...[14:32:10] 构建镜像：docker build -t ${repoMeta.name}:${activeLog.commitId} .\n...[14:32:30] 推送镜像：registry.company.com/${repoMeta.name}:${activeLog.commitId}\n...[14:32:45] 应用部署配置：k8s/${repoMeta.name}-deploy.yaml\n...[14:33:00] 等待 Pod 就绪...\n...[14:33:10] Pod (${repoMeta.name}-abc123) 启动成功\n...[14:33:15] 健康检查通过\n...[14:33:16] 部署完成 ✅`}
            </div>
            <div style={{ marginTop: 12, display: 'flex', gap: 12 }}>
              <AntButton onClick={() => message.success('已下载日志文件')}>⬇ 下载日志文件</AntButton>
              <AntButton onClick={() => message.success(`已触发重新部署 ${activeLog.commitId}`)}>🔄 重新部署此 commit</AntButton>
            </div>
          </div>
        )}
      </Drawer>
    </div>
  )
}

