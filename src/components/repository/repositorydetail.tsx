"use client"
import React, { useState } from 'react'
import { Checkbox, Collapse, Tabs, Alert, Table as AntTable, Button as AntButton, Space, Modal, Form, Input, Popconfirm, message } from 'antd'
import { DownOutlined, RightOutlined, CheckCircleOutlined, ExclamationCircleOutlined, PlusOutlined, DeleteOutlined } from '@ant-design/icons'
import type { ColumnsType } from 'antd/es/table'
import { useQuery } from '@tanstack/react-query'

interface BranchRule {
  id: string;
  title: string;
  description: string;
  checked: boolean;
  disabled?: boolean;
}

interface BranchRules {
  name: string;
  rules: BranchRule[];
}

interface InitStatus {
  status: "pending" | "success" | "failed";
  error?: string;
  steps: {
    name: string;
    status: "pending" | "success" | "failed";
    error?: string;
  }[];
}

interface Branch {
  id: string;
  name: string;
  createdAt: string;
  isDefault?: boolean;
  description?: string;  // 功能说明
}

export default function RepositoryDetailPage({ repoId: propRepoId }: { repoId?: string }) {
  const repoId = propRepoId ?? '';
  const [activeTab, setActiveTab] = useState("branches");
  // 显式初始化对象并通过常量声明标注类型，避免在 useState 上传入泛型
  const initialOpenStates: Record<string, boolean> = {
    master: true,
    "deploy/staging": true,
    "deploy/develop": true
  };
  const [openStates, setOpenStates] = useState(initialOpenStates);

  // 分支管理状态
  const [branches, setBranches] = useState<Branch[]>([
    { id: '1', name: 'main', createdAt: '2025-08-15 10:30:00', isDefault: true, description: '主分支，生产环境代码' },
    { id: '2', name: 'develop', createdAt: '2025-09-01 14:20:00', isDefault: true,description: '部署分支，部署开发代码集成' },
    { id: '3', name: 'feature/login', createdAt: '2025-09-10 16:45:00', description: '登录功能开发' },
    { id: '4', name: 'feature/payment', createdAt: '2025-09-12 09:15:00', description: '支付功能开发' },
    { id: '5', name: 'hotfix/security', createdAt: '2025-09-15 11:30:00', description: '安全漏洞修复' },
  ]);
  const [showCreateBranch, setShowCreateBranch] = useState(false);
  const [branchForm] = Form.useForm();

  const { data: initStatus } = useQuery<InitStatus>({
    queryKey: ["repository-init-status", repoId],
    queryFn: async () => {
      // 原型不依赖后端，返回模拟数据
      return {
        status: 'success',
        steps: [
          { name: '注入分支保护规则', status: 'success' },
          { name: '配置 GitHub Workflows', status: 'success' }
        ]
      } as InitStatus
    },
  });

  // 仓库元信息（原型内置 mock；可根据 repoId 返回不同数据）
  const getRepoMeta = (id: string): { name: string; type: 'frontend-micro' | 'backend-micro' | 'frontend-only'; createdAt: string } => {
    if (id === '1') return { name: 'omni-frontend', type: 'frontend-micro', createdAt: '2024-07-12 10:30' }
    if (id === '2') return { name: 'omni-backend', type: 'backend-micro', createdAt: '2024-08-03 14:05' }
    return { name: `repo-${id || 'demo'}`, type: 'frontend-only', createdAt: '2024-09-01 09:00' }
  }
  const repoMeta = getRepoMeta(repoId)

  const typeLabel = (t: string) => (t === 'frontend-micro' ? '前端微服务' : t === 'backend-micro' ? '后端微服务' : '纯前端')
  const initLabel = (() => {
    if (initStatus?.status === 'success') return '已初始化'
    if (initStatus?.status === 'failed') return '初始化失败'
    return '未初始化'
  })()

  const toggleBranch = (branchName: string) => {
    setOpenStates((prev: Record<string, boolean>) => ({ ...prev, [branchName]: !prev[branchName] }))
  }

  // Collapse 受控：点击面板标题时更新 openStates
  const handleCollapseChange = (keys: string | string[]) => {
    const openedKeys = Array.isArray(keys) ? keys : [keys]
    const next: Record<string, boolean> = {}
    branchRules.forEach((b) => { next[b.name] = openedKeys.includes(b.name) })
    setOpenStates(next)
  }

  // 分支管理功能
  const handleCreateBranch = async () => {
    try {
      const values = await branchForm.validateFields() as { name: string; description: string };
      const newBranch: Branch = {
        id: String(Date.now()),
        name: values.name,
        description: values.description,
        createdAt: new Date().toLocaleString('sv-SE').replace('T', ' ').substring(0, 19),
      };
      setBranches(prev => [newBranch, ...prev]);
      setShowCreateBranch(false);
      branchForm.resetFields();
      message.success('分支创建成功');
    } catch (error) {
      console.error('创建分支失败:', error);
    }
  };

  const handleDeleteBranch = (branchId: string, branchName: string) => {
    setBranches(prev => prev.filter(branch => branch.id !== branchId));
    message.success(`分支 ${branchName} 已删除`);
  };

  const branchColumns: ColumnsType<Branch> = [
    {
      title: '分支名称',
      dataIndex: 'name',
      key: 'name',
      render: (name: string, record) => (
        <Space>
          <span style={{ fontWeight: record.isDefault ? 600 : 400 }}>{name}</span>
          {record.isDefault && <span style={{ color: '#999', fontSize: 12 }}>（默认分支）</span>}
        </Space>
      ),
    },
    {
      title: '功能说明',
      dataIndex: 'description',
      key: 'description',
      render: (description: string) => (
        <span style={{ color: '#666' }}>{description || '暂无说明'}</span>
      ),
    },
    {
      title: '创建时间',
      dataIndex: 'createdAt',
      key: 'createdAt',
      width: 180,
    },
    {
      title: '操作',
      key: 'actions',
      width: 100,
      render: (_, record) => (
        record.isDefault ? (
          <span style={{ color: '#999' }}>默认分支</span>
        ) : (
          <Popconfirm
            title="删除分支"
            description={`确定要删除分支 &ldquo;${record.name}&rdquo; 吗？`}
            onConfirm={() => handleDeleteBranch(record.id, record.name)}
            okText="确定"
            cancelText="取消"
          >
            <AntButton
              type="text"
              danger
              icon={<DeleteOutlined />}
              size="small"
            />
          </Popconfirm>
        )
      ),
    },
  ];

  const branchRules: BranchRules[] = [
    {
      name: "master",
      rules: [
        { id: "master-1", title: "限制删除", description: "master 分支限制删除", checked: true, disabled: true },
        { id: "master-2", title: "需要部署成功", description: "master 分支代码合并前，需要先在staging环境部署成功", checked: true, disabled: true },
        { id: "master-3", title: "CI检查", description: "需要CI检查通过", checked: true, disabled: true },
        { id: "master-4", title: "最新代码", description: "每次合并前需要确保最新代码", checked: true, disabled: true },
        { id: "master-5", title: "代码审查", description: "代码更新后需重新审查", checked: true, disabled: true },
        { id: "master-6", title: "审查人员", description: "需要除自己以外的人员审查代码", checked: true, disabled: true },
        { id: "master-7", title: "审查人数", description: "代码审查人员至少两位", checked: true, disabled: true },
        { id: "master-8", title: "Code Owners", description: "代码审查+2人员必须是指定reviewer 组", checked: true, disabled: true },
        { id: "master-9", title: "禁止强推", description: "禁止强制推送和直接推送（push and force-push）", checked: true, disabled: true },
        { id: "master-10", title: "管理员限制", description: "管理员无法绕过", checked: true, disabled: true }
      ]
    },
    {
      name: "develop",
      rules: [
        { id: "staging-1", title: "限制删除", description: "分支限制删除", checked: true, disabled: true },
        { id: "staging-2", title: "CI检查", description: "需要CI检查通过", checked: true, disabled: true },
        { id: "staging-3", title: "最新代码", description: "每次合并前需要确保最新代码", checked: true, disabled: true },
        { id: "staging-4", title: "代码审查", description: "代码更新后需重新审查", checked: true, disabled: true },
        { id: "staging-5", title: "审查人员", description: "需要除自己以外的人员审查代码", checked: true, disabled: true },
        { id: "staging-6", title: "审查人数", description: "代码审查人员至少一位", checked: true, disabled: true },
        { id: "staging-7", title: "禁止强推", description: "禁止强制推送和直接推送（push and force-push）", checked: true, disabled: true },
        { id: "staging-8", title: "管理员权限", description: "管理员无法绕过", checked: true, disabled: true }
      ]
    },
    {
      name: "deploy/staging",
      rules: [
        { id: "develop-1", title: "限制删除", description: "分支限制删除", checked: true, disabled: true },
        { id: "develop-2", title: "CI检查", description: "需要CI检查通过", checked: true, disabled: true },
        { id: "develop-3", title: "最新代码", description: "每次合并前需要确保最新代码", checked: true, disabled: true },
      ]
    }
  ];

  return (
    <div className="p-6">
      <h1 className="text-[24px] font-bold mb-6" style={{ color: 'var(--heading)' }}>仓库详情</h1>
      {/* 仓库基础信息：名称 / 类型 / 初始化状态 / 创建时间 */}
      <div style={{ background: '#fff', border: '1px solid #eee', borderRadius: 8, padding: 16, marginBottom: 12 }}>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 24 }}>
          <div>
            <div style={{ fontSize: 14, color: '#2f3542', marginBottom: 12, fontWeight: 800 ,marginLeft: 12}}>仓库名称</div>
            <div style={{ fontSize: 14, fontWeight: 600, marginLeft: 12}}>{repoMeta.name}</div>
          </div>
          <div>
            <div style={{ fontSize: 14, color: '#2f3542', marginBottom: 12, fontWeight: 800 ,marginLeft: 48}}>仓库类型</div>
            <div style={{ fontSize: 14, marginLeft: 48}}>{typeLabel(repoMeta.type)}</div>
          </div>
          <div>
            <div style={{ fontSize: 14, color: '#2f3542', marginBottom: 12, fontWeight: 800 ,marginLeft: 96}}>初始化状态</div>
            <div style={{ fontSize: 14, marginLeft: 96, fontWeight: 600, color: initLabel === '已初始化' ? '#52C41A' : initLabel === '初始化失败' ? '#FF4D4F' : '#1677FF' }}>{initLabel}</div>
          </div>
          <div>
            <div style={{ fontSize: 14, color: '#2f3542', marginBottom: 12, fontWeight: 800 ,marginLeft: 144}}>仓库创建时间</div>
            <div style={{ fontSize: 14, marginLeft: 144}}>{repoMeta.createdAt}</div>
          </div>
        </div>
      </div>
      {(() => {
        const branchRulesContent = (
          <div className="bg-white rounded-lg p-6" style={{ width: '100%' }}>
            <Collapse
              activeKey={Object.keys(openStates).filter((k) => openStates[k])}
              expandIconPosition="start"
              // 放宽参数类型以兼容最小声明
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              expandIcon={(panelProps: any) => (panelProps?.isActive ? <DownOutlined /> : <RightOutlined />)}
              onChange={handleCollapseChange}
            >
              {branchRules.map((branch) => (
                <Collapse.Panel header={<div style={{ fontWeight: 600 }}>{branch.name}</div>} key={branch.name}>
                  <div style={{ paddingTop: 8 }}>
                    {branch.rules.map((rule) => (
                      <div key={rule.id} style={{ marginBottom: 12, background: '#fff', border: '1px solid #eee', borderRadius: 8, padding: 12 }}>
                        <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
                          <Checkbox checked={rule.checked} disabled={rule.disabled} />
                          <div>
                            <div style={{ fontSize: 14, fontWeight: 600 }}>{rule.title}</div>
                            <div style={{ color: '#666' }}>{rule.description}</div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </Collapse.Panel>
              ))}
            </Collapse>
          </div>
        )

        const branchesContent = (
          <div className="bg-white rounded-lg p-6" style={{ width: '100%' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <div style={{ fontSize: 16, fontWeight: 600 }}>分支列表</div>
              <AntButton 
                type="primary" 
                icon={<PlusOutlined />} 
                onClick={() => setShowCreateBranch(true)}
              >
                新建分支
              </AntButton>
            </div>
            <AntTable<Branch>
              columns={branchColumns}
              dataSource={branches}
              rowKey="id"
              pagination={false}
              size="middle"
            />
            
            <Modal
              title="新建分支"
              open={showCreateBranch}
              onCancel={() => {
                setShowCreateBranch(false);
                branchForm.resetFields();
              }}
              onOk={handleCreateBranch}
              okText="创建"
              cancelText="取消"
            >
              <Form form={branchForm} layout="vertical">
                <Form.Item 
                  name="name" 
                  label="分支名称" 
                  rules={[
                    { required: true, message: '请输入分支名称' },
                    { pattern: /^[a-zA-Z0-9/_-]+$/, message: '分支名称只能包含字母、数字、下划线、斜杠和连字符' }
                  ]}
                >
                  <Input placeholder="例如：feature/new-feature" />
                </Form.Item>
                <Form.Item 
                  name="description" 
                  label="功能说明" 
                  rules={[
                    { required: true, message: '请输入功能说明' },
                    { max: 200, message: '功能说明不能超过200个字符' }
                  ]}
                >
                  <Input.TextArea 
                    rows={3}
                    placeholder="请描述该分支的功能和用途，例如：用户登录功能开发"
                    showCount
                    maxLength={200}
                  />
                </Form.Item>
              </Form>
            </Modal>
          </div>
        )

        const initStatusContent = (
          <div className="bg-white rounded-lg p-6" style={{ width: '100%' }}>
            {initStatus?.status === 'failed' && (
              <Alert
                type="error"
                showIcon
                icon={<ExclamationCircleOutlined />}
                className="mb-6"
                message={<div style={{ fontWeight: 600 }}>初始化失败</div>}
                description={<div>{initStatus.error || '初始化过程中发生错误'}</div>}
              />
            )}

            {initStatus?.status === 'success' && (
              <Alert
                type="success"
                showIcon
                icon={<CheckCircleOutlined />}
                className="mb-6"
                message={<div style={{ fontWeight: 600 }}>初始化成功</div>}
                description={<div>仓库已完成所有初始化配置</div>}
              />
            )}

            <div style={{ display: 'grid', gap: 12 }}>
              {initStatus?.steps.map((step, index) => (
                <div key={index} style={{ display: 'flex', gap: 12, padding: 12, borderRadius: 8, border: '1px solid #eee', alignItems: 'center' }}>
                  {step.status === 'success' && <CheckCircleOutlined style={{ color: '#52C41A' }} />}
                  {step.status === 'failed' && <ExclamationCircleOutlined style={{ color: '#FF4D4F' }} />}
                  {step.status === 'pending' && <div style={{ width: 12, height: 12, borderRadius: 6, border: '2px solid #1677FF', borderTopColor: 'transparent', animation: 'spin 1s linear infinite' }} />}
                  <div>
                    <div style={{ fontWeight: 600 }}>{step.name}</div>
                    {step.error && <div style={{ color: '#FF4D4F' }}>{step.error}</div>}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )

        const items = [
          { key: 'branches', label: '分支', children: branchesContent },
          { key: 'branch-rules', label: '分支保护规则', children: branchRulesContent },
          { key: 'init-status', label: '初始化', children: initStatusContent },
        ]

        return (
          <Tabs
            activeKey={activeTab}
            onChange={(k: string) => setActiveTab(String(k))}
            items={items}
          />
        )
      })()}
    </div>
  )
} 