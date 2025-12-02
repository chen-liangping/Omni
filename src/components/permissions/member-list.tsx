'use client'

import React, { useMemo, useState } from 'react'
import { Table as AntTable, Tag, Button as AntButton, Space, Modal, Form, Input, Select as AntSelect, App as AntApp, Avatar, Popconfirm } from 'antd'
import type { ColumnsType } from 'antd/es/table'
import { PlusOutlined, EditOutlined, DeleteOutlined, UserOutlined } from '@ant-design/icons'

interface MemberRow {
  id: string
  name: string
  email: string
  role: string
  lastLogin: string
}

const ROLES = ['admin', '安全管理员', '安全项目组长', '普通成员']

// 这段代码实现了「成员管理列表页」，展示成员账号及其角色，支持角色分配
// 代码说明：表格列为 成员、邮箱、角色、最后登录、操作
export default function MemberList() {
  const { message: msg } = AntApp.useApp()
  const [editOpen, setEditOpen] = useState(false)
  const [editingMember, setEditingMember] = useState<MemberRow | null>(null)
  const [form] = Form.useForm()

  const data: MemberRow[] = useMemo(() => ([
    { id: '1', name: 'chenlp', email: 'chen.lp@ctw.inc', role: 'admin', lastLogin: '2025-11-29 10:00' },
    { id: '2', name: 'lin.y', email: 'lin.y@ctw.inc', role: '安全管理员', lastLogin: '2025-11-28 14:30' },
    { id: '3', name: 'wu.yuni', email: 'wu.yuni@ctw.inc', role: '普通成员', lastLogin: '2025-11-27 18:45' },
  ]), [])

  const columns: ColumnsType<MemberRow> = [
    {
      title: '成员',
      key: 'member',
      render: (_, r) => (
        <Space>
          <Avatar icon={<UserOutlined />} />
          <div>
            <div style={{ fontWeight: 500 }}>{r.name}</div>
          </div>
        </Space>
      )
    },
    { title: '邮箱', dataIndex: 'email', key: 'email' },
    { 
      title: '角色', 
      dataIndex: 'role', 
      key: 'role',
      render: (role) => {
        const color = role === 'admin' ? 'red' : role === '普通成员' ? 'default' : 'blue'
        return <Tag color={color}>{role}</Tag>
      }
    },
    { title: '最后登录', dataIndex: 'lastLogin', key: 'lastLogin', render: (t) => <span style={{ color: '#999' }}>{t}</span> },
    {
      title: '操作',
      key: 'action',
      width: 250,
      render: (_, r) => (
        <Space>
          <AntButton 
            type="link" 
            size="small"
            icon={<EditOutlined />} 
            onClick={() => {
              setEditingMember(r)
              form.setFieldsValue(r)
              setEditOpen(true)
            }}
          >
            编辑
          </AntButton>
          <Popconfirm title="确认移除该成员？" onConfirm={() => msg.success('成员已移除')}>
            <AntButton type="link" danger size="small" icon={<DeleteOutlined />}>移除</AntButton>
          </Popconfirm>
        </Space>
      )
    }
  ]

  return (
    <div style={{ padding: 16 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
        <h1 style={{ color: 'var(--heading)', margin: 0 }}>成员管理</h1>
        <AntButton type="primary" icon={<PlusOutlined />} onClick={() => {
          setEditingMember(null)
          form.resetFields()
          setEditOpen(true)
        }}>
          邀请成员
        </AntButton>
      </div>

      <AntTable<MemberRow> 
        rowKey="id" 
        columns={columns} 
        dataSource={data} 
        pagination={{ pageSize: 10 }} 
      />

      <Modal
        title={editingMember ? '编辑成员角色' : '邀请新成员'}
        open={editOpen}
        onCancel={() => setEditOpen(false)}
        onOk={() => {
          form.validateFields().then(() => {
            msg.success(editingMember ? '成员信息已更新' : '邀请已发送')
            setEditOpen(false)
          })
        }}
        destroyOnClose
      >
        <Form form={form} layout="vertical">
          <Form.Item name="name" label="用户名" rules={[{ required: true }]}>
            <Input disabled={!!editingMember} />
          </Form.Item>
          <Form.Item name="email" label="邮箱" rules={[{ required: true, type: 'email' }]}>
            <Input disabled={!!editingMember} />
          </Form.Item>
          <Form.Item name="role" label="分配角色" rules={[{ required: true }]}>
            <AntSelect options={ROLES.map(r => ({ label: r, value: r }))} />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  )
}

