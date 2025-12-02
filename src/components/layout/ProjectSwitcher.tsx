'use client'

import React, { useState } from 'react'
import { Dropdown, type MenuProps } from 'antd'
import { DownOutlined } from '@ant-design/icons'

const PROJECTS = ['Doraemon', 'Publisher', 'core']

export function ProjectSwitcher() {
  const [current, setCurrent] = useState<string>(PROJECTS[0])

  const items: MenuProps['items'] = PROJECTS.map((p) => ({
    key: p,
    label: p,
    onClick: () => setCurrent(p),
  }))

  return (
    <Dropdown menu={{ items }} trigger={['click']}>
      <div
        style={{
          padding: '4px 12px',
          borderRadius: 999,
          background: '#ffffff',
          display: 'flex',
          alignItems: 'center',
          gap: 6,
          boxShadow: '0 2px 6px rgba(0,0,0,0.06)',
          cursor: 'pointer',
        }}
      >
        <span style={{ fontSize: 14, color: '#1f1f1f' }}>{current}</span>
        <DownOutlined style={{ fontSize: 10, color: '#999' }} />
      </div>
    </Dropdown>
  )
}


