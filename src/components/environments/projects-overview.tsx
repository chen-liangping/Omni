'use client'

import React, { useEffect, useMemo, useState } from 'react'
import { Button as AntButton, Input, Space, Select as AntSelect, Modal, Form, message } from 'antd'
import { SearchOutlined, PlusOutlined } from '@ant-design/icons'
import EnvironmentProjectDetail from './project-detail'

interface ProjectRow {
  id: string
  projectName: string // 新增项目名称
  name: string // 仓库名称
}

export default function ProjectsOverview() {
  const [searchValue, setSearchValue] = useState('')
  const [selectedRepoId, setSelectedRepoId] = useState<string>('')
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [form] = Form.useForm()

  const rawData: ProjectRow[] = useMemo(() => ([
    { id: '1', projectName: 'Doraemon', name: 'doraemon' },
    { id: '2', projectName: 'Publisher', name: 'publisher' },
    { id: '3', projectName: 'Publisher CP', name: 'publisher-cp' },
  ]), [])

  useEffect(() => {
    if (!selectedRepoId && rawData.length) {
      setSelectedRepoId(rawData[0].id)
    }
  }, [rawData, selectedRepoId])

  const dropdownOptions = useMemo(() => {
    const keyword = searchValue.trim().toLowerCase()
    return rawData
      .filter(item => {
        if (!keyword) return true
        return item.projectName.toLowerCase().includes(keyword) || item.name.toLowerCase().includes(keyword)
      })
      .map(item => ({
        value: item.id,
        label: `${item.projectName} / ${item.name}`
      }))
  }, [rawData, searchValue])

  useEffect(() => {
    if (dropdownOptions.length === 0) return
    const exists = dropdownOptions.find(option => option.value === selectedRepoId)
    if (!exists) {
      setSelectedRepoId(dropdownOptions[0].value)
    }
  }, [dropdownOptions, selectedRepoId])

  const activeRepoId = selectedRepoId || rawData[0]?.id || ''

  return (
    <div style={{ padding: 16 }}>
      <div
        style={{
          marginBottom: 16,
          background: '#fff',
          padding: 8,
          borderRadius: 4,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 16,
        }}
      >
        <Space size={8} style={{ display: 'flex', alignItems: 'center' }}>
          <span style={{ fontSize: 16, fontWeight: 500, color: 'var(--heading)' }}>仓库</span>
          <AntSelect
            style={{ width: 260 }}
            placeholder="选择仓库"
            value={selectedRepoId}
            onChange={setSelectedRepoId}
            options={dropdownOptions}
            showSearch
            filterOption={false}
          />
        </Space>
        <AntButton type="primary" icon={<PlusOutlined />} onClick={() => setIsModalOpen(true)}>
          新增仓库
        </AntButton>
      </div>

      {activeRepoId ? (
        <div style={{ background: '#fff', borderRadius: 12 }}>
          <EnvironmentProjectDetail id={activeRepoId} embedded />
        </div>
      ) : (
        <div style={{ textAlign: 'center', padding: 48, color: '#999' }}>暂无可展示的仓库</div>
      )}

      <Modal
        title="新增仓库"
        open={isModalOpen}
        onCancel={() => setIsModalOpen(false)}
        onOk={() => {
          form.validateFields().then(values => {
            message.success('仓库新增成功')
            setIsModalOpen(false)
            form.resetFields()
          })
        }}
      >
        <Form form={form} layout="vertical">
          <Form.Item name="repoUrl" label="GitHub 仓库地址" rules={[{ required: true, message: '请选择仓库地址' }]}>
            <AntSelect
              showSearch
              placeholder="搜索 GitHub 仓库"
              options={[
                { value: 'https://github.com/company/doraemon', label: 'company/doraemon' },
                { value: 'https://github.com/company/publisher', label: 'company/publisher' },
                { value: 'https://github.com/company/publisher-cp', label: 'company/publisher-cp' },
              ]}
            />
          </Form.Item>
          <Form.Item name="project" label="项目" rules={[{ required: true, message: '请选择所属项目' }]}>
            <AntSelect
              showSearch
              placeholder="搜索所属项目"
              options={rawData.map(p => ({ label: p.projectName, value: p.projectName }))}
            />
          </Form.Item>
          <Form.Item name="yaml" label="YAML 配置 (可选)">
            <Input.TextArea rows={6} placeholder="# 粘贴您的 YAML 配置" style={{ fontFamily: 'monospace' }} />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  )
}
 

