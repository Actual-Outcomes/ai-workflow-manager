import React, { useCallback, useMemo, useState, useEffect, useRef } from 'react'
import ReactFlow, {
  Node,
  Edge,
  Background,
  Controls,
  MiniMap,
  addEdge,
  Connection,
  useNodesState,
  useEdgesState,
  NodeTypes,
  Handle,
  Position,
  useReactFlow,
  NodeResizer
} from 'reactflow'
import 'reactflow/dist/style.css'
import { WorkflowNode, WorkflowTransition } from '../../core/domain/workflows'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from './ui/alert-dialog'
import {
  ContextMenu,
  ContextMenuTrigger,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSeparator,
  ContextMenuShortcut,
} from './ui/context-menu'

interface WorkflowDesignerProps {
  draftId?: number
  nodes: WorkflowNode[]
  transitions: WorkflowTransition[]
  onSave?: (nodes: WorkflowNode[], transitions: WorkflowTransition[]) => void
  onNodeSelect?: (nodeId: string | null) => void
  selectedNodeId?: string | null
}


// Custom node components with professional styling
const handleStyle = {
  width: '14px',
  height: '14px',
  background: '#2a2a2a',
  border: '2px solid #555',
  borderRadius: '50%',
  cursor: 'pointer',
  transition: 'all 0.2s ease'
}

const nodeBaseStyle = {
  padding: '12px 18px',
  borderRadius: '6px',
  border: '1px solid #333',
  minWidth: '140px',
  textAlign: 'center',
  position: 'relative',
  boxShadow: '0 2px 8px rgba(0, 0, 0, 0.3)',
  transition: 'all 0.2s ease',
  fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
  fontSize: '13px',
  fontWeight: '500',
  cursor: 'pointer',
  width: '100%',
  height: '100%'
}

const StartNode = ({ data, selected }: { data: any; selected?: boolean }) => (
  <div style={{
    ...nodeBaseStyle,
    background: '#1a1a1a',
    borderColor: selected ? '#60a5fa' : '#3b82f6',
    borderWidth: selected ? '2px' : '1px',
    boxShadow: selected ? '0 0 0 2px rgba(59, 130, 246, 0.3), 0 2px 8px rgba(0, 0, 0, 0.3)' : '0 2px 8px rgba(0, 0, 0, 0.3)',
    color: '#3b82f6'
  }}>
    <NodeResizer
      color="#3b82f6"
      isVisible={selected}
      minWidth={120}
      minHeight={50}
    />
    <Handle 
      type="source" 
      position={Position.Bottom} 
      style={handleStyle}
    />
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', pointerEvents: 'none' }}>
      <span style={{ fontSize: '12px' }}>▶</span>
      <span>{data.label || ''}</span>
    </div>
  </div>
)

const ActionNode = ({ data, selected }: { data: any; selected?: boolean }) => (
  <div style={{
    ...nodeBaseStyle,
    background: '#1a1a1a',
    borderColor: selected ? '#a78bfa' : '#8b5cf6',
    borderWidth: selected ? '2px' : '1px',
    boxShadow: selected ? '0 0 0 2px rgba(139, 92, 246, 0.3), 0 2px 8px rgba(0, 0, 0, 0.3)' : '0 2px 8px rgba(0, 0, 0, 0.3)',
    color: '#c4b5fd'
  }}>
    <NodeResizer
      color="#8b5cf6"
      isVisible={selected}
      minWidth={120}
      minHeight={50}
    />
    <Handle 
      type="target" 
      position={Position.Top} 
      style={handleStyle}
    />
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', pointerEvents: 'none' }}>
      <span style={{ fontSize: '12px' }}>⚙</span>
      <span>{data.label || ''}</span>
    </div>
    <Handle 
      type="source" 
      position={Position.Bottom} 
      style={handleStyle}
    />
  </div>
)

const ConditionalNode = ({ data, selected }: { data: any; selected?: boolean }) => (
  <div style={{
    ...nodeBaseStyle,
    background: '#1a1a1a',
    borderColor: selected ? '#34d399' : '#10b981',
    borderWidth: selected ? '2px' : '1px',
    boxShadow: selected ? '0 0 0 2px rgba(16, 185, 129, 0.3), 0 2px 8px rgba(0, 0, 0, 0.3)' : '0 2px 8px rgba(0, 0, 0, 0.3)',
    color: '#6ee7b7',
    transform: 'rotate(45deg)',
    width: '100px',
    height: '100px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center'
  }}>
    <NodeResizer
      color="#10b981"
      isVisible={selected}
      minWidth={80}
      minHeight={80}
      maxWidth={200}
      maxHeight={200}
      keepAspectRatio={true}
    />
    <Handle 
      type="target" 
      position={Position.Top} 
      style={handleStyle}
    />
    <div style={{ transform: 'rotate(-45deg)', fontSize: '11px', fontWeight: '600', pointerEvents: 'none' }}>
      {data.label || ''}
    </div>
    <Handle 
      type="source" 
      position={Position.Bottom} 
      style={handleStyle}
    />
  </div>
)

const EndNode = ({ data, selected }: { data: any; selected?: boolean }) => (
  <div style={{
    ...nodeBaseStyle,
    background: '#1a1a1a',
    borderColor: selected ? '#f87171' : '#ef4444',
    borderWidth: selected ? '2px' : '1px',
    boxShadow: selected ? '0 0 0 2px rgba(239, 68, 68, 0.3), 0 2px 8px rgba(0, 0, 0, 0.3)' : '0 2px 8px rgba(0, 0, 0, 0.3)',
    color: '#fca5a5',
    borderRadius: '50%',
    width: '90px',
    height: '90px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 0
  }}>
    <NodeResizer
      color="#ef4444"
      isVisible={selected}
      minWidth={60}
      minHeight={60}
      maxWidth={150}
      maxHeight={150}
      keepAspectRatio={true}
    />
    <Handle 
      type="target" 
      position={Position.Top} 
      style={handleStyle}
    />
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px', pointerEvents: 'none' }}>
      <span style={{ fontSize: '12px' }}>■</span>
      <span style={{ fontSize: '11px' }}>{data.label || ''}</span>
    </div>
  </div>
)

const nodeTypes: NodeTypes = {
  start: StartNode,
  action: ActionNode,
  conditional: ConditionalNode,
  end: EndNode
}

export const WorkflowDesigner: React.FC<WorkflowDesignerProps> = ({
  draftId,
  nodes: initialNodes,
  transitions: initialTransitions,
  onSave,
  onNodeSelect,
  selectedNodeId
}) => {
  // Convert WorkflowNodes to ReactFlow Nodes
  const initialFlowNodes = useMemo(() => {
    if (!initialNodes || initialNodes.length === 0) {
      return []
    }
    console.log('Converting initial nodes:', initialNodes)
    return initialNodes.map((node, index) => ({
      id: node.id,
      type: node.type === 'start' ? 'start' : node.type === 'end' ? 'end' : node.type === 'conditional' ? 'conditional' : 'action',
      position: { x: 100 + (index % 3) * 250, y: 100 + Math.floor(index / 3) * 150 },
      data: { label: node.label || '', ...node }
    }))
  }, [initialNodes]) // Depend on initialNodes so it recomputes when they change

  // Convert WorkflowTransitions to ReactFlow Edges
  const initialFlowEdges = useMemo(() => {
    if (!initialTransitions || initialTransitions.length === 0) {
      return []
    }
    console.log('Converting initial transitions:', initialTransitions)
    return initialTransitions.map(transition => ({
      id: transition.id,
      source: transition.source,
      target: transition.target,
      type: 'smoothstep',
      animated: false,
      pathOptions: {
        offset: 0 // Reduce offset to make connectors shorter
      }
    }))
  }, [initialTransitions]) // Depend on initialTransitions so it recomputes when they change

  const [flowNodes, setNodes, onNodesChange] = useNodesState([])
  const [flowEdges, setEdges, onEdgesChange] = useEdgesState([])
  const [isSaving, setIsSaving] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [nodeToDelete, setNodeToDelete] = useState<string | null>(null)
  const [showDeleteEdgeConfirm, setShowDeleteEdgeConfirm] = useState(false)
  const [edgeToDelete, setEdgeToDelete] = useState<Edge | null>(null)
  const [selectedNodeIds, setSelectedNodeIds] = useState<Set<string>>(new Set())
  const [contextMenuNode, setContextMenuNode] = useState<Node | null>(null)
  const [contextMenuEdge, setContextMenuEdge] = useState<Edge | null>(null)
  const [contextMenuPosition, setContextMenuPosition] = useState<{ x: number; y: number } | null>(null)
  const [panelWidth, setPanelWidth] = useState(400) // Default panel width
  const [isPanelPinned, setIsPanelPinned] = useState(false) // Panel stays open when pinned
  const [isResizing, setIsResizing] = useState(false)
  const shouldDeleteRef = useRef(false)
  const isDeletingRef = useRef(false)
  const clipboardRef = useRef<Node | null>(null)

  const nodePositionsRef = useRef<Map<string, { x: number; y: number }>>(new Map())
  const reactFlowInstance = useRef<any>(null)
  const currentSelectionRef = useRef<Set<string>>(new Set())
  const resizeStartXRef = useRef<number>(0)
  const resizeStartWidthRef = useRef<number>(400)

  // Sync nodes/edges when props change - this is the source of truth
  useEffect(() => {
    // Skip sync if we're in the middle of a deletion to prevent conflicts
    // But only skip for a short time to avoid blocking forever
    if (isDeletingRef.current) {
      console.log('Skipping sync - deletion in progress')
      // Set a timeout to allow sync after deletion completes
      const timeoutId = setTimeout(() => {
        if (isDeletingRef.current) {
          console.warn('Deletion flag still set after timeout, clearing it')
          isDeletingRef.current = false
        }
      }, 1000)
      return () => clearTimeout(timeoutId)
    }

    console.log('Props changed - syncing nodes/edges:', { 
      nodeCount: initialNodes.length, 
      transitionCount: initialTransitions.length
    })

    // Convert props to ReactFlow format
    if (initialNodes.length > 0 || initialTransitions.length > 0) {
      const newNodes = initialNodes.map((node, index) => {
        // Prefer current position from ref (most recent), then metadata, then default
        // This prevents overwriting positions that were just moved but not yet saved
        const currentPosition = nodePositionsRef.current.get(node.id)
        const savedPosition = currentPosition || 
                              (node.metadata?.position as { x: number; y: number } | undefined) ||
                              { x: 100 + (index % 3) * 250, y: 100 + Math.floor(index / 3) * 150 }
        
        // Load dimensions from metadata if available
        const savedDimensions = (node.metadata?.dimensions as { width: number; height: number } | undefined)
        
        // Preserve selection state - check if node is in current selection or matches selectedNodeId
        const isSelected = currentSelectionRef.current.has(node.id) || node.id === selectedNodeId
        
        return {
          id: node.id,
          type: node.type === 'start' ? 'start' : node.type === 'end' ? 'end' : node.type === 'conditional' ? 'conditional' : 'action',
          position: savedPosition,
          width: savedDimensions?.width,
          height: savedDimensions?.height,
          selected: isSelected, // Preserve selection state
          data: { 
            label: node.label || '', 
            ...node,
            metadata: node.metadata // Preserve all metadata
          }
        }
      })
      console.log('Setting nodes:', newNodes)
      setNodes(newNodes)

      const newEdges = initialTransitions.map(transition => ({
        id: transition.id,
        source: transition.source,
        target: transition.target,
        type: 'smoothstep',
        animated: false,
        pathOptions: {
          offset: 0 // Reduce offset to make connectors shorter
        }
      }))
      console.log('Setting edges:', newEdges)
      setEdges(newEdges)
    } else {
      // Clear if props are empty
      console.log('Clearing nodes/edges - props are empty')
      setNodes([])
      setEdges([])
      nodePositionsRef.current.clear()
    }
  }, [initialNodes, initialTransitions, setNodes, setEdges, selectedNodeId])

  // Save node positions when they change (from user dragging)
  useEffect(() => {
    let hasPositionChanges = false
    flowNodes.forEach(node => {
      if (node.position) {
        const oldPosition = nodePositionsRef.current.get(node.id)
        // Check if position actually changed
        if (!oldPosition || oldPosition.x !== node.position.x || oldPosition.y !== node.position.y) {
          hasPositionChanges = true
        }
        nodePositionsRef.current.set(node.id, node.position)
      }
      // Track current selection
      if (node.selected) {
        currentSelectionRef.current.add(node.id)
      } else {
        currentSelectionRef.current.delete(node.id)
      }
    })
    
    // Auto-save positions after a short delay (debounced)
    if (hasPositionChanges && onSave) {
      const timeoutId = setTimeout(() => {
        const workflowNodes = flowNodes.map(n => {
          let nodeType = 'action'
          if (n.type === 'start') nodeType = 'start'
          else if (n.type === 'end') nodeType = 'end'
          else if (n.type === 'conditional') nodeType = 'conditional'
          else if (n.data?.type) nodeType = n.data.type
          
          return {
            id: n.id,
            type: nodeType,
            label: n.data?.label || '',
            entryActions: n.data?.entryActions || [],
            exitActions: n.data?.exitActions || [],
            metadata: {
              ...(n.data?.metadata || {}),
              position: n.position, // Save current position in metadata
              dimensions: n.width && n.height ? { width: n.width, height: n.height } : undefined
            }
          }
        })
        const workflowTransitions = flowEdges.map(e => ({
          id: e.id,
          source: e.source,
          target: e.target
        }))
        onSave(workflowNodes, workflowTransitions)
      }, 500) // Debounce: save 500ms after last position change
      
      return () => clearTimeout(timeoutId)
    }
  }, [flowNodes, onSave, flowEdges])

  // Highlight selected node
  useEffect(() => {
    setNodes(nodes => nodes.map(node => ({
      ...node,
      selected: node.id === selectedNodeId
    })))
  }, [selectedNodeId, setNodes])

  const onConnect = useCallback(
    (params: Connection) => {
      if (!params.source || !params.target) return
      
      const newEdge = {
        id: `edge-${params.source}-${params.target}`,
        source: params.source,
        target: params.target,
        type: 'smoothstep',
        pathOptions: {
          radius: 0 // Remove corner radius to make connectors more direct and shorter
        }
      }
      
      setEdges((eds) => addEdge(newEdge, eds))
      
      // Convert to WorkflowTransition and save
      if (onSave) {
        const newTransition: WorkflowTransition = {
          id: newEdge.id,
          source: params.source,
          target: params.target
        }
        const workflowNodes = flowNodes.map(n => {
          let nodeType = 'action'
          if (n.type === 'start') nodeType = 'start'
          else if (n.type === 'end') nodeType = 'end'
          else if (n.type === 'conditional') nodeType = 'conditional'
          else if (n.data?.type) nodeType = n.data.type
          
          return {
            id: n.id,
            type: nodeType,
            label: n.data?.label || '',
            entryActions: n.data?.entryActions || [],
            exitActions: n.data?.exitActions || [],
            metadata: {
              ...(n.data?.metadata || {}),
              position: n.position, // Save position in metadata
              dimensions: n.width && n.height ? { width: n.width, height: n.height } : undefined // Save dimensions in metadata
            }
          }
        })
        const workflowTransitions = [...flowEdges, newEdge].map(e => ({
          id: e.id,
          source: e.source,
          target: e.target
        }))
        onSave(workflowNodes, workflowTransitions)
      }
    },
    [flowNodes, flowEdges, onSave, setEdges]
  )

  const handleSave = useCallback(() => {
    if (!onSave) return
    
    setIsSaving(true)
    const workflowNodes = flowNodes.map(n => {
      // Map ReactFlow node type to WorkflowNode type
      let nodeType = 'action'
      if (n.type === 'start') nodeType = 'start'
      else if (n.type === 'end') nodeType = 'end'
      else if (n.type === 'conditional') nodeType = 'conditional'
      else if (n.data?.type) nodeType = n.data.type
      
      return {
        id: n.id,
        type: nodeType,
        label: n.data?.label || '',
        entryActions: n.data?.entryActions || [],
        exitActions: n.data?.exitActions || [],
        metadata: {
          ...(n.data?.metadata || {}),
          position: n.position // Save position in metadata
        }
      }
    })
    const workflowTransitions = flowEdges.map(e => ({
      id: e.id,
      source: e.source,
      target: e.target
    }))
    
    console.log('Saving workflow:', { nodes: workflowNodes, transitions: workflowTransitions })
    onSave(workflowNodes, workflowTransitions)
    setTimeout(() => setIsSaving(false), 500)
  }, [flowNodes, flowEdges, onSave])

  const onNodeClick = useCallback((event: React.MouseEvent, node: Node) => {
    if (onNodeSelect) {
      onNodeSelect(node.id)
    }
  }, [onNodeSelect])

  const onNodeDragStart = useCallback((event: React.MouseEvent, node: Node) => {
    // Select node when dragging starts
    if (onNodeSelect) {
      onNodeSelect(node.id)
    }
    // Also update ReactFlow selection state
    setNodes(nodes => nodes.map(n => ({
      ...n,
      selected: n.id === node.id
    })))
    setSelectedNodeIds(new Set([node.id]))
  }, [onNodeSelect, setNodes])

  const onNodeContextMenu = useCallback((event: React.MouseEvent, node: Node) => {
    event.preventDefault()
    setContextMenuNode(node)
    setContextMenuEdge(null)
    setContextMenuPosition({ x: event.clientX, y: event.clientY })
  }, [])

  const onEdgeContextMenu = useCallback((event: React.MouseEvent, edge: Edge) => {
    event.preventDefault()
    setContextMenuEdge(edge)
    setContextMenuNode(null)
    setContextMenuPosition({ x: event.clientX, y: event.clientY })
  }, [])

  const handleDeleteClick = useCallback((nodeId: string) => {
    setNodeToDelete(nodeId)
    setShowDeleteConfirm(true)
  }, [])

  const deleteNode = useCallback((nodeId: string) => {
    // Set deletion flag to prevent sync conflicts
    isDeletingRef.current = true
    
    // Remove the node immediately - update UI first
    const updatedNodes = flowNodes.filter(n => n.id !== nodeId)
    const updatedEdges = flowEdges.filter(e => e.source !== nodeId && e.target !== nodeId)
    
    // Update state immediately for responsive UI
    setNodes(updatedNodes)
    setEdges(updatedEdges)
    onNodeSelect?.(null)
    
    // Clear deletion flag after UI updates
    setTimeout(() => {
      isDeletingRef.current = false
    }, 500)
    
    // Auto-save - completely fire and forget, no blocking
    if (onSave) {
      // Use a longer delay to ensure UI is fully updated and responsive
      setTimeout(() => {
        const workflowNodes = updatedNodes.map(n => {
          let nodeType = 'action'
          if (n.type === 'start') nodeType = 'start'
          else if (n.type === 'end') nodeType = 'end'
          else if (n.type === 'conditional') nodeType = 'conditional'
          else if (n.data?.type) nodeType = n.data.type
          
          return {
            id: n.id,
            type: nodeType,
            label: n.data?.label || '',
            entryActions: n.data?.entryActions || [],
            exitActions: n.data?.exitActions || [],
            metadata: {
              ...(n.data?.metadata || {}),
              position: n.position
            }
          }
        })
        const workflowTransitions = updatedEdges.map(e => ({
          id: e.id,
          source: e.source,
          target: e.target
        }))
        
        // Fire and forget - wrap in Promise to ensure it doesn't block
        // Don't await, don't catch synchronously
        const savePromise = onSave(workflowNodes, workflowTransitions)
        if (savePromise && typeof savePromise.then === 'function') {
          savePromise.catch((error) => {
            console.error('Failed to save after node deletion:', error)
          })
        }
      }, 200) // Longer delay to ensure UI is responsive
    }
  }, [flowNodes, flowEdges, onSave, onNodeSelect, setNodes, setEdges])

  // Handle selection changes from React Flow
  const onSelectionChange = useCallback((params: { nodes: Node[]; edges: Edge[] }) => {
    const selectedIds = new Set(params.nodes.map(n => n.id))
    setSelectedNodeIds(selectedIds)
    
    // Update single selection for property panel (use first selected or null)
    if (params.nodes.length === 1) {
      onNodeSelect?.(params.nodes[0].id)
    } else if (params.nodes.length === 0) {
      onNodeSelect?.(null)
    }
    // If multiple selected, keep the first one selected for property panel
    // (or we could show a "multiple selected" message)
  }, [onNodeSelect])

  // Get node dimensions based on type (matching our node component styles)
  const getNodeDimensions = useCallback((node: Node): { width: number; height: number } => {
    if (node.type === 'conditional') {
      return { width: 100, height: 100 } // Square
    } else if (node.type === 'end') {
      return { width: 90, height: 90 } // Circle
    } else {
      return { width: 140, height: 60 } // Default rectangular nodes
    }
  }, [])

  // Alignment functions
  const alignNodes = useCallback((alignment: 'left' | 'center' | 'right' | 'top' | 'middle' | 'bottom') => {
    if (selectedNodeIds.size < 2) return

    const selectedNodes = flowNodes.filter(n => selectedNodeIds.has(n.id))
    if (selectedNodes.length < 2) return

    let updatedNodes: Node[]

    if (alignment === 'left') {
      const leftmostX = Math.min(...selectedNodes.map(n => n.position.x))
      updatedNodes = flowNodes.map(n => 
        selectedNodeIds.has(n.id) 
          ? { ...n, position: { ...n.position, x: leftmostX } }
          : n
      )
    } else if (alignment === 'right') {
      // Calculate rightmost edge considering node widths
      const rightmostX = Math.max(...selectedNodes.map(n => {
        const dims = getNodeDimensions(n)
        return n.position.x + dims.width
      }))
      updatedNodes = flowNodes.map(n => {
        if (!selectedNodeIds.has(n.id)) return n
        const dims = getNodeDimensions(n)
        return { ...n, position: { ...n.position, x: rightmostX - dims.width } }
      })
    } else if (alignment === 'center') {
      // Calculate center based on bounding box of all selected nodes
      const minX = Math.min(...selectedNodes.map(n => n.position.x))
      const maxX = Math.max(...selectedNodes.map(n => {
        const dims = getNodeDimensions(n)
        return n.position.x + dims.width
      }))
      const centerX = (minX + maxX) / 2
      updatedNodes = flowNodes.map(n => {
        if (!selectedNodeIds.has(n.id)) return n
        const dims = getNodeDimensions(n)
        return { ...n, position: { ...n.position, x: centerX - (dims.width / 2) } }
      })
    } else if (alignment === 'top') {
      const topmostY = Math.min(...selectedNodes.map(n => n.position.y))
      updatedNodes = flowNodes.map(n => 
        selectedNodeIds.has(n.id) 
          ? { ...n, position: { ...n.position, y: topmostY } }
          : n
      )
    } else if (alignment === 'bottom') {
      // Calculate bottommost edge considering node heights
      const bottommostY = Math.max(...selectedNodes.map(n => {
        const dims = getNodeDimensions(n)
        return n.position.y + dims.height
      }))
      updatedNodes = flowNodes.map(n => {
        if (!selectedNodeIds.has(n.id)) return n
        const dims = getNodeDimensions(n)
        return { ...n, position: { ...n.position, y: bottommostY - dims.height } }
      })
    } else if (alignment === 'middle') {
      // Calculate middle based on bounding box of all selected nodes
      const minY = Math.min(...selectedNodes.map(n => n.position.y))
      const maxY = Math.max(...selectedNodes.map(n => {
        const dims = getNodeDimensions(n)
        return n.position.y + dims.height
      }))
      const middleY = (minY + maxY) / 2
      updatedNodes = flowNodes.map(n => {
        if (!selectedNodeIds.has(n.id)) return n
        const dims = getNodeDimensions(n)
        return { ...n, position: { ...n.position, y: middleY - (dims.height / 2) } }
      })
    } else {
      return
    }

    setNodes(updatedNodes)

    // Auto-save after alignment
    if (onSave) {
      setTimeout(() => {
        const workflowNodes = updatedNodes.map(n => {
          let nodeType = 'action'
          if (n.type === 'start') nodeType = 'start'
          else if (n.type === 'end') nodeType = 'end'
          else if (n.type === 'conditional') nodeType = 'conditional'
          else if (n.data?.type) nodeType = n.data.type
          
          return {
            id: n.id,
            type: nodeType,
            label: n.data?.label || '',
            entryActions: n.data?.entryActions || [],
            exitActions: n.data?.exitActions || [],
            metadata: {
              ...(n.data?.metadata || {}),
              position: n.position
            }
          }
        })
        const workflowTransitions = flowEdges.map(e => ({
          id: e.id,
          source: e.source,
          target: e.target
        }))
        onSave(workflowNodes, workflowTransitions)
      }, 200)
    }
  }, [selectedNodeIds, flowNodes, flowEdges, onSave, setNodes])

  // Handle keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Don't trigger shortcuts if user is typing in an input field
      const target = event.target as HTMLElement
      if (target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable)) {
        return
      }
      
      // Select All (Ctrl/Cmd + A)
      if ((event.ctrlKey || event.metaKey) && event.key === 'a') {
        event.preventDefault()
        const allNodeIds = flowNodes.map(n => n.id)
        setNodes(nodes => nodes.map(n => ({ ...n, selected: true })))
        setSelectedNodeIds(new Set(allNodeIds))
        return
      }
      
      // Escape - Deselect all
      if (event.key === 'Escape') {
        event.preventDefault()
        setNodes(nodes => nodes.map(n => ({ ...n, selected: false })))
        setSelectedNodeIds(new Set())
        onNodeSelect?.(null)
        return
      }
      
      // Delete/Backspace - Delete selected nodes
      if ((event.key === 'Delete' || event.key === 'Backspace')) {
        if (selectedNodeIds.size > 0) {
          event.preventDefault()
          // Delete all selected nodes (show confirmation for multiple)
          if (selectedNodeIds.size === 1) {
            const nodeId = Array.from(selectedNodeIds)[0]
            handleDeleteClick(nodeId)
          } else {
            // For multiple selection, delete the first one for now
            // TODO: Show confirmation dialog for multiple deletion
            const nodeId = Array.from(selectedNodeIds)[0]
            handleDeleteClick(nodeId)
          }
        } else if (selectedNodeId) {
          event.preventDefault()
          handleDeleteClick(selectedNodeId)
        }
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [selectedNodeId, selectedNodeIds, handleDeleteClick, flowNodes, setNodes, onNodeSelect])

  const addNode = useCallback((type: string) => {
    const newNodeId = `node-${Date.now()}`
    const labelMap: Record<string, string> = {
      'start': 'Start',
      'end': 'End',
      'conditional': 'If',
      'action': 'Action'
    }
    
    // Calculate center of visible viewport
    let position = { x: 400, y: 300 } // Default center
    if (reactFlowInstance.current) {
      const viewport = reactFlowInstance.current.getViewport()
      const bounds = reactFlowInstance.current.getViewport()
      // Get the center of the current viewport
      // viewport.x and viewport.y are the pan offsets, viewport.zoom is the zoom level
      // We need to calculate the center in flow coordinates
      const flowWidth = 1000 // Approximate flow width
      const flowHeight = 800 // Approximate flow height
      const centerX = -viewport.x / viewport.zoom + flowWidth / 2
      const centerY = -viewport.y / viewport.zoom + flowHeight / 2
      position = { x: centerX, y: centerY }
    }
    
    const newNode: Node = {
      id: newNodeId,
      type: type,
      position: position,
      data: { 
        label: labelMap[type] || 'Action',
        type: type, // Store type in data as well for persistence
        entryActions: [],
        exitActions: []
      }
    }
    
    setNodes((nds) => [...nds, newNode])
    
    // Auto-save
    if (onSave) {
      const workflowNodes = [...flowNodes, newNode].map(n => {
        let nodeType = 'action'
        if (n.type === 'start') nodeType = 'start'
        else if (n.type === 'end') nodeType = 'end'
        else if (n.type === 'conditional') nodeType = 'conditional'
        else if (n.data?.type) nodeType = n.data.type
        
        return {
          id: n.id,
          type: nodeType,
          label: n.data?.label || '',
          entryActions: n.data?.entryActions || [],
          exitActions: n.data?.exitActions || [],
          metadata: {
            ...(n.data?.metadata || {}),
            position: n.position // Save position in metadata
          }
        }
      })
      const workflowTransitions = flowEdges.map(e => ({
        id: e.id,
        source: e.source,
        target: e.target
      }))
      onSave(workflowNodes, workflowTransitions)
    }
  }, [flowNodes, flowEdges, onSave, setNodes])
  
  const onInit = useCallback((instance: any) => {
    reactFlowInstance.current = instance
  }, [])
  
  const onEdgeClick = useCallback((_event: React.MouseEvent, edge: Edge) => {
    // Select edge for potential deletion
    // In React Flow, edges can be deleted by selecting and pressing Delete
    // We'll handle this in the keyboard handler
  }, [])
  
  const onEdgeDoubleClick = useCallback((_event: React.MouseEvent, edge: Edge) => {
    // Show confirmation dialog for edge deletion
    setEdgeToDelete(edge)
    setShowDeleteEdgeConfirm(true)
  }, [])

  const confirmDeleteEdge = useCallback(() => {
    if (!edgeToDelete) return
    
    const updatedEdges = flowEdges.filter((e) => e.id !== edgeToDelete.id)
    setEdges(updatedEdges)
    
    // Auto-save
    if (onSave) {
      const workflowNodes = flowNodes.map(n => {
        let nodeType = 'action'
        if (n.type === 'start') nodeType = 'start'
        else if (n.type === 'end') nodeType = 'end'
        else if (n.type === 'conditional') nodeType = 'conditional'
        else if (n.data?.type) nodeType = n.data.type
        
        return {
          id: n.id,
          type: nodeType,
          label: n.data?.label || '',
          entryActions: n.data?.entryActions || [],
          exitActions: n.data?.exitActions || [],
          metadata: {
            ...(n.data?.metadata || {}),
            position: n.position
          }
        }
      })
      const workflowTransitions = updatedEdges.map(e => ({
        id: e.id,
        source: e.source,
        target: e.target
      }))
      onSave(workflowNodes, workflowTransitions)
    }
    
    setShowDeleteEdgeConfirm(false)
    setEdgeToDelete(null)
  }, [edgeToDelete, flowNodes, flowEdges, onSave, setEdges])

  const selectedNode = selectedNodeId ? flowNodes.find(n => n.id === selectedNodeId) : null
  const selectedWorkflowNode = selectedNodeId ? initialNodes.find(n => n.id === selectedNodeId) : null
  
  // Determine if panel should be visible
  const isPanelVisible = isPanelPinned || (selectedNode && selectedWorkflowNode)
  
  // Resize handlers
  const handleResizeStart = useCallback((e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsResizing(true)
    resizeStartXRef.current = e.clientX
    resizeStartWidthRef.current = panelWidth
  }, [panelWidth])
  
  useEffect(() => {
    if (!isResizing) return
    
    const handleMouseMove = (e: MouseEvent) => {
      const deltaX = resizeStartXRef.current - e.clientX // Inverted because we're resizing from the left
      const newWidth = Math.max(250, Math.min(800, resizeStartWidthRef.current + deltaX))
      setPanelWidth(newWidth)
    }
    
    const handleMouseUp = () => {
      setIsResizing(false)
    }
    
    document.addEventListener('mousemove', handleMouseMove)
    document.addEventListener('mouseup', handleMouseUp)
    
    return () => {
      document.removeEventListener('mousemove', handleMouseMove)
      document.removeEventListener('mouseup', handleMouseUp)
    }
  }, [isResizing])

  return (
    <div style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column' }}>
      {/* Toolbar */}
      <div style={{
        padding: '10px',
        background: '#1a1a1a',
        borderBottom: '1px solid #333',
        display: 'flex',
        gap: '10px',
        alignItems: 'center'
      }}>
        <button
          onClick={() => addNode('start')}
          style={{
            padding: '8px 16px',
            background: '#667eea',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
            fontSize: '14px'
          }}
        >
          + Start
        </button>
        <button
          onClick={() => addNode('action')}
          style={{
            padding: '8px 16px',
            background: '#f5576c',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
            fontSize: '14px'
          }}
        >
          + Action
        </button>
        <button
          onClick={() => addNode('conditional')}
          style={{
            padding: '8px 16px',
            background: '#4facfe',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
            fontSize: '14px'
          }}
        >
          + If
        </button>
        <button
          onClick={() => addNode('end')}
          style={{
            padding: '8px 16px',
            background: '#fa709a',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
            fontSize: '14px'
          }}
        >
          + End
        </button>
        {selectedNodeIds.size > 1 && (
          <>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '0 12px',
              background: '#2a2a2a',
              borderRadius: '4px',
              fontSize: '14px',
              color: '#ccc'
            }}>
              <span>{selectedNodeIds.size} selected</span>
            </div>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              padding: '4px',
              background: '#2a2a2a',
              borderRadius: '4px',
              border: '1px solid #444'
            }}>
              {/* Horizontal Alignment */}
              <button
                onClick={() => alignNodes('left')}
                title="Align Left"
                style={{
                  padding: '4px 8px',
                  background: 'transparent',
                  color: '#ccc',
                  border: 'none',
                  borderRadius: '2px',
                  cursor: 'pointer',
                  fontSize: '12px'
                }}
                onMouseOver={(e) => e.currentTarget.style.background = '#3a3a3a'}
                onMouseOut={(e) => e.currentTarget.style.background = 'transparent'}
              >
                ⬅
              </button>
              <button
                onClick={() => alignNodes('center')}
                title="Align Center (Horizontal)"
                style={{
                  padding: '4px 8px',
                  background: 'transparent',
                  color: '#ccc',
                  border: 'none',
                  borderRadius: '2px',
                  cursor: 'pointer',
                  fontSize: '12px'
                }}
                onMouseOver={(e) => e.currentTarget.style.background = '#3a3a3a'}
                onMouseOut={(e) => e.currentTarget.style.background = 'transparent'}
              >
                ↔
              </button>
              <button
                onClick={() => alignNodes('right')}
                title="Align Right"
                style={{
                  padding: '4px 8px',
                  background: 'transparent',
                  color: '#ccc',
                  border: 'none',
                  borderRadius: '2px',
                  cursor: 'pointer',
                  fontSize: '12px'
                }}
                onMouseOver={(e) => e.currentTarget.style.background = '#3a3a3a'}
                onMouseOut={(e) => e.currentTarget.style.background = 'transparent'}
              >
                ➡
              </button>
              <div style={{ width: '1px', height: '16px', background: '#444', margin: '0 4px' }} />
              {/* Vertical Alignment */}
              <button
                onClick={() => alignNodes('top')}
                title="Align Top"
                style={{
                  padding: '4px 8px',
                  background: 'transparent',
                  color: '#ccc',
                  border: 'none',
                  borderRadius: '2px',
                  cursor: 'pointer',
                  fontSize: '12px'
                }}
                onMouseOver={(e) => e.currentTarget.style.background = '#3a3a3a'}
                onMouseOut={(e) => e.currentTarget.style.background = 'transparent'}
              >
                ⬆
              </button>
              <button
                onClick={() => alignNodes('middle')}
                title="Align Middle (Vertical)"
                style={{
                  padding: '4px 8px',
                  background: 'transparent',
                  color: '#ccc',
                  border: 'none',
                  borderRadius: '2px',
                  cursor: 'pointer',
                  fontSize: '12px'
                }}
                onMouseOver={(e) => e.currentTarget.style.background = '#3a3a3a'}
                onMouseOut={(e) => e.currentTarget.style.background = 'transparent'}
              >
                ↕
              </button>
              <button
                onClick={() => alignNodes('bottom')}
                title="Align Bottom"
                style={{
                  padding: '4px 8px',
                  background: 'transparent',
                  color: '#ccc',
                  border: 'none',
                  borderRadius: '2px',
                  cursor: 'pointer',
                  fontSize: '12px'
                }}
                onMouseOver={(e) => e.currentTarget.style.background = '#3a3a3a'}
                onMouseOut={(e) => e.currentTarget.style.background = 'transparent'}
              >
                ⬇
              </button>
            </div>
          </>
        )}
      </div>

      {/* Main Content Area */}
      <div style={{ flex: 1, display: 'flex', background: '#0f0f0f', position: 'relative' }}>
        {/* React Flow Canvas */}
        <div style={{ 
          flex: isPanelVisible ? `0 0 calc(100% - ${panelWidth}px)` : '1', 
          background: '#0f0f0f',
          transition: isResizing ? 'none' : 'flex 0.2s ease'
        }}>
          <ReactFlow
            nodes={flowNodes}
            edges={flowEdges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onConnect={onConnect}
            onNodeClick={onNodeClick}
            onNodeDragStart={onNodeDragStart}
            onNodeContextMenu={onNodeContextMenu}
            onEdgeClick={onEdgeClick}
            onEdgeContextMenu={onEdgeContextMenu}
            onEdgeDoubleClick={onEdgeDoubleClick}
            onPaneClick={() => {
              setSelectedNodeIds(new Set())
              onNodeSelect?.(null)
            }}
            onPaneContextMenu={(e) => {
              // Close context menu if right-clicking on empty canvas
              setContextMenuNode(null)
              setContextMenuEdge(null)
              setContextMenuPosition(null)
            }}
            onSelectionChange={onSelectionChange}
            onInit={onInit}
            nodeTypes={nodeTypes}
            fitView
            edgesUpdatable={true}
            edgesFocusable={true}
            deleteKeyCode={null}
            nodesDraggable={true}
            nodesConnectable={true}
            selectNodesOnDrag={false}
            multiSelectionKeyCode={['Meta', 'Control']}
            selectionOnDrag={true}
          >
            <Background />
            <Controls />
            <MiniMap />
          </ReactFlow>
        </div>

        {/* Property Panel */}
        {isPanelVisible && (
          <div style={{
            width: `${panelWidth}px`,
            background: '#1a1a1a',
            borderLeft: '1px solid #333',
            display: 'flex',
            flexDirection: 'column',
            position: 'relative',
            transition: isResizing ? 'none' : 'width 0.2s ease'
          }}>
            {/* Resize Handle */}
            <div
              onMouseDown={handleResizeStart}
              style={{
                position: 'absolute',
                left: 0,
                top: 0,
                bottom: 0,
                width: '4px',
                cursor: 'ew-resize',
                background: isResizing ? '#3b82f6' : 'transparent',
                zIndex: 10,
                transition: 'background 0.2s ease'
              }}
              onMouseEnter={(e) => {
                if (!isResizing) {
                  e.currentTarget.style.background = '#3b82f6'
                }
              }}
              onMouseLeave={(e) => {
                if (!isResizing) {
                  e.currentTarget.style.background = 'transparent'
                }
              }}
              title="Drag to resize"
            />
            
            {/* Panel Content */}
            <div style={{
              flex: 1,
              padding: '20px',
              overflowY: 'auto',
              color: '#fff',
              display: 'flex',
              flexDirection: 'column'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                <h3 style={{ margin: 0, color: '#fff' }}>
                  {selectedNode && selectedWorkflowNode 
                    ? `Configure: ${selectedWorkflowNode.label || selectedNode.id}`
                    : 'Properties'
                  }
                </h3>
                <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                  <button
                    onClick={(e) => {
                      e.preventDefault()
                      e.stopPropagation()
                      setIsPanelPinned(!isPanelPinned)
                    }}
                    style={{
                      padding: '4px 8px',
                      background: isPanelPinned ? '#3b82f6' : 'transparent',
                      color: isPanelPinned ? '#fff' : '#ccc',
                      border: '1px solid',
                      borderColor: isPanelPinned ? '#3b82f6' : '#555',
                      borderRadius: '4px',
                      cursor: 'pointer',
                      fontSize: '12px',
                      transition: 'all 0.2s ease',
                      width: '24px',
                      height: '24px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}
                    onMouseOver={(e) => {
                      if (!isPanelPinned) {
                        e.currentTarget.style.background = '#3a3a3a'
                        e.currentTarget.style.borderColor = '#666'
                      }
                    }}
                    onMouseOut={(e) => {
                      if (!isPanelPinned) {
                        e.currentTarget.style.background = 'transparent'
                        e.currentTarget.style.borderColor = '#555'
                      }
                    }}
                    title={isPanelPinned ? 'Unpin panel' : 'Pin panel'}
                  >
                    📌
                  </button>
                  {!isPanelPinned && (
                    <button
                      onClick={(e) => {
                        e.preventDefault()
                        e.stopPropagation()
                        onNodeSelect?.(null)
                      }}
                      style={{
                        padding: '4px 8px',
                        background: 'transparent',
                        color: '#ccc',
                        border: 'none',
                        borderRadius: '4px',
                        cursor: 'pointer',
                        fontSize: '18px',
                        lineHeight: '1',
                        transition: 'all 0.2s ease',
                        width: '24px',
                        height: '24px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                      }}
                      onMouseOver={(e) => {
                        e.currentTarget.style.background = '#3a3a3a'
                        e.currentTarget.style.color = '#fff'
                      }}
                      onMouseOut={(e) => {
                        e.currentTarget.style.background = 'transparent'
                        e.currentTarget.style.color = '#ccc'
                      }}
                      title="Close panel"
                    >
                      ×
                    </button>
                  )}
                </div>
              </div>
              
              {selectedNode && selectedWorkflowNode ? (
                <>
                  {/* Node Label */}
            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', marginBottom: '8px', color: '#ccc', fontSize: '14px' }}>
                Node Label
              </label>
              <input
                type="text"
                value={selectedWorkflowNode.label || ''}
                onChange={(e) => {
                  const updatedNodes = flowNodes.map(n => 
                    n.id === selectedNode.id 
                      ? { ...n, data: { ...n.data, label: e.target.value } }
                      : n
                  )
                  setNodes(updatedNodes)
                  // Auto-save
                  if (onSave) {
                    const workflowNodes = updatedNodes.map(n => {
                      let nodeType = 'action'
                      if (n.type === 'start') nodeType = 'start'
                      else if (n.type === 'end') nodeType = 'end'
                      else if (n.type === 'conditional') nodeType = 'conditional'
                      else if (n.data?.type) nodeType = n.data.type
                      
                      return {
                        id: n.id,
                        type: nodeType,
                        label: n.data?.label || '',
                        entryActions: n.data?.entryActions || [],
                        exitActions: n.data?.exitActions || [],
                        metadata: {
                          ...(n.data?.metadata || {}),
                          position: n.position
                        }
                      }
                    })
                    onSave(workflowNodes, flowEdges.map(e => ({
                      id: e.id,
                      source: e.source,
                      target: e.target
                    })))
                  }
                }}
                style={{
                  width: '100%',
                  padding: '8px',
                  background: '#0a0a0a',
                  border: '1px solid #444',
                  borderRadius: '4px',
                  color: '#fff',
                  fontSize: '14px'
                }}
                placeholder="Enter node label"
              />
            </div>

            {/* Action Configuration for Action Nodes */}
            {selectedNode.type === 'action' && (
              <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', marginBottom: '8px', color: '#ccc', fontSize: '14px' }}>
                  Action Type
                </label>
                <select
                  value={(selectedWorkflowNode.entryActions[0]?.type || 'llm')}
                  onChange={(e) => {
                    const actionType = e.target.value
                    const newAction = {
                      id: `action-${Date.now()}`,
                      type: actionType,
                      config: actionType === 'llm' 
                        ? { prompt: '', outputVariable: 'llm_response' }
                        : actionType === 'document'
                        ? { name: '', format: 'markdown', content: '' }
                        : actionType === 'variable'
                        ? { variableName: '', value: '' }
                        : {}
                    }
                    const updatedNodes = flowNodes.map(n => 
                      n.id === selectedNode.id 
                        ? { 
                            ...n, 
                            selected: n.selected, // Preserve selection state
                            data: { 
                              ...n.data, 
                              entryActions: [newAction],
                              exitActions: n.data?.exitActions || []
                            } 
                          }
                        : n
                    )
                    setNodes(updatedNodes)
                    // Auto-save
                    if (onSave) {
                      const workflowNodes = updatedNodes.map(n => {
                        let nodeType = 'action'
                        if (n.type === 'start') nodeType = 'start'
                        else if (n.type === 'end') nodeType = 'end'
                        else if (n.type === 'conditional') nodeType = 'conditional'
                        else if (n.data?.type) nodeType = n.data.type
                        
                        return {
                          id: n.id,
                          type: nodeType,
                          label: n.data?.label || '',
                          entryActions: n.data?.entryActions || [],
                          exitActions: n.data?.exitActions || [],
                          metadata: {
                            ...(n.data?.metadata || {}),
                            position: n.position
                          }
                        }
                      })
                      onSave(workflowNodes, flowEdges.map(e => ({
                        id: e.id,
                        source: e.source,
                        target: e.target
                      })))
                    }
                  }}
                  style={{
                    width: '100%',
                    padding: '8px',
                    background: '#0a0a0a',
                    border: '1px solid #444',
                    borderRadius: '4px',
                    color: '#fff',
                    fontSize: '14px'
                  }}
                >
                  <option value="llm">LLM Chat</option>
                  <option value="document">Generate Document</option>
                  <option value="variable">Set Variable</option>
                </select>

                {/* LLM Action Config */}
                {selectedWorkflowNode.entryActions[0]?.type === 'llm' && (
                  <div style={{ marginTop: '15px' }}>
                    <label style={{ display: 'block', marginBottom: '8px', color: '#ccc', fontSize: '14px' }}>
                      Prompt
                    </label>
                    <textarea
                      value={(selectedNode?.data?.entryActions?.[0]?.config?.prompt as string) || (selectedWorkflowNode.entryActions[0]?.config?.prompt as string) || ''}
                      onChange={(e) => {
                        const updatedNodes = flowNodes.map(n => {
                          if (n.id === selectedNodeId && n.data?.entryActions?.[0]) {
                            return {
                              ...n,
                              data: {
                                ...n.data,
                                entryActions: [{
                                  ...n.data.entryActions[0],
                                  config: {
                                    ...n.data.entryActions[0].config,
                                    prompt: e.target.value
                                  }
                                }]
                              }
                            }
                          }
                          return n
                        })
                        setNodes(updatedNodes)
                        // Auto-save
                        if (onSave) {
                          const workflowNodes = updatedNodes.map(n => {
                            let nodeType = 'action'
                            if (n.type === 'start') nodeType = 'start'
                            else if (n.type === 'end') nodeType = 'end'
                            else if (n.type === 'conditional') nodeType = 'conditional'
                            else if (n.data?.type) nodeType = n.data.type
                            
                            return {
                              id: n.id,
                              type: nodeType,
                              label: n.data?.label || '',
                              entryActions: n.data?.entryActions || [],
                              exitActions: n.data?.exitActions || [],
                              metadata: {
                                ...(n.data?.metadata || {}),
                                position: n.position
                              }
                            }
                          })
                          const workflowTransitions = flowEdges.map(e => ({
                            id: e.id,
                            source: e.source,
                            target: e.target
                          }))
                          onSave(workflowNodes, workflowTransitions)
                        }
                      }}
                      style={{
                        width: '100%',
                        padding: '8px',
                        background: '#0a0a0a',
                        border: '1px solid #444',
                        borderRadius: '4px',
                        color: '#fff',
                        fontSize: '14px',
                        minHeight: '100px',
                        fontFamily: 'inherit'
                      }}
                      placeholder="Enter your prompt here..."
                    />
                    <label style={{ display: 'block', marginTop: '12px', marginBottom: '8px', color: '#ccc', fontSize: '14px' }}>
                      Output Variable Name
                    </label>
                    <input
                      type="text"
                      value={(selectedNode?.data?.entryActions?.[0]?.config?.outputVariable as string) || (selectedWorkflowNode.entryActions[0]?.config?.outputVariable as string) || 'llm_response'}
                      onChange={(e) => {
                        const updatedNodes = flowNodes.map(n => {
                          if (n.id === selectedNodeId && n.data?.entryActions?.[0]) {
                            return {
                              ...n,
                              data: {
                                ...n.data,
                                entryActions: [{
                                  ...n.data.entryActions[0],
                                  config: {
                                    ...n.data.entryActions[0].config,
                                    outputVariable: e.target.value
                                  }
                                }]
                              }
                            }
                          }
                          return n
                        })
                        setNodes(updatedNodes)
                        // Auto-save
                        if (onSave) {
                          const workflowNodes = updatedNodes.map(n => {
                            let nodeType = 'action'
                            if (n.type === 'start') nodeType = 'start'
                            else if (n.type === 'end') nodeType = 'end'
                            else if (n.type === 'conditional') nodeType = 'conditional'
                            else if (n.data?.type) nodeType = n.data.type
                            
                            return {
                              id: n.id,
                              type: nodeType,
                              label: n.data?.label || '',
                              entryActions: n.data?.entryActions || [],
                              exitActions: n.data?.exitActions || [],
                              metadata: {
                                ...(n.data?.metadata || {}),
                                position: n.position
                              }
                            }
                          })
                          onSave(workflowNodes, flowEdges.map(e => ({
                            id: e.id,
                            source: e.source,
                            target: e.target
                          })))
                        }
                      }}
                      style={{
                        width: '100%',
                        padding: '8px',
                        background: '#0a0a0a',
                        border: '1px solid #444',
                        borderRadius: '4px',
                        color: '#fff',
                        fontSize: '14px'
                      }}
                      placeholder="llm_response"
                    />
                  </div>
                )}

                {/* Document Action Config */}
                {selectedWorkflowNode.entryActions[0]?.type === 'document' && (
                  <div style={{ marginTop: '15px' }}>
                    <label style={{ display: 'block', marginBottom: '8px', color: '#ccc', fontSize: '14px' }}>
                      Document Name
                    </label>
                    <input
                      type="text"
                      value={(selectedNode?.data?.entryActions?.[0]?.config?.name as string) || (selectedWorkflowNode.entryActions[0]?.config?.name as string) || ''}
                      onChange={(e) => {
                        const updatedNodes = flowNodes.map(n => {
                          if (n.id === selectedNodeId && n.data?.entryActions?.[0]) {
                            return {
                              ...n,
                              data: {
                                ...n.data,
                                entryActions: [{
                                  ...n.data.entryActions[0],
                                  config: {
                                    ...n.data.entryActions[0].config,
                                    name: e.target.value
                                  }
                                }]
                              }
                            }
                          }
                          return n
                        })
                        setNodes(updatedNodes)
                        // Auto-save
                        if (onSave) {
                          const workflowNodes = updatedNodes.map(n => {
                            let nodeType = 'action'
                            if (n.type === 'start') nodeType = 'start'
                            else if (n.type === 'end') nodeType = 'end'
                            else if (n.type === 'conditional') nodeType = 'conditional'
                            else if (n.data?.type) nodeType = n.data.type
                            
                            return {
                              id: n.id,
                              type: nodeType,
                              label: n.data?.label || '',
                              entryActions: n.data?.entryActions || [],
                              exitActions: n.data?.exitActions || [],
                              metadata: {
                                ...(n.data?.metadata || {}),
                                position: n.position
                              }
                            }
                          })
                          const workflowTransitions = flowEdges.map(e => ({
                            id: e.id,
                            source: e.source,
                            target: e.target
                          }))
                          onSave(workflowNodes, workflowTransitions)
                        }
                      }}
                      style={{
                        width: '100%',
                        padding: '8px',
                        background: '#0a0a0a',
                        border: '1px solid #444',
                        borderRadius: '4px',
                        color: '#fff',
                        fontSize: '14px'
                      }}
                      placeholder="document-name"
                    />
                    <label style={{ display: 'block', marginTop: '12px', marginBottom: '8px', color: '#ccc', fontSize: '14px' }}>
                      Format
                    </label>
                    <select
                      value={(selectedNode?.data?.entryActions?.[0]?.config?.format as string) || (selectedWorkflowNode.entryActions[0]?.config?.format as string) || 'markdown'}
                      onChange={(e) => {
                        const updatedNodes = flowNodes.map(n => {
                          if (n.id === selectedNodeId && n.data?.entryActions?.[0]) {
                            return {
                              ...n,
                              data: {
                                ...n.data,
                                entryActions: [{
                                  ...n.data.entryActions[0],
                                  config: {
                                    ...n.data.entryActions[0].config,
                                    format: e.target.value
                                  }
                                }]
                              }
                            }
                          }
                          return n
                        })
                        setNodes(updatedNodes)
                        // Auto-save
                        if (onSave) {
                          const workflowNodes = updatedNodes.map(n => {
                            let nodeType = 'action'
                            if (n.type === 'start') nodeType = 'start'
                            else if (n.type === 'end') nodeType = 'end'
                            else if (n.type === 'conditional') nodeType = 'conditional'
                            else if (n.data?.type) nodeType = n.data.type
                            
                            return {
                              id: n.id,
                              type: nodeType,
                              label: n.data?.label || '',
                              entryActions: n.data?.entryActions || [],
                              exitActions: n.data?.exitActions || [],
                              metadata: {
                                ...(n.data?.metadata || {}),
                                position: n.position
                              }
                            }
                          })
                          onSave(workflowNodes, flowEdges.map(e => ({
                            id: e.id,
                            source: e.source,
                            target: e.target
                          })))
                        }
                      }}
                      style={{
                        width: '100%',
                        padding: '8px',
                        background: '#0a0a0a',
                        border: '1px solid #444',
                        borderRadius: '4px',
                        color: '#fff',
                        fontSize: '14px'
                      }}
                    >
                      <option value="markdown">Markdown</option>
                      <option value="docx">Word (DOCX)</option>
                      <option value="pdf">PDF</option>
                    </select>
                  </div>
                )}

                {/* Variable Action Config */}
                {selectedWorkflowNode.entryActions[0]?.type === 'variable' && (
                  <div style={{ marginTop: '15px' }}>
                    <label style={{ display: 'block', marginBottom: '8px', color: '#ccc', fontSize: '14px' }}>
                      Variable Name
                    </label>
                    <input
                      type="text"
                      value={(selectedNode?.data?.entryActions?.[0]?.config?.variableName as string) || (selectedWorkflowNode.entryActions[0]?.config?.variableName as string) || ''}
                      onChange={(e) => {
                        const updatedNodes = flowNodes.map(n => {
                          if (n.id === selectedNodeId && n.data?.entryActions?.[0]) {
                            return {
                              ...n,
                              data: {
                                ...n.data,
                                entryActions: [{
                                  ...n.data.entryActions[0],
                                  config: {
                                    ...n.data.entryActions[0].config,
                                    variableName: e.target.value
                                  }
                                }]
                              }
                            }
                          }
                          return n
                        })
                        setNodes(updatedNodes)
                        // Auto-save
                        if (onSave) {
                          const workflowNodes = updatedNodes.map(n => {
                            let nodeType = 'action'
                            if (n.type === 'start') nodeType = 'start'
                            else if (n.type === 'end') nodeType = 'end'
                            else if (n.type === 'conditional') nodeType = 'conditional'
                            else if (n.data?.type) nodeType = n.data.type
                            
                            return {
                              id: n.id,
                              type: nodeType,
                              label: n.data?.label || '',
                              entryActions: n.data?.entryActions || [],
                              exitActions: n.data?.exitActions || [],
                              metadata: {
                                ...(n.data?.metadata || {}),
                                position: n.position
                              }
                            }
                          })
                          const workflowTransitions = flowEdges.map(e => ({
                            id: e.id,
                            source: e.source,
                            target: e.target
                          }))
                          onSave(workflowNodes, workflowTransitions)
                        }
                      }}
                      style={{
                        width: '100%',
                        padding: '8px',
                        background: '#0a0a0a',
                        border: '1px solid #444',
                        borderRadius: '4px',
                        color: '#fff',
                        fontSize: '14px'
                      }}
                      placeholder="variable_name"
                    />
                    <label style={{ display: 'block', marginTop: '12px', marginBottom: '8px', color: '#ccc', fontSize: '14px' }}>
                      Value
                    </label>
                    <input
                      type="text"
                      value={(selectedNode?.data?.entryActions?.[0]?.config?.value as string) || (selectedWorkflowNode.entryActions[0]?.config?.value as string) || ''}
                      onChange={(e) => {
                        const updatedNodes = flowNodes.map(n => {
                          if (n.id === selectedNodeId && n.data?.entryActions?.[0]) {
                            return {
                              ...n,
                              data: {
                                ...n.data,
                                entryActions: [{
                                  ...n.data.entryActions[0],
                                  config: {
                                    ...n.data.entryActions[0].config,
                                    value: e.target.value
                                  }
                                }]
                              }
                            }
                          }
                          return n
                        })
                        setNodes(updatedNodes)
                        // Auto-save
                        if (onSave) {
                          const workflowNodes = updatedNodes.map(n => {
                            let nodeType = 'action'
                            if (n.type === 'start') nodeType = 'start'
                            else if (n.type === 'end') nodeType = 'end'
                            else if (n.type === 'conditional') nodeType = 'conditional'
                            else if (n.data?.type) nodeType = n.data.type
                            
                            return {
                              id: n.id,
                              type: nodeType,
                              label: n.data?.label || '',
                              entryActions: n.data?.entryActions || [],
                              exitActions: n.data?.exitActions || [],
                              metadata: {
                                ...(n.data?.metadata || {}),
                                position: n.position
                              }
                            }
                          })
                          const workflowTransitions = flowEdges.map(e => ({
                            id: e.id,
                            source: e.source,
                            target: e.target
                          }))
                          onSave(workflowNodes, workflowTransitions)
                        }
                      }}
                      style={{
                        width: '100%',
                        padding: '8px',
                        background: '#0a0a0a',
                        border: '1px solid #444',
                        borderRadius: '4px',
                        color: '#fff',
                        fontSize: '14px'
                      }}
                      placeholder="variable value"
                    />
                  </div>
                )}
              </div>
            )}

            {/* Conditional Node Config */}
            {selectedNode.type === 'conditional' && (
              <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', marginBottom: '8px', color: '#ccc', fontSize: '14px' }}>
                  Condition (JavaScript expression)
                </label>
                <textarea
                  value={(selectedWorkflowNode.metadata?.condition as string) || ''}
                  onChange={(e) => {
                    const updatedNodes = flowNodes.map(n => 
                      n.id === selectedNode.id 
                        ? { 
                            ...n, 
                            data: { 
                              ...n.data, 
                              metadata: {
                                ...(n.data?.metadata || {}),
                                condition: e.target.value
                              }
                            } 
                          }
                        : n
                    )
                    setNodes(updatedNodes)
                  }}
                  style={{
                    width: '100%',
                    padding: '8px',
                    background: '#0a0a0a',
                    border: '1px solid #444',
                    borderRadius: '4px',
                    color: '#fff',
                    fontSize: '14px',
                    minHeight: '80px',
                    fontFamily: 'monospace'
                  }}
                  placeholder="e.g., variables.status === 'active'"
                />
                <small style={{ color: '#888', fontSize: '12px', display: 'block', marginTop: '4px' }}>
                  Use variables from the workflow context (e.g., variables.status, variables.count)
                </small>
              </div>
            )}

            <button
              onClick={(e) => {
                e.preventDefault()
                e.stopPropagation()
                handleDeleteClick(selectedNode.id)
              }}
              style={{
                width: '100%',
                padding: '10px',
                background: '#ef4444',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
                fontSize: '14px',
                marginTop: '20px',
                transition: 'all 0.2s ease'
              }}
              onMouseOver={(e) => {
                e.currentTarget.style.background = '#dc2626'
              }}
              onMouseOut={(e) => {
                e.currentTarget.style.background = '#ef4444'
              }}
              title="Delete node (or press Delete/Backspace)"
            >
              Delete Node
            </button>
                </>
              ) : (
                <div style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'center', 
                  flex: 1,
                  color: '#888',
                  fontSize: '14px'
                }}>
                  No node selected
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Confirmation Modal - Always render, control visibility with open prop */}
      {showDeleteConfirm && (
        <AlertDialog 
          open={true}
          onOpenChange={(open) => {
            if (!open) {
              // User clicked outside or pressed Escape - just cancel
              setShowDeleteConfirm(false)
              setNodeToDelete(null)
              shouldDeleteRef.current = false
              isDeletingRef.current = false
            }
          }}
        >
          <AlertDialogContent style={{ zIndex: 9999 }}>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete Node</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to delete "{nodeToDelete && selectedNode && selectedWorkflowNode ? (selectedWorkflowNode.label || selectedNode.id) : nodeToDelete || 'this node'}"? This will also remove all connections to this node.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel
                onClick={() => {
                  setShowDeleteConfirm(false)
                  setNodeToDelete(null)
                }}
              >
                Cancel
              </AlertDialogCancel>
              <AlertDialogAction
                onClick={(e) => {
                  e.preventDefault()
                  e.stopPropagation()
                  if (nodeToDelete) {
                    const nodeId = nodeToDelete
                    // Close dialog immediately
                    setShowDeleteConfirm(false)
                    setNodeToDelete(null)
                    
                    // Delete after dialog animation completes
                    // Use requestAnimationFrame to ensure dialog closes first
                    requestAnimationFrame(() => {
                      setTimeout(() => {
                        deleteNode(nodeId)
                      }, 150)
                    })
                  }
                }}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                Delete
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      )}

      {/* Edge Deletion Confirmation */}
      <AlertDialog open={showDeleteEdgeConfirm} onOpenChange={(open) => {
        if (!open) {
          setShowDeleteEdgeConfirm(false)
          setEdgeToDelete(null)
        }
      }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Connection</AlertDialogTitle>
            <AlertDialogDescription>
              {edgeToDelete && (
                <>Are you sure you want to delete the connection from "{edgeToDelete.source}" to "{edgeToDelete.target}"?</>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault()
                setShowDeleteEdgeConfirm(false)
                // Execute delete after dialog closes
                setTimeout(() => {
                  confirmDeleteEdge()
                  setEdgeToDelete(null)
                }, 100)
              }}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Context Menu for Nodes */}
      {contextMenuNode && contextMenuPosition && (
        <div
          style={{
            position: 'fixed',
            left: contextMenuPosition.x,
            top: contextMenuPosition.y,
            zIndex: 10000,
            pointerEvents: 'auto'
          }}
          onClick={(e) => e.stopPropagation()}
          onContextMenu={(e) => e.preventDefault()}
        >
          <ContextMenu>
            <ContextMenuTrigger asChild>
              <div style={{ position: 'absolute', width: 1, height: 1, left: 0, top: 0 }} />
            </ContextMenuTrigger>
            <ContextMenuContent
              style={{
                position: 'fixed',
                left: contextMenuPosition.x,
                top: contextMenuPosition.y
              }}
              onCloseAutoFocus={(e) => e.preventDefault()}
            >
              <ContextMenuItem
                onClick={() => {
                  if (contextMenuNode) {
                    clipboardRef.current = { ...contextMenuNode }
                    setContextMenuNode(null)
                    setContextMenuPosition(null)
                  }
                }}
              >
                Copy
                <ContextMenuShortcut>⌘C</ContextMenuShortcut>
              </ContextMenuItem>
              <ContextMenuItem
                onClick={() => {
                  if (contextMenuNode) {
                    clipboardRef.current = { ...contextMenuNode }
                    handleDeleteClick(contextMenuNode.id)
                    setContextMenuNode(null)
                    setContextMenuPosition(null)
                  }
                }}
              >
                Cut
                <ContextMenuShortcut>⌘X</ContextMenuShortcut>
              </ContextMenuItem>
              {clipboardRef.current && (
                <ContextMenuItem
                  onClick={() => {
                    if (clipboardRef.current) {
                      const newNode = {
                        ...clipboardRef.current,
                        id: `node-${Date.now()}`,
                        position: {
                          x: contextMenuPosition.x - 200,
                          y: contextMenuPosition.y - 100
                        }
                      }
                      setNodes(nodes => [...nodes, newNode])
                      setContextMenuNode(null)
                      setContextMenuPosition(null)
                      // Auto-save
                      if (onSave) {
                        setTimeout(() => {
                          const workflowNodes = [...flowNodes, newNode].map(n => {
                            let nodeType = 'action'
                            if (n.type === 'start') nodeType = 'start'
                            else if (n.type === 'end') nodeType = 'end'
                            else if (n.type === 'conditional') nodeType = 'conditional'
                            else if (n.data?.type) nodeType = n.data.type
                            
                            return {
                              id: n.id,
                              type: nodeType,
                              label: n.data?.label || '',
                              entryActions: n.data?.entryActions || [],
                              exitActions: n.data?.exitActions || [],
                              metadata: {
                                ...(n.data?.metadata || {}),
                                position: n.position
                              }
                            }
                          })
                          const workflowTransitions = flowEdges.map(e => ({
                            id: e.id,
                            source: e.source,
                            target: e.target
                          }))
                          onSave(workflowNodes, workflowTransitions)
                        }, 200)
                      }
                    }
                  }}
                >
                  Paste
                  <ContextMenuShortcut>⌘V</ContextMenuShortcut>
                </ContextMenuItem>
              )}
              <ContextMenuItem
                onClick={() => {
                  if (contextMenuNode) {
                    const newNode = {
                      ...contextMenuNode,
                      id: `node-${Date.now()}`,
                      position: {
                        x: contextMenuNode.position.x + 50,
                        y: contextMenuNode.position.y + 50
                      }
                    }
                    setNodes(nodes => [...nodes, newNode])
                    setContextMenuNode(null)
                    setContextMenuPosition(null)
                    // Auto-save
                    if (onSave) {
                      setTimeout(() => {
                        const workflowNodes = [...flowNodes, newNode].map(n => {
                          let nodeType = 'action'
                          if (n.type === 'start') nodeType = 'start'
                          else if (n.type === 'end') nodeType = 'end'
                          else if (n.type === 'conditional') nodeType = 'conditional'
                          else if (n.data?.type) nodeType = n.data.type
                          
                          return {
                            id: n.id,
                            type: nodeType,
                            label: n.data?.label || '',
                            entryActions: n.data?.entryActions || [],
                            exitActions: n.data?.exitActions || [],
                            metadata: {
                              ...(n.data?.metadata || {}),
                              position: n.position
                            }
                          }
                        })
                        const workflowTransitions = flowEdges.map(e => ({
                          id: e.id,
                          source: e.source,
                          target: e.target
                        }))
                        onSave(workflowNodes, workflowTransitions)
                      }, 200)
                    }
                  }
                }}
              >
                Duplicate
                <ContextMenuShortcut>⌘D</ContextMenuShortcut>
              </ContextMenuItem>
              <ContextMenuSeparator />
              {selectedNodeIds.size > 1 && (
                <>
                  <ContextMenuItem
                    onClick={() => {
                      alignNodes('left')
                      setContextMenuNode(null)
                      setContextMenuPosition(null)
                    }}
                  >
                    Align Left
                  </ContextMenuItem>
                  <ContextMenuItem
                    onClick={() => {
                      alignNodes('center')
                      setContextMenuNode(null)
                      setContextMenuPosition(null)
                    }}
                  >
                    Align Center
                  </ContextMenuItem>
                  <ContextMenuItem
                    onClick={() => {
                      alignNodes('right')
                      setContextMenuNode(null)
                      setContextMenuPosition(null)
                    }}
                  >
                    Align Right
                  </ContextMenuItem>
                  <ContextMenuItem
                    onClick={() => {
                      alignNodes('top')
                      setContextMenuNode(null)
                      setContextMenuPosition(null)
                    }}
                  >
                    Align Top
                  </ContextMenuItem>
                  <ContextMenuItem
                    onClick={() => {
                      alignNodes('middle')
                      setContextMenuNode(null)
                      setContextMenuPosition(null)
                    }}
                  >
                    Align Middle
                  </ContextMenuItem>
                  <ContextMenuItem
                    onClick={() => {
                      alignNodes('bottom')
                      setContextMenuNode(null)
                      setContextMenuPosition(null)
                    }}
                  >
                    Align Bottom
                  </ContextMenuItem>
                  <ContextMenuSeparator />
                </>
              )}
              <ContextMenuItem
                onClick={() => {
                  if (contextMenuNode) {
                    handleDeleteClick(contextMenuNode.id)
                    setContextMenuNode(null)
                    setContextMenuPosition(null)
                  }
                }}
                className="text-destructive focus:text-destructive"
              >
                Delete
                <ContextMenuShortcut>Del</ContextMenuShortcut>
              </ContextMenuItem>
            </ContextMenuContent>
          </ContextMenu>
        </div>
      )}

      {/* Context Menu for Edges */}
      {contextMenuEdge && contextMenuPosition && (
        <div
          style={{
            position: 'fixed',
            left: contextMenuPosition.x,
            top: contextMenuPosition.y,
            zIndex: 10000,
            pointerEvents: 'auto'
          }}
          onClick={(e) => e.stopPropagation()}
          onContextMenu={(e) => e.preventDefault()}
        >
          <ContextMenu>
            <ContextMenuTrigger asChild>
              <div style={{ position: 'absolute', width: 1, height: 1, left: 0, top: 0 }} />
            </ContextMenuTrigger>
            <ContextMenuContent
              style={{
                position: 'fixed',
                left: contextMenuPosition.x,
                top: contextMenuPosition.y
              }}
              onCloseAutoFocus={(e) => e.preventDefault()}
              onInteractOutside={() => {
                setContextMenuEdge(null)
                setContextMenuPosition(null)
              }}
            >
              <ContextMenuItem
                onClick={() => {
                  if (contextMenuEdge) {
                    setEdgeToDelete(contextMenuEdge)
                    setShowDeleteEdgeConfirm(true)
                    setContextMenuEdge(null)
                    setContextMenuPosition(null)
                  }
                }}
                className="text-destructive focus:text-destructive"
              >
                Delete
                <ContextMenuShortcut>Del</ContextMenuShortcut>
              </ContextMenuItem>
            </ContextMenuContent>
          </ContextMenu>
        </div>
      )}
    </div>
  )
}

