// <graph> ::= <header> <graphContent> // Graph(dir: Dir, content: GraphContent)
// <header> ::= graph (TD|LR)<newline> // Direction can be TD or LR
// <graphContent> ::= <atomicGraph> | <compoundGraph>
// <atomicGraph> ::= <NodeDecl>
// <compoundGraph> ::= <Edge>+
// <Edge> ::= <Node> --><EdgeLabel>? <Node><newline> // <EdgeLabel> is optional
// // Edge(from: Node, to: Node, label?: string)
// <Node> ::= <NodeDecl> | <NodeDecl>
// <NodeDecl> ::= <identifier>["<string>"] // NodeDecl(id: string, label: string)
// <NodeRef> ::= <identifier> // NodeRef(id: string)
// <EdgeLabel> ::= |<identifier>| // string

export type Node = NodeDecl | NodeRef;
export type GraphContent = AtomicGraph | CompoundGraph;

// export interface EdgeLabel {tag: "EdgeLabel"; id: string;} 
// export const makeEdgeLabel = (id: string): EdgeLabel => ({tag: "EdgeLabel", id: id});
// export const isEdgeLabel = (x:any) : x is EdgeLabel => x.tag === "EdgeLabel";

export interface NodeRef {tag: "NodeRef"; id: string;}
export const makeNodeRef = (id: string): NodeRef => ({tag: "NodeRef", id: id});
export const isNodeRef = (x:any) : x is NodeRef => x.tag === "NodeRef";

export interface NodeDecl {tag: "NodeDecl"; id: string; label: string}
export const makeNodeDecl = (id: string, label: string): NodeDecl => ({tag: "NodeDecl", id: id, label: label});
export const isNodeDecl = (x:any) : x is NodeDecl => x.tag === "NodeDecl";

export interface Edge {tag: "Edge"; from: Node; to: Node; label?: string;} // label is a string or EdgeLbael ???????????????????????????????????
export const makeEdge = (from: Node, to:Node, label?: string): Edge => ({tag: "Edge", from: from, to:to, label: label});
export const isEdge = (x:any) : x is Edge => x.tag === "Edge";

export interface CompoundGraph {tag: "CompoundGraph"; edges: Edge[];}
export const makeCompoundGraph = (edges: Edge[]) : CompoundGraph => ({tag: "CompoundGraph", edges:edges});
export const isCompoundGraph = (x:any) : x is CompoundGraph => x.tag === "CompoundGraph";

export interface AtomicGraph {tag: "AtomicGraph"; node: NodeDecl;}
export const makeAtomicGraph = (node: NodeDecl) : AtomicGraph => ({tag: "AtomicGraph", node:node});
export const isAtomicGraph = (x:any) : x is AtomicGraph => x.tag === "AtomicGraph";

export interface Dir {tag: "Dir"; dir: "TD"|"LR";}
export const makeDir = (dir: "TD"|"LR") : Dir => ({tag: "Dir", dir: dir});
export const isDir = (x:any) : x is Dir => x.tag === "Dir";

export interface Graph {tag: "Graph"; dir: Dir; content: GraphContent}
export const makeGraph = (dir: Dir, content: GraphContent) : Graph => ({tag: "Graph", dir: dir, content:content});
export const isGraph = (x:any) : x is Graph => x.tag === "Graph";






