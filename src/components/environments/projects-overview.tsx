'use client'

import React, { useEffect, useMemo, useState } from 'react'
import { Select as AntSelect, Button as AntButton } from 'antd'
import { useRouter } from 'next/navigation'
import EnvironmentProjectDetail from './project-detail'

interface ProjectRow {
  id: string
  projectName: string // 新增项目名称
  name: string // 仓库名称
}

function PreviewSteps({ onConfigure }: { onConfigure: () => void }) {
  const steps = [
    {
      id: 1,
      title: '环境准备',
      desc: '创建 PR 后自动生成环境URL',
      status: 'done' as const,
    },
    {
      id: 2,
      title: '功能测试',
      desc: '测试根据需求进行功能测试',
      status: 'current' as const,
    },
    {
      id: 3,
      title: '销毁环境',
      desc: '功能测试完成后，合并代码，销毁环境，释放资源',
      status: 'todo' as const,
    },
  ]

  return (
    <div
      style={{
        marginBottom: 16,
        borderRadius: 16,
        border: '1px solid #f0f0f0',
        padding: 16,
        background: '#ffffff',
      }}
    >
      <h2 style={{ fontSize: 16, fontWeight: 600, marginBottom: 16 }}>预览环境流程</h2>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12 }}>
        {steps.map((s, index) => {
          // 不展示进度，仅用统一样式展示流程步骤
          const circleColor = '#f3f4f6'
          const lineColor = '#e5e7eb'
          return (
            <div key={s.id} style={{ flex: 1, display: 'flex', alignItems: 'flex-start' }}>
              {/* 圆点 */}
              <div
                style={{
                  width: 28,
                  height: 28,
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#4b5563',
                  fontSize: 13,
                  fontWeight: 500,
                  background: circleColor,
                  flexShrink: 0,
                }}
              >
                {s.id}
              </div>
              {/* 文本 */}
              <div style={{ marginLeft: 12 }}>
                <div style={{ fontWeight: 500, color: '#1f2933' }}>{s.title}</div>
                <div style={{ color: '#6b7280', fontSize: 12, marginTop: 4 }}>{s.desc}</div>
              </div>
              {/* 连接线 */}
              {index < steps.length - 1 && (
                <div
                  style={{
                    flex: 1,
                    height: 2,
                    marginTop: 18,
                    marginLeft: 16,
                    background: lineColor,
                  }}
                />
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}

export default function ProjectsOverview() {
  const [selectedRepoId, setSelectedRepoId] = useState<string>('')
  const router = useRouter()

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

  const dropdownOptions = useMemo(
    () =>
      rawData.map(item => ({
        value: item.id,
        label: `${item.name}`,
        repoNameSearch: item.name.toLowerCase(),
      })),
    [rawData]
  )

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
        <span style={{ fontSize: 20, fontWeight: 500, color: 'var(--heading)' }}>多环境</span>
        <AntSelect
          style={{ width: 260 }}
          placeholder="选择仓库"
          value={selectedRepoId}
          onChange={setSelectedRepoId}
          options={dropdownOptions}
          showSearch
          filterOption={(input, option) =>
            ((option as any)?.repoNameSearch ?? '').includes(input.toLowerCase())
          }
        />
      </div>

      <PreviewSteps
        onConfigure={() => {
          if (activeRepoId) {
            router.push(`/environments/${activeRepoId}`)
          }
        }}
      />

      {activeRepoId ? (
        <div style={{ background: '#fff', borderRadius: 12 }}>
          <EnvironmentProjectDetail id={activeRepoId} embedded />
        </div>
      ) : (
        <div style={{ textAlign: 'center', padding: 48, color: '#999' }}>暂无可展示的仓库</div>
      )}

    </div>
  )
}
 

