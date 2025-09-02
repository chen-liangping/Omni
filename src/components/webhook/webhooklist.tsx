"use client"
import React, { useEffect, useMemo, useState } from 'react'
import { Table as AntTable, Button as AntButton, Space, Tag, Modal, Form, Input, Checkbox, message } from 'antd'
import type { ColumnsType } from 'antd/es/table'

/**
 * 这段代码实现了 Webhook 机器人列表（增删查改），使用了 AntD Table、Form 与 localStorage
 * 代码说明：支持新增/编辑/删除机器人，持久化到 localStorage('omni-webhooks')。
 * 修改原因：为分支规划提供可关联的机器人，发送上线提醒（原型内以 console + message 模拟）。
 */

interface Robot { id: string; name: string; url: string; secret?: string; enabled: boolean }

const STORAGE_KEY = 'omni-webhooks'

export default function WebhookList() {
  const [rows, setRows] = useState<Robot[]>([])
  const [show, setShow] = useState(false)
  const [editing, setEditing] = useState<Robot | null>(null)
  const [form] = Form.useForm()

  const load = () => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY)
      const arr = raw ? (JSON.parse(raw) as Robot[]) : []
      if (Array.isArray(arr) && arr.length > 0) {
        setRows(arr)
      } else {
        // 首次初始化：写入 3 条默认机器人
        const seeded: Robot[] = [
          { id: `rb_${Date.now()}_wx`, name: 'dingding_01', url: 'https://oapi.dingtalk.com/robot/send?access_token=1234567890', enabled: true },
          { id: `rb_${Date.now()}_fs`, name: 'feishu_01', url: 'https://open.feishu.cn/open-apis/bot/v2/hook/1234567890', enabled: true },
          { id: `rb_${Date.now()}_sl`, name: 'Slack Bot', url: 'https://hooks.slack.com/services/1234567890/1234567890/1234567890', enabled: false },
        ]
        save(seeded)
      }
    } catch {
      setRows([])
    }
  }

  const save = (arr: Robot[]) => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(arr))
    setRows(arr)
  }

  useEffect(() => { load() }, [])

  const columns: ColumnsType<Robot> = useMemo(() => [
    { title: '名称', dataIndex: 'name', key: 'name' },
    { title: '回调地址', dataIndex: 'url', key: 'url', render: (u: string) => <a href={u} target="_blank" rel="noreferrer">{u}</a> },
    { title: '状态', dataIndex: 'enabled', key: 'enabled', render: (v: boolean) => <Tag color={v ? 'green' : 'default'}>{v ? '启用' : '停用'}</Tag> },
    { title: '操作', key: 'action', render: (_, r) => (
      <Space>
        <AntButton onClick={() => onEdit(r)}>编辑</AntButton>
        <AntButton danger onClick={() => onRemove(r.id)}>删除</AntButton>
      </Space>
    )},
  ], [])

  const onAdd = () => {
    setEditing(null)
    form.resetFields()
    setShow(true)
  }

  const onEdit = (r: Robot) => {
    setEditing(r)
    form.setFieldsValue(r)
    setShow(true)
  }

  const onRemove = (id: string) => {
    Modal.confirm({
      title: '确认删除该机器人？',
      onOk: () => {
        const next = rows.filter(x => x.id !== id)
        save(next)
        message.success('已删除')
      }
    })
  }

  const onOk = async () => {
    const v = await form.validateFields() as { name: string; url: string; secret?: string; enabled?: boolean }
    if (editing) {
      const next = rows.map(x => x.id === editing.id ? { ...editing, ...v, enabled: !!v.enabled } : x)
      save(next)
      message.success('已更新')
    } else {
      const id = `rb_${Date.now()}`
      const next = [{ id, name: v.name, url: v.url, secret: v.secret, enabled: !!v.enabled }, ...rows]
      save(next)
      message.success('已新增')
    }
    setShow(false)
  }

  return (
    <main style={{ padding: 24 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <h1 style={{ color: 'var(--heading)', margin: 0 }}>Webhook 机器人</h1>
        <Space>
          <AntButton type="primary" onClick={onAdd}>新增机器人</AntButton>
        </Space>
      </div>
      <AntTable<Robot> rowKey={(r) => r.id} columns={columns} dataSource={rows} />

      <Modal title={editing ? '编辑机器人' : '新增机器人'} open={show} onCancel={() => setShow(false)} onOk={onOk} okText="保存">
        <Form form={form} layout="vertical">
          <Form.Item name="name" label="名称" rules={[{ required: true }]}>
            <Input placeholder="例如 dingding机器人" />
          </Form.Item>
          <Form.Item name="url" label="回调地址" rules={[{ required: true }]}>
            <Input placeholder="例如 https://example.com/webhook" />
          </Form.Item>
          <Form.Item name="secret" label="密钥">
            <Input placeholder="可选，用于签名" />
          </Form.Item>
          <Form.Item name="enabled" valuePropName="checked">
            <Checkbox>启用</Checkbox>
          </Form.Item>
        </Form>
      </Modal>
    </main>
  )
}

