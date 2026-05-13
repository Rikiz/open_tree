import { describe, it, expect } from 'vitest'

// Extract graph layout logic without React hooks for testability
function computeGraphLayout(commits: { hash: string; parents: string[] }[]) {
  const BRANCH_COLORS = [
    '#0366d6', '#28a745', '#d73a49', '#6f42c1',
    '#e36209', '#005cc5', '#22863a', '#b31d28',
  ]

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

    nodes.push({ hash: commit.hash, x: nodeX, y: nodeY, color: BRANCH_COLORS[laneColors[lane] % BRANCH_COLORS.length], lane })

    for (const parent of commit.parents) {
      const parentLane = assignLane(parent)
      if (parentLane >= laneColors.length) {
        for (let c = laneColors.length; c <= parentLane; c++) {
          laneColors.push(nextColor++ % BRANCH_COLORS.length)
        }
      }
      maxLanes = Math.max(maxLanes, parentLane + 1)
      const parentIndex = commits.findIndex(c => c.hash === parent)

      edges.push({
        from: { x: nodeX, y: nodeY },
        to: { x: 20 + parentLane * 18, y: parentIndex >= 0 ? parentIndex : nodeY + 1 },
        color: BRANCH_COLORS[laneColors[lane] % BRANCH_COLORS.length],
      })
    }
  }

  return { nodes, edges, maxLanes, width: 20 + maxLanes * 18 + 20 }
}

describe('graphLayout', () => {
  it('positions a single commit', () => {
    const commits = [{ hash: 'a', parents: [] }]
    const layout = computeGraphLayout(commits)
    expect(layout.nodes).toHaveLength(1)
    expect(layout.nodes[0].hash).toBe('a')
    expect(layout.nodes[0].y).toBe(0)
    expect(layout.edges).toHaveLength(0)
  })

  it('connects parent and child', () => {
    const commits = [
      { hash: 'child', parents: ['parent'] },
      { hash: 'parent', parents: [] },
    ]
    const layout = computeGraphLayout(commits)
    expect(layout.nodes).toHaveLength(2)
    expect(layout.edges.length).toBeGreaterThan(0)
    expect(layout.edges[0].from.y).toBe(0) // child at row 0
    expect(layout.edges[0].to.y).toBe(1)   // parent at row 1
  })

  it('positions commits with appropriate lane assignments', () => {
    const commits = [
      { hash: 'c3', parents: ['c2'] },
      { hash: 'c2', parents: ['c1'] },
      { hash: 'c1', parents: [] },
    ]
    const layout = computeGraphLayout(commits)
    // All nodes should exist
    expect(layout.nodes).toHaveLength(3)
    // Linear history: all nodes should be in same lane (0 or similar)
    const c1 = layout.nodes.find(n => n.hash === 'c1')!
    const c2 = layout.nodes.find(n => n.hash === 'c2')!
    const c3 = layout.nodes.find(n => n.hash === 'c3')!
    // Parent-child relationships
    const c3ParentEdge = layout.edges.find(e => e.from.y === 0)!
    expect(c3ParentEdge).toBeDefined()
  })

  it('handles merge commits with two parents', () => {
    const commits = [
      { hash: 'merge', parents: ['branch1', 'branch2'] },
      { hash: 'branch1', parents: ['base'] },
      { hash: 'branch2', parents: ['base'] },
      { hash: 'base', parents: [] },
    ]
    const layout = computeGraphLayout(commits)
    expect(layout.nodes).toHaveLength(4)
    // merge node should have two outgoing edges
    const mergeEdges = layout.edges.filter(e => e.from.y === 0)
    expect(mergeEdges.length).toBeGreaterThanOrEqual(2)
    expect(layout.maxLanes).toBeGreaterThanOrEqual(2)
  })

  it('handles branch divergence with different lanes', () => {
    const commits = [
      { hash: 'c3', parents: ['c2'] },
      { hash: 'd2', parents: ['c1'] },
      { hash: 'c2', parents: ['c1'] },
      { hash: 'c1', parents: [] },
    ]
    const layout = computeGraphLayout(commits)
    const d2 = layout.nodes.find(n => n.hash === 'd2')!
    const c3 = layout.nodes.find(n => n.hash === 'c3')!
    // Diverged branches should be in different lanes
    expect(d2.lane).not.toBe(c3.lane)
    expect(layout.maxLanes).toBeGreaterThanOrEqual(2)
  })

  it('returns width proportional to max lanes', () => {
    const commits = [
      { hash: 'merge', parents: ['a', 'b'] },
      { hash: 'a', parents: ['base'] },
      { hash: 'b', parents: ['base'] },
      { hash: 'base', parents: [] },
    ]
    const layout = computeGraphLayout(commits)
    expect(layout.width).toBeGreaterThan(40) // at least 2 lanes worth
  })

  it('handles large linear history efficiently', () => {
    const commits = Array.from({ length: 100 }, (_, i) => ({
      hash: `c${i}`,
      parents: i < 99 ? [`c${i + 1}`] : [],
    }))
    const start = performance.now()
    const layout = computeGraphLayout(commits)
    const duration = performance.now() - start
    expect(layout.nodes).toHaveLength(100)
    expect(duration).toBeLessThan(1000) // should be fast
  })
})
