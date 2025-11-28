'use client'

import React, { useMemo } from 'react'
import Link from 'next/link'
import {
  Card as AntCard,
  Row as AntRow,
  Col as AntCol,
  Statistic as AntStatistic,
  Progress as AntProgress,
  Table as AntTable,
  Tag,
} from 'antd'
import { BugOutlined, AlertOutlined, CheckCircleOutlined, ClockCircleOutlined } from '@ant-design/icons'
import type { ColumnsType } from 'antd/es/table'

interface ProjectOverviewItem {
  id: string
  name: string
  riskScore: number
  vulnerabilities: number
  openIssues: number
}

// 这段代码实现了「漏洞管理 Dashboard」，使用了 Ant Design 的 Card/Statistic/Progress/Table
// 代码说明：顶部四张指标卡，左下方为严重级别条形视觉（用 Progress 模拟），右下方为项目概览表；布局与用户截图一致
export default function VulnerabilityDashboard() {
  const totals = { total: 14, open: 14, fixed: 0, overdue: 5 }
  const severity = { critical: 0, high: 5, medium: 9, low: 0, info: 0 }

  const projects: ProjectOverviewItem[] = useMemo(() => ([
    { id: 'p1', name: 'test12', riskScore: 0, vulnerabilities: 0, openIssues: 0 },
    { id: 'p2', name: '123', riskScore: 0, vulnerabilities: 0, openIssues: 0 },
    { id: 'p3', name: '2221122', riskScore: 58.2, vulnerabilities: 11, openIssues: 11 },
    { id: 'p4', name: 'ceshiaaa', riskScore: 44, vulnerabilities: 1, openIssues: 1 },
    { id: 'p5', name: 'testaaa', riskScore: 39, vulnerabilities: 2, openIssues: 2 }
  ]), [])

  const columns: ColumnsType<ProjectOverviewItem> = [
    { title: 'PROJECT', dataIndex: 'name', key: 'name', render: (v: string) => <Link href="/projects">{v}</Link> },
    {
      title: 'RISK SCORE',
      dataIndex: 'riskScore',
      key: 'risk',
      render: (v: number) => (
        <Tag color={v === 0 ? 'green' : v > 60 ? 'red' : 'gold'}>
          {v.toFixed(0)}/100
        </Tag>
      )
    },
    { title: 'VULNERABILITIES', dataIndex: 'vulnerabilities', key: 'vulns' },
    { title: 'OPEN', dataIndex: 'openIssues', key: 'open' },
  ]

  return (
    <div style={{ padding: 16 }}>
      <AntRow gutter={16} style={{ marginBottom: 12 }}>
        <AntCol xs={24} sm={12} md={6}>
          <AntCard>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <BugOutlined style={{ fontSize: 18, color: '#1677ff' }} />
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 12, color: '#8c8c8c' }}>Total Vulnerabilities</div>
                <div style={{ fontSize: 28, fontWeight: 700 }}>{totals.total}</div>
                <div style={{ fontSize: 12, color: '#8c8c8c' }}>All Vulnerabilities</div>
              </div>
            </div>
          </AntCard>
        </AntCol>
        <AntCol xs={24} sm={12} md={6}>
          <AntCard>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <AlertOutlined style={{ fontSize: 18, color: '#fa541c' }} />
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 12, color: '#8c8c8c' }}>Open Issues</div>
                <div style={{ fontSize: 28, fontWeight: 700 }}>{totals.open}</div>
                <div style={{ fontSize: 12, color: '#8c8c8c' }}>100% of total</div>
              </div>
            </div>
          </AntCard>
        </AntCol>
        <AntCol xs={24} sm={12} md={6}>
          <AntCard>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <CheckCircleOutlined style={{ fontSize: 18, color: '#52c41a' }} />
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 12, color: '#8c8c8c' }}>Fixed Issues</div>
                <div style={{ fontSize: 28, fontWeight: 700 }}>{totals.fixed}</div>
                <div style={{ fontSize: 12, color: '#8c8c8c' }}>0% of total</div>
              </div>
            </div>
          </AntCard>
        </AntCol>
        <AntCol xs={24} sm={12} md={6}>
          <AntCard>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <ClockCircleOutlined style={{ fontSize: 18, color: '#2f54eb' }} />
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 12, color: '#8c8c8c' }}>Overdue</div>
                <div style={{ fontSize: 28, fontWeight: 700 }}>{totals.overdue}</div>
                <div style={{ fontSize: 12, color: '#8c8c8c' }}>Needs attention</div>
              </div>
            </div>
          </AntCard>
        </AntCol>
      </AntRow>

      <AntRow gutter={16}>
        <AntCol xs={24} md={12}>
          <AntCard title="Vulnerability Severity">
            <div style={{ display: 'grid', gap: 12 }}>
              <div style={{ display: 'grid', gridTemplateColumns: '80px 1fr 40px', alignItems: 'center', gap: 8 }}>
                <span>Critical</span>
                <AntProgress percent={0} showInfo={false} />
                <span style={{ textAlign: 'right' }}>{severity.critical}</span>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '80px 1fr 40px', alignItems: 'center', gap: 8 }}>
                <span>High</span>
                <AntProgress percent={62} status="exception" showInfo={false} />
                <span style={{ textAlign: 'right' }}>{severity.high}</span>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '80px 1fr 40px', alignItems: 'center', gap: 8 }}>
                <span>Medium</span>
                <AntProgress percent={100} strokeColor="#faad14" showInfo={false} />
                <span style={{ textAlign: 'right' }}>{severity.medium}</span>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '80px 1fr 40px', alignItems: 'center', gap: 8 }}>
                <span>Low</span>
                <AntProgress percent={0} showInfo={false} />
                <span style={{ textAlign: 'right' }}>{severity.low}</span>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '80px 1fr 40px', alignItems: 'center', gap: 8 }}>
                <span>Info</span>
                <AntProgress percent={0} showInfo={false} />
                <span style={{ textAlign: 'right' }}>{severity.info}</span>
              </div>
            </div>
          </AntCard>
        </AntCol>
        <AntCol xs={24} md={12}>
          <AntCard title="Projects Overview" extra={<Link href="/projects">View all projects →</Link>}>
            <AntTable<ProjectOverviewItem>
              rowKey="id"
              size="small"
              pagination={false}
              columns={columns}
              dataSource={projects}
            />
          </AntCard>
        </AntCol>
      </AntRow>
    </div>
  )
}


