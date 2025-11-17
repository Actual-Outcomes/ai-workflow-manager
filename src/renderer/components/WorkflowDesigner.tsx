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
  Position
} from 'reactflow'
import 'reactflow/dist/style.css'
import { WorkflowNode, WorkflowTransition } from '../../core/domain/workflows'
import { ConfirmationModal } from './ConfirmationModal'

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

const StartNode = ({ data }: { data: any }) => (
  <div style={{
    ...nodeBaseStyle,
    background: '#1a1a1a',
    borderColor: '#3b82f6',
    color: '#3b82f6'
  }}>
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

const ActionNode = ({ data }: { data: any }) => (
  <div style={{
    ...nodeBaseStyle,
    background: '#1a1a1a',
    borderColor: '#8b5cf6',
    color: '#c4b5fd'
  }}>
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

const ConditionalNode = ({ data }: { data: any }) => (
  <div style={{
    ...nodeBaseStyle,
    background: '#1a1a1a',
    borderColor: '#10b981',
    color: '#6ee7b7',
    transform: 'rotate(45deg)',
    width: '100px',
    height: '100px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center'
  }}>
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

const EndNode = ({ data }: { data: any }) => (
  <div style={{
    ...nodeBaseStyle,
    background: '#1a1a1a',
    borderColor: '#ef4444',
    color: '#fca5a5',
    borderRadius: '50%',
    width: '90px',
    height: '90px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 0
  }}>
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
      animated: false
    }))
  }, [initialTransitions]) // Depend on initialTransitions so it recomputes when they change

  const [flowNodes, setNodes, onNodesChange] = useNodesState([])
  const [flowEdges, setEdges, onEdgesChange] = useEdgesState([])
  const [isSaving, setIsSaving] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [nodeToDelete, setNodeToDelete] = useState<string | null>(null)
  const nodePositionsRef = useRef<Map<string, { x: number; y: number }>>(new Map())

  // Sync nodes/edges when props change - this is the source of truth
  useEffect(() => {
    console.log('Props changed - syncing nodes/edges:', { 
      nodeCount: initialNodes.length, 
      transitionCount: initialTransitions.length
    })

    // Convert props to ReactFlow format
    if (initialNodes.length > 0 || initialTransitions.length > 0) {
      const newNodes = initialNodes.map((node, index) => {
        // Load position from metadata if available, otherwise use default
        const savedPosition = (node.metadata?.position as { x: number; y: number } | undefined) || 
                              nodePositionsRef.current.get(node.id) ||
                              { x: 100 + (index % 3) * 250, y: 100 + Math.floor(index / 3) * 150 }
        
        return {
          id: node.id,
          type: node.type === 'start' ? 'start' : node.type === 'end' ? 'end' : node.type === 'conditional' ? 'conditional' : 'action',
          position: savedPosition,
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
        animated: false
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
  }, [initialNodes, initialTransitions, setNodes, setEdges])

  // Save node positions when they change (from user dragging)
  useEffect(() => {
    flowNodes.forEach(node => {
      if (node.position) {
        nodePositionsRef.current.set(node.id, node.position)
      }
    })
  }, [flowNodes])

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
        type: 'smoothstep'
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
              position: n.position // Save position in metadata
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

  const handleDeleteClick = useCallback((nodeId: string) => {
    setNodeToDelete(nodeId)
    setShowDeleteConfirm(true)
  }, [])

  const deleteNode = useCallback((nodeId: string) => {
    // Remove the node
    const updatedNodes = flowNodes.filter(n => n.id !== nodeId)
    setNodes(updatedNodes)
    // Remove any edges connected to this node
    const updatedEdges = flowEdges.filter(e => e.source !== nodeId && e.target !== nodeId)
    setEdges(updatedEdges)
    // Deselect
    onNodeSelect?.(null)
    // Close modal
    setShowDeleteConfirm(false)
    setNodeToDelete(null)
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
      const workflowTransitions = updatedEdges.map(e => ({
        id: e.id,
        source: e.source,
        target: e.target
      }))
      onSave(workflowNodes, workflowTransitions)
    }
  }, [flowNodes, flowEdges, onSave, onNodeSelect, setNodes, setEdges])

  // Handle keyboard delete
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Don't trigger delete if user is typing in an input field
      const target = event.target as HTMLElement
      if (target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable)) {
        return
      }
      
      if ((event.key === 'Delete' || event.key === 'Backspace') && selectedNodeId) {
        event.preventDefault()
        handleDeleteClick(selectedNodeId)
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [selectedNodeId, handleDeleteClick])

  const addNode = useCallback((type: string) => {
    const newNodeId = `node-${Date.now()}`
    const labelMap: Record<string, string> = {
      'start': 'Start',
      'end': 'End',
      'conditional': 'If',
      'action': 'Action'
    }
    const newNode: Node = {
      id: newNodeId,
      type: type,
      position: { x: Math.random() * 400 + 100, y: Math.random() * 400 + 100 },
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

  const selectedNode = selectedNodeId ? flowNodes.find(n => n.id === selectedNodeId) : null
  const selectedWorkflowNode = selectedNodeId ? initialNodes.find(n => n.id === selectedNodeId) : null

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
        <div style={{ flex: 1 }} />
        <button
          onClick={handleSave}
          disabled={isSaving}
          style={{
            padding: '8px 16px',
            background: isSaving ? '#666' : '#10b981',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: isSaving ? 'not-allowed' : 'pointer',
            fontSize: '14px'
          }}
        >
          {isSaving ? 'Saving...' : 'Save'}
        </button>
      </div>

      {/* Main Content Area */}
      <div style={{ flex: 1, display: 'flex', background: '#0f0f0f' }}>
        {/* React Flow Canvas */}
        <div style={{ flex: selectedNode ? '0 0 70%' : '1', background: '#0f0f0f' }}>
          <ReactFlow
            nodes={flowNodes}
            edges={flowEdges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onConnect={onConnect}
            onNodeClick={onNodeClick}
            onPaneClick={() => onNodeSelect?.(null)}
            nodeTypes={nodeTypes}
            fitView
          >
            <Background />
            <Controls />
            <MiniMap />
          </ReactFlow>
        </div>

        {/* Property Panel */}
        {selectedNode && selectedWorkflowNode && (
          <div style={{
            width: '30%',
            background: '#1a1a1a',
            borderLeft: '1px solid #333',
            padding: '20px',
            overflowY: 'auto',
            color: '#fff'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h3 style={{ margin: 0, color: '#fff' }}>
                Configure: {selectedWorkflowNode.label || selectedNode.id}
              </h3>
              <button
                onClick={() => handleDeleteClick(selectedNode.id)}
                style={{
                  padding: '6px 12px',
                  background: '#ef4444',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  fontSize: '12px',
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
                Delete
              </button>
            </div>

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
              onClick={() => {
                // Trigger save when closing panel
                handleSave()
                onNodeSelect?.(null)
              }}
              style={{
                width: '100%',
                padding: '10px',
                background: '#10b981',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
                fontSize: '14px',
                marginTop: '20px'
              }}
            >
              Save & Close
            </button>
          </div>
        )}
      </div>

      {/* Confirmation Modal */}
      <ConfirmationModal
        isOpen={showDeleteConfirm}
        title="Delete Node"
        message={`Are you sure you want to delete "${selectedNode && selectedWorkflowNode ? (selectedWorkflowNode.label || selectedNode.id) : ''}"? This will also remove all connections to this node.`}
        onConfirm={() => nodeToDelete && deleteNode(nodeToDelete)}
        onCancel={() => {
          setShowDeleteConfirm(false)
          setNodeToDelete(null)
        }}
        confirmText="Delete"
        cancelText="Cancel"
        confirmColor="#ef4444"
      />
    </div>
  )
}

