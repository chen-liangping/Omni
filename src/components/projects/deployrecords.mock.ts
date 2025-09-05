// 统一的部署记录 Mock 数据来源（供独立页面与项目详情页共用）

export interface PodRecord {
  id: string
  name: string
  status: 'running' | 'pending' | 'failed' | 'terminated'
  node: string
  restartCount: number
  createdAt: string
}

export interface ReplicaSetRecord {
  id: string
  name: string
  createdAt: string
  podStatus: {
    running: number
    failed: number
    terminated: number
  }
  uptime: string
  isCurrent: boolean
  pods: PodRecord[]
}

export interface DeployRecord {
  id: string
  deployId: string
  commit: {
    hash: string
    author: string
  }
  deployTime: string
  status: 'success' | 'failed' | 'pending' | 'cancelled'
  duration: string
  environment: 'stg'
  replicaSets: ReplicaSetRecord[]
}

const records: DeployRecord[] = [
  {
    id: 'deploy-102',
    deployId: '#102',
    commit: { hash: 'a1b2c3d', author: 'alice' },
    deployTime: '2025-09-05 15:30',
    status: 'success',
    duration: '2m15s',
    environment: 'stg',
    replicaSets: [
      {
        id: 'rs-1',
        name: 'my-app-6d4f8c7d9',
        createdAt: '15:32',
        podStatus: { running: 3, failed: 0, terminated: 0 },
        uptime: '3h20m',
        isCurrent: true,
        pods: [
          { id: 'pod-1', name: 'my-app-6d4f8c7d9-abcde', status: 'running', node: 'node-1', restartCount: 0, createdAt: '15:32' },
          { id: 'pod-2', name: 'my-app-6d4f8c7d9-fghij', status: 'running', node: 'node-2', restartCount: 0, createdAt: '15:32' },
          { id: 'pod-3', name: 'my-app-6d4f8c7d9-klmno', status: 'running', node: 'node-1', restartCount: 1, createdAt: '15:32' }
        ]
      },
      {
        id: 'rs-2',
        name: 'my-app-5b7e3f2c8',
        createdAt: '09-04 11:20',
        podStatus: { running: 0, failed: 0, terminated: 3 },
        uptime: '1d12h',
        isCurrent: false,
        pods: []
      }
    ]
  },
  {
    id: 'deploy-101',
    deployId: '#101',
    commit: { hash: '9f8e7d6', author: 'bob' },
    deployTime: '2025-09-04 11:20',
    status: 'failed',
    duration: '5m43s',
    environment: 'stg',
    replicaSets: [
      {
        id: 'rs-3',
        name: 'my-app-5b7e3f2c8',
        createdAt: '11:20',
        podStatus: { running: 0, failed: 3, terminated: 0 },
        uptime: '1d12h',
        isCurrent: false,
        pods: [
          { id: 'pod-4', name: 'my-app-5b7e3f2c8-xyz12', status: 'failed', node: 'node-1', restartCount: 3, createdAt: '11:20' },
          { id: 'pod-5', name: 'my-app-5b7e3f2c8-abc34', status: 'failed', node: 'node-2', restartCount: 2, createdAt: '11:20' }
        ]
      }
    ]
  },
  {
    id: 'deploy-100',
    deployId: '#100',
    commit: { hash: '7c6d5e4', author: 'alice' },
    deployTime: '2025-09-03 09:45',
    status: 'success',
    duration: '1m58s',
    environment: 'stg',
    replicaSets: [
      {
        id: 'rs-4',
        name: 'my-app-4c2d7a1b6',
        createdAt: '09:45',
        podStatus: { running: 0, failed: 0, terminated: 3 },
        uptime: '2d3h',
        isCurrent: false,
        pods: []
      }
    ]
  }
]

export function getDeployRecordsMock(): DeployRecord[] {
  return records
}

