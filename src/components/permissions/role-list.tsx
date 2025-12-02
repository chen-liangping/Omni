'use client'

import React, { useMemo, useState } from 'react'
import { Table as AntTable, Tag, Button as AntButton, Space, Drawer, Input, Form, Checkbox, App as AntApp } from 'antd'
import type { ColumnsType } from 'antd/es/table'
import { PlusOutlined, EditOutlined } from '@ant-design/icons'

interface RoleRow {
  id: string
  name: string
  permissions: string[]
  description: string
}

// 模拟权限选项
const PERMISSION_OPTIONS = [
  'view_dashboard', 'manage_vulnerabilities', 'manage_projects', 'manage_repos', 'view_logs', 'manage_permissions'
]

// 这段代码实现了「角色列表页」，展示角色及其权限，支持简单的编辑模拟
// 代码说明：表格列为 角色名称、权限、描述、操作
export default function RoleList() {
  const { message: msg } = AntApp.useApp()
  const [editOpen, setEditOpen] = useState(false)
  const [editingRole, setEditingRole] = useState<RoleRow | null>(null)
  const [form] = Form.useForm()

  const data: RoleRow[] = useMemo(() => ([
    { id: '1', name: 'admin', permissions: ['all'], description: '系统超级管理员，拥有所有权限' },
    { id: '2', name: '安全管理员', permissions: ['view_dashboard', 'manage_vulnerabilities', 'view_logs'], description: '负责安全漏洞的审核与管理' },
    { id: '3', name: '普通成员', permissions: ['view_dashboard'], description: '普通项目成员，仅查看权限' },
  ]), [])

  const columns: ColumnsType<RoleRow> = [
    { title: '角色名称', dataIndex: 'name', key: 'name', width: 150, render: (t) => <strong>{t}</strong> },
    { 
      title: '权限', 
      dataIndex: 'permissions', 
      key: 'permissions',
      render: (perms: string[]) => (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
          {perms.includes('all') ? <Tag color="red">ALL ACCESS</Tag> : perms.map(p => <Tag key={p} color="blue">{p}</Tag>)}
        </div>
      )
    },
    { title: '描述', dataIndex: 'description', key: 'description' },
    {
      title: '操作',
      key: 'action',
      width: 100,
      render: (_, r) => (
        <AntButton 
          type="link" 
          icon={<EditOutlined />} 
          onClick={() => {
            setEditingRole(r)
            form.setFieldsValue(r)
            setEditOpen(true)
          }}
        >
          编辑
        </AntButton>
      )
    }
  ]

  return (
    <div style={{ padding: 16 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
        <h1 style={{ color: 'var(--heading)', margin: 0 }}>角色列表</h1>
        <AntButton type="primary" icon={<PlusOutlined />} onClick={() => {
          setEditingRole(null)
          form.resetFields()
          setEditOpen(true)
        }}>
          新增角色
        </AntButton>
      </div>

      <AntTable<RoleRow> 
        rowKey="id" 
        columns={columns} 
        dataSource={data} 
        pagination={false} 
      />

      <Drawer
        title={editingRole ? `编辑角色 - ${editingRole.name}` : '新增角色'}
        width={500}
        onClose={() => setEditOpen(false)}
        open={editOpen}
        destroyOnClose
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={(values) => {
            msg.success('角色信息已保存')
            setEditOpen(false)
          }}
        >
          <Form.Item name="name" label="角色名称" rules={[{ required: true }]}>
            <Input />
          </Form.Item>
          <Form.Item name="description" label="描述">
            <Input.TextArea rows={3} />
          </Form.Item>
          <Form.Item name="permissions" label="权限配置">
            <Checkbox.Group style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {PERMISSION_OPTIONS.map(p => <Checkbox key={p} value={p}>{p}</Checkbox>)}
            </Checkbox.Group>
          </Form.Item>
          <Form.Item>
            <Space>
              <AntButton type="primary" htmlType="submit">保存</AntButton>
              <AntButton onClick={() => setEditOpen(false)}>取消</AntButton>
            </Space>
          </Form.Item>
        </Form>
      </Drawer>
    </div>
  )
}

