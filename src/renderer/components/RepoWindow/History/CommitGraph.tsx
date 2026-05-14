import { useRef, useEffect, useMemo } from 'react'
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

export function useGraphLayout(commits: { hash: string; parents: string[] }[]) {
  return useMemo(() => {
    const nodes: { hash: string; x: number; y: number; color: string; lane: number }[] = []
    const edges: { from: { x: number; y: number }; to: { x: number; y: number }; color: string }[] = []
    const hashToLane = new Map<string, number>()
    const laneColors: number[] = []
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
        })
      }
    }

    return { nodes, edges, maxLanes, width: 20 + maxLanes * 18 + 20 }
  }, [commits])
}

export function CommitGraphCanvas({ commits, width: containerWidth, rowHeight, onCommitClick }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const dpr = typeof window !== 'undefined' ? window.devicePixelRatio || 1 : 1

  const { nodes, edges, maxLanes, width: graphWidth } = useGraphLayout(commits)

  const height = commits.length * rowHeight
  const totalWidth = Math.max(containerWidth, graphWidth)

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

  return (
    <canvas
      ref={canvasRef}
      className="select-none"
      onClick={handleClick}
    />
  )
}
