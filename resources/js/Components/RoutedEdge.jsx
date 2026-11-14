import { BaseEdge } from '@xyflow/react'
import { routedPath } from '../lib/layout'

/** Tree edge following the route dagre computed (see route() in lib/layout). */
export default function RoutedEdge({ id, sourceX, sourceY, targetX, targetY, data, style, markerEnd }) {
    return <BaseEdge id={id} path={routedPath(sourceX, sourceY, targetX, targetY, data?.points)} style={style} markerEnd={markerEnd} />
}
