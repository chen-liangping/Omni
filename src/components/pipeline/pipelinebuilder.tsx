"use client"
import React, { useEffect, useMemo, useRef, useState } from 'react'

/**
 * 这段代码实现了“流水线可视化配置”原型页面，使用了原生拖拽 + SVG 连接线。
 * 代码说明：
 * - 左侧：工具栏（可新增节点）
 * - 中间：画布（拖拽节点、点击两次连线）
 * - 右侧：节点配置（名称、镜像、命令）
 * 修改原因：参考 Concourse CI（https://github.com/concourse）与 docs/workflow.md 的需求，交付可运行原型。
 */

type NodeId = string
type EdgeId = string

interface CanvasNode {
  id: NodeId
  x: number
  y: number
  title: string
  image: string
  command: string
}

interface CanvasEdge {
  id: EdgeId
  from: NodeId
  to: NodeId
}

export default function PipelineBuilder() {
  const [nodes, setNodes] = useState<CanvasNode[]>([
    { id: 'n1', x: 160, y: 120, title: 'Build', image: 'node:18', command: 'npm ci && npm run build' },
    { id: 'n2', x: 420, y: 260, title: 'Test', image: 'node:18', command: 'npm test' },
  ])
  const [edges, setEdges] = useState<CanvasEdge[]>([
    { id: 'e1', from: 'n1', to: 'n2' },
  ])
  const [selectedId, setSelectedId] = useState<NodeId | null>(null)
  const [selectedEdgeId, setSelectedEdgeId] = useState<EdgeId | null>(null)
  // 不再需要连线模式
  const [pendingLinkFrom] = useState<NodeId | null>(null)
  const [cursorPos] = useState<{ x: number; y: number } | null>(null)

  const selected = useMemo(() => nodes.find(n => n.id === selectedId) || null, [nodes, selectedId])
  const canvasRef = useRef<HTMLDivElement | null>(null)
  const nodeRefs = useRef<Record<NodeId, HTMLDivElement | null>>({})

  const addNode = () => {
    const id = `n${Date.now()}`
    const newNode: CanvasNode = { id, x: 120, y: 80, title: 'New Task', image: 'alpine:3.18', command: 'echo hello' }
    // 先添加节点
    setNodes(prev => ([...prev, newNode]))
    // 默认连线：优先从选中节点，其次从最后一个节点 → 新节点
    const fromId = selectedId ?? (nodes.length ? nodes[nodes.length - 1].id : null)
    if (fromId) {
      const eid = `e${Date.now()}`
      setEdges(prev => ([...prev, { id: eid, from: fromId, to: id }]))
    }
  }

  const onDragStart = (e: React.DragEvent<HTMLDivElement>, id: NodeId) => {
    e.dataTransfer.setData('text/plain', id)
  }

  const onCanvasDrop = (e: React.DragEvent<HTMLDivElement>) => {
    const id = e.dataTransfer.getData('text/plain')
    if (!id) return
    const rect = (e.currentTarget as HTMLDivElement).getBoundingClientRect()
    const x = e.clientX - rect.left - 60
    const y = e.clientY - rect.top - 24
    setNodes(prev => prev.map(n => n.id === id ? { ...n, x, y } : n))
  }

  const onCanvasDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
  }

  const onCanvasMouseMove = (_e: React.MouseEvent<HTMLDivElement>) => {}
  const onCanvasMouseLeave = () => {}

  const onNodeClick = (id: NodeId) => {
    // 仅选择节点（不进入连线模式）
    setSelectedEdgeId(null)
    setSelectedId(id)
  }

  // 取消手动连线入口

  const updateSelected = (patch: Partial<CanvasNode>) => {
    if (!selectedId) return
    setNodes(prev => prev.map(n => n.id === selectedId ? { ...n, ...patch } : n))
  }

  const removeSelected = () => {
    if (!selectedId) return
    setEdges(prev => prev.filter(e => e.from !== selectedId && e.to !== selectedId))
    setNodes(prev => prev.filter(n => n.id !== selectedId))
    setSelectedId(null)
  }

  const cancelLinking = () => {}

  const onCanvasClick = (e: React.MouseEvent<HTMLDivElement>) => {
    // 点击空白区域：取消选中与连线模式
    if ((e.target as HTMLElement).dataset?.edge !== 'true') {
      setSelectedId(null)
      setSelectedEdgeId(null)
      cancelLinking()
    }
  }

  const deleteEdge = (edgeId: EdgeId) => {
    setEdges(prev => prev.filter(e => e.id !== edgeId))
    setSelectedEdgeId(null)
  }

  // 键盘 ESC 取消连线/选中
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        cancelLinking()
        setSelectedEdgeId(null)
        setSelectedId(null)
      }
      if ((e.key === 'Delete' || e.key === 'Backspace') && selectedEdgeId) {
        deleteEdge(selectedEdgeId)
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [selectedEdgeId])

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '220px 1fr 300px', gap: 12, padding: 12 }}>
      {/* 左侧：工具栏 */}
      <div style={{ background: '#fff', borderRadius: 10, boxShadow: '0 4px 20px rgba(0,0,0,0.06)', padding: 12 }}>
        <h3 style={{ marginTop: 0, color: 'var(--heading)' }}>工具栏</h3>
        <button onClick={addNode} style={{ padding: '6px 12px', borderRadius: 6, border: '1px solid #e5e7eb', cursor: 'pointer' }}>新增任务节点</button>
        <div style={{ marginTop: 12, fontSize: 12, color: '#6b7280' }}>
          - 拖拽节点到画布移动位置
          <br />- 选中节点“开始连线”后，再点另一节点完成连接
        </div>
      </div>

      {/* 中间：画布 */}
      <div
        ref={canvasRef}
        onDrop={onCanvasDrop}
        onDragOver={onCanvasDragOver}
        onMouseMove={onCanvasMouseMove}
        onMouseLeave={onCanvasMouseLeave}
        onClick={onCanvasClick}
        style={{ background: 'var(--card)', borderRadius: 10, position: 'relative', minHeight: 520, boxShadow: 'inset 0 0 0 1px #eee', overflow: 'visible' }}
      >
        {/* 连线模式状态条 */}
        {/* 取消连线模式提示（已移除） */}
        {/* 连接线（SVG） */}
        <svg style={{ position: 'absolute', inset: 0, pointerEvents: 'none', zIndex: 2, overflow: 'visible' }}>
          <defs>
            <marker id="arrow" viewBox="0 0 10 10" refX="10" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
              <path d="M 0 0 L 10 5 L 0 10 z" fill="#1677ff" />
            </marker>
          </defs>
          {edges.map(e => {
            const fromEl = nodeRefs.current[e.from]
            const toEl = nodeRefs.current[e.to]
            const canvasEl = canvasRef.current
            if (!fromEl || !toEl || !canvasEl) return null
            const fromRect = fromEl.getBoundingClientRect()
            const toRect = toEl.getBoundingClientRect()
            const canvasRect = canvasEl.getBoundingClientRect()
            const x1 = fromRect.right - canvasRect.left
            const y1 = fromRect.top + fromRect.height / 2 - canvasRect.top
            const x2 = toRect.left - canvasRect.left
            const y2 = toRect.top + toRect.height / 2 - canvasRect.top
            const mx = (x1 + x2) / 2
            const d = `M ${x1},${y1} C ${mx},${y1} ${mx},${y2} ${x2},${y2}`
            const isSel = selectedEdgeId === e.id
            return (
              <path
                key={e.id}
                d={d}
                stroke={isSel ? '#ff4d4f' : '#1677ff'}
                strokeWidth={isSel ? 4 : 3}
                fill="none"
                markerEnd="url(#arrow)"
                style={{ pointerEvents: 'stroke', cursor: 'pointer' }}
                onClick={(ev) => { ev.stopPropagation(); setSelectedEdgeId(e.id) }}
                data-edge="true"
              />
            )
          })}
          {/* 预览连线（跟随鼠标） */}
          {/* 连线预览已移除 */}
        </svg>
        {/* 节点 */}
        {nodes.map(n => (
          <div
            key={n.id}
            draggable
            onDragStart={(e) => onDragStart(e, n.id)}
            onClick={() => onNodeClick(n.id)}
            ref={(el) => { nodeRefs.current[n.id] = el }}
            style={{
              position: 'absolute', left: n.x, top: n.y, width: 120, height: 48,
              background: '#fff', border: `2px solid ${selectedId === n.id ? '#1677ff' : '#e5e7eb'}`,
              borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center',
              cursor: 'move', boxShadow: '0 6px 20px rgba(0,0,0,0.06)'
            }}
          >
            <span style={{ fontWeight: 600, color: '#2f3640' }}>{n.title}</span>
          </div>
        ))}
      </div>

      {/* 右侧：属性面板 */}
      <div style={{ background: '#fff', borderRadius: 10, boxShadow: '0 4px 20px rgba(0,0,0,0.06)', padding: 12 }}>
        <h3 style={{ marginTop: 0, color: 'var(--heading)' }}>节点配置</h3>
        {selected ? (
          <div style={{ display: 'grid', gap: 8 }}>
            <label>
              <div style={{ fontSize: 12, color: '#6b7280' }}>名称</div>
              <input value={selected.title} onChange={(e) => updateSelected({ title: e.target.value })} style={{ width: '100%', padding: '6px 8px', borderRadius: 6, border: '1px solid #e5e7eb' }} />
            </label>
            <label>
              <div style={{ fontSize: 12, color: '#6b7280' }}>镜像</div>
              <input value={selected.image} onChange={(e) => updateSelected({ image: e.target.value })} style={{ width: '100%', padding: '6px 8px', borderRadius: 6, border: '1px solid #e5e7eb' }} />
            </label>
            <label>
              <div style={{ fontSize: 12, color: '#6b7280' }}>命令</div>
              <textarea value={selected.command} onChange={(e) => updateSelected({ command: e.target.value })} style={{ width: '100%', padding: '6px 8px', borderRadius: 6, border: '1px solid #e5e7eb', minHeight: 96 }} />
            </label>
            <div style={{ display: 'flex', gap: 8 }}>
              <button onClick={removeSelected} style={{ padding: '6px 12px', borderRadius: 6, border: '1px solid #ef4444', color: '#ef4444', background: '#fff' }}>删除节点</button>
            </div>
          </div>
        ) : (
          <div style={{ fontSize: 12, color: '#6b7280' }}>选择一个节点以编辑属性，或点击“新增任务节点”</div>
        )}
      </div>
    </div>
  )
}

