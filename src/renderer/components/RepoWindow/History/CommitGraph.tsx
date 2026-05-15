import { useRef, useEffect, useMemo, useState, useCallback } from 'react'
import type { Branch } from '@main/services/GitService'

interface CommitNode {
  hash: string
  subject: string
  author: string
  date: Date
  refs: string[]
  parents: string[]
  x: number
  y: number
  color: string
  isMerge: boolean
}

interface Props {
  commits: CommitNode[]
  width: number
  rowHeight: number
  onCommitClick?: (hash: string) => void
}

const BRANCH_COLORS = [
  '#0366d6', '#28a745', '#d73a49', '#6f42c1',
  '#e36209', '#005cc5', '#22863a', '#b31d28',
  '#5a32a3', '#d93f0b', '#1074e7', '#1a7f37',
]

function branchNameFromRefs(refs: string[]): string | null {
  for (const ref of refs) {
    if (ref.startsWith('HEAD -> ')) {
      return ref.slice('HEAD -> '.length)
    }
  }
  for (const ref of refs) {
    if (ref.startsWith('tag: ')) continue
    return ref
  }
  return null
}

export function useGraphLayout(commits: { hash: string; parents: string[]; refs: string[] }[]) {
  return useMemo(() => {
    const nodes: { hash: string; x: number; y: number; color: string; lane: number }[] = []
    const edges: { from: { x: number; y: number }; to: { x: number; y: number }; color: string; lane: number }[] = []
    const hashToLane = new Map<string, number>()
    const laneColors: number[] = []
    const laneNames: string[] = []
    let nextColor = 0

    function assignLane(hash: string): number {
      if (hashToLane.has(hash)) return hashToLane.get(hash)!
      const lane = laneColors.length
      hashToLane.set(hash, lane)
      laneColors.push(nextColor++ % BRANCH_COLORS.length)
      return lane
    }

    let maxLanes = 0
    const activeBranches = new Map<number, string>() // lane -> commit hash

    for (let i = 0; i < commits.length; i++) {
      const commit = commits[i]
      let lane: number

      const existingLane = hashToLane.get(commit.hash)
      if (existingLane !== undefined) {
        lane = existingLane
      } else if (commit.parents.length === 0) {
        lane = i
        hashToLane.set(commit.hash, lane)
        laneColors[lane] = nextColor++ % BRANCH_COLORS.length
      } else {
        const parentLane = hashToLane.get(commit.parents[0])
        lane = parentLane ?? i
        hashToLane.set(commit.hash, lane)
        if (parentLane !== undefined && laneColors[lane] === undefined) {
          laneColors[lane] = nextColor++ % BRANCH_COLORS.length
        }
      }

      if (lane >= laneColors.length) {
        for (let c = laneColors.length; c <= lane; c++) {
          laneColors.push(nextColor++ % BRANCH_COLORS.length)
        }
      }

      maxLanes = Math.max(maxLanes, lane + 1)

      const nodeX = 20 + lane * 18
      const nodeY = i

      nodes.push({
        hash: commit.hash,
        x: nodeX,
        y: nodeY,
        color: BRANCH_COLORS[laneColors[lane] % BRANCH_COLORS.length],
        lane,
      })

      // Draw edges from each parent
      for (let p = 0; p < commit.parents.length; p++) {
        const parent = commit.parents[p]
        let parentLane: number
        if (p === 0) {
          hashToLane.set(parent, lane)
          parentLane = lane
          if (laneColors[lane] === undefined) {
            laneColors[lane] = nextColor++ % BRANCH_COLORS.length
          }
        } else {
          parentLane = assignLane(parent)
          if (parentLane >= laneColors.length) {
            for (let c = laneColors.length; c <= parentLane; c++) {
              laneColors.push(nextColor++ % BRANCH_COLORS.length)
            }
          }
        }
        maxLanes = Math.max(maxLanes, parentLane + 1)

        const parentIndex = commits.findIndex(c => c.hash === parent)

        edges.push({
          from: { x: nodeX, y: nodeY },
          to: {
            x: 20 + parentLane * 18,
            y: parentIndex >= 0 ? parentIndex : nodeY + 1,
          },
          color: BRANCH_COLORS[laneColors[lane] % BRANCH_COLORS.length],
          lane,
        })
      }
    }

    // Build lane -> branch name mapping (iterate newest-first)
    for (let i = 0; i < commits.length; i++) {
      const name = branchNameFromRefs(commits[i].refs)
      const n = nodes[i]
      if (name && !laneNames[n.lane]) {
        laneNames[n.lane] = name
      }
    }
    for (let l = 0; l < maxLanes; l++) {
      if (!laneNames[l]) {
        laneNames[l] = l === 0 ? 'main' : `branch-${l}`
      }
    }

    return { nodes, edges, maxLanes, laneNames, width: 20 + maxLanes * 18 + 20 }
  }, [commits])
}

export function CommitGraphCanvas({ commits, width: containerWidth, rowHeight, onCommitClick }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const dpr = typeof window !== 'undefined' ? window.devicePixelRatio || 1 : 1
  const [tooltip, setTooltip] = useState<{ x: number; y: number; text: string } | null>(null)

  const { nodes, edges, maxLanes, laneNames, width: graphWidth } = useGraphLayout(commits)

  const height = commits.length * rowHeight
  const totalWidth = Math.max(containerWidth, graphWidth)

  // Build commit hash -> branch name map for node tooltips
  const hashToName = useMemo(() => {
    const map = new Map<string, string>()
    for (const node of nodes) {
      map.set(node.hash, laneNames[node.lane] ?? 'unknown')
    }
    return map
  }, [nodes, laneNames])

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    canvas.width = totalWidth * dpr
    canvas.height = height * dpr
    canvas.style.width = `${totalWidth}px`
    canvas.style.height = `${height}px`
    ctx.scale(dpr, dpr)

    ctx.clearRect(0, 0, totalWidth, height)

    // Draw edges
    ctx.lineWidth = 2
    for (const edge of edges) {
      ctx.beginPath()
      ctx.strokeStyle = edge.color + '55'
      const fromY = edge.from.y * rowHeight + rowHeight / 2
      const toY = edge.to.y * rowHeight + rowHeight / 2

      if (toY - fromY <= rowHeight * 2) {
        // Direct parent-child
        ctx.moveTo(edge.from.x, fromY)
        ctx.lineTo(edge.from.x, fromY + rowHeight * 0.6)
        ctx.lineTo(edge.to.x, fromY + rowHeight * 0.6)
        ctx.lineTo(edge.to.x, toY)
      } else {
        // Spanning multiple rows - curved
        const midY = (fromY + toY) / 2
        ctx.moveTo(edge.from.x, fromY)
        ctx.quadraticCurveTo(edge.from.x, midY, (edge.from.x + edge.to.x) / 2, midY)
        ctx.quadraticCurveTo(edge.to.x, midY, edge.to.x, toY)
      }
      ctx.stroke()
    }

    // Draw nodes
    for (const node of nodes) {
      const y = node.y * rowHeight + rowHeight / 2
      ctx.beginPath()
      ctx.arc(node.x, y, 4, 0, Math.PI * 2)
      ctx.fillStyle = node.color
      ctx.fill()
    }
  }, [commits, edges, nodes, height, totalWidth, rowHeight, dpr])

  const handleClick = (e: React.MouseEvent) => {
    const canvas = canvasRef.current
    if (!canvas) return
    const rect = canvas.getBoundingClientRect()
    const x = e.clientX - rect.left
    const y = e.clientY - rect.top
    const rowIndex = Math.floor(y / rowHeight)
    if (rowIndex >= 0 && rowIndex < commits.length) {
      onCommitClick?.(commits[rowIndex].hash)
    }
  }

  const distToSegment = useCallback((px: number, py: number, x1: number, y1: number, x2: number, y2: number): number => {
    const dx = x2 - x1
    const dy = y2 - y1
    const lenSq = dx * dx + dy * dy
    if (lenSq === 0) return Math.hypot(px - x1, py - y1)
    let t = ((px - x1) * dx + (py - y1) * dy) / lenSq
    t = Math.max(0, Math.min(1, t))
    return Math.hypot(px - (x1 + t * dx), py - (y1 + t * dy))
  }, [])

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    const canvas = canvasRef.current
    if (!canvas) return
    const rect = canvas.getBoundingClientRect()
    const mx = (e.clientX - rect.left) * (totalWidth / rect.width)
    const my = (e.clientY - rect.top) * (height / rect.height)

    // Check node proximity (within 8px of center)
    for (const node of nodes) {
      const ny = node.y * rowHeight + rowHeight / 2
      if (Math.hypot(mx - node.x, my - ny) <= 8) {
        const name = hashToName.get(node.hash) ?? 'unknown'
        setTooltip({ x: node.x + 10, y: ny - 12, text: `${node.hash.slice(0, 7)} ${name}` })
        return
      }
    }

    // Check edge proximity (within 4px of line/curve)
    for (const edge of edges) {
      const fromY = edge.from.y * rowHeight + rowHeight / 2
      const toY = edge.to.y * rowHeight + rowHeight / 2
      const name = laneNames[edge.lane] ?? 'unknown'

      if (toY - fromY <= rowHeight * 2) {
        // Direct: L-shaped path: (from.x,fromY) → (from.x,mY) → (to.x,mY) → (to.x,toY)
        const mY = fromY + rowHeight * 0.6
        const segs = [
          [edge.from.x, fromY, edge.from.x, mY],
          [edge.from.x, mY, edge.to.x, mY],
          [edge.to.x, mY, edge.to.x, toY],
        ]
        for (const [x1, y1, x2, y2] of segs as [number, number, number, number][]) {
          if (distToSegment(mx, my, x1, y1, x2, y2) <= 4) {
            setTooltip({ x: mx + 10, y: my - 12, text: name })
            return
          }
        }
      } else {
        // Curved: sample along 2 quadratic Bézier segments
        const midY = (fromY + toY) / 2
        const midX = (edge.from.x + edge.to.x) / 2
        // Segment 1: (from.x, fromY) → cp=(from.x, midY) → (midX, midY)
        // Segment 2: (midX, midY) → cp=(edge.to.x, midY) → (edge.to.x, toY)
        for (let t = 0; t <= 1; t += 0.05) {
          let qx: number, qy: number
          if (t < 0.5) {
            const lt = t / 0.5
            qx = (1 - lt) ** 2 * edge.from.x + 2 * (1 - lt) * lt * edge.from.x + lt * lt * midX
            qy = (1 - lt) ** 2 * fromY + 2 * (1 - lt) * lt * midY + lt * lt * midY
          } else {
            const lt = (t - 0.5) / 0.5
            qx = (1 - lt) ** 2 * midX + 2 * (1 - lt) * lt * edge.to.x + lt * lt * edge.to.x
            qy = (1 - lt) ** 2 * midY + 2 * (1 - lt) * lt * midY + lt * lt * toY
          }
          if (Math.hypot(mx - qx, my - qy) <= 6) {
            setTooltip({ x: mx + 10, y: my - 12, text: name })
            return
          }
        }
      }
    }

    setTooltip(null)
  }, [nodes, edges, hashToName, laneNames, rowHeight, totalWidth, height, distToSegment])

  const handleMouseLeave = useCallback(() => {
    setTooltip(null)
  }, [])

  return (
    <div ref={containerRef} className="relative">
      <canvas
        ref={canvasRef}
        className="select-none"
        onClick={handleClick}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
      />
      {tooltip && (
        <div
          className="absolute pointer-events-none z-50 px-2 py-1 text-[11px] font-mono bg-popover text-popover-foreground border rounded shadow whitespace-nowrap"
          style={{ left: tooltip.x, top: tooltip.y }}
        >
          {tooltip.text}
        </div>
      )}
    </div>
  )
}
