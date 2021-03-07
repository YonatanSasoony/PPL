import {makeGraph, makeDir, makeAtomicGraph, makeCompoundGraph, makeEdge, makeNodeDecl, makeNodeRef} from './mermaid-ast'
import {isGraph, isDir, isAtomicGraph, isCompoundGraph, isEdge, isNodeDecl,isNodeRef} from './mermaid-ast'
import {Graph, Dir, AtomicGraph, CompoundGraph, Edge, NodeDecl,NodeRef,Node,GraphContent} from './mermaid-ast'
import { map, zipWith, is, reduce, concat, call, dec } from "ramda";
import { Sexp, Token } from "s-expression";
import { allT, first, second, rest, isEmpty, cons } from "../shared/list";
import { isArray, isString, isNumericString, isIdentifier, isNumber ,isBoolean} from "../shared/type-predicates";
import { parse as p, isSexpString, isToken } from "../shared/parser";
import { Result, makeOk, makeFailure, bind, mapResult, safe2, safe3, isOk } from "../shared/result";
import { isSymbolSExp, isEmptySExp, isCompoundSExp } from './L4-value';
import { makeEmptySExp, makeSymbolSExp, SExpValue, makeCompoundSExp, valueToString } from './L4-value'
import { isProgram, isExp, isDefineExp, isCExp, Program, isAtomicExp, makeVarRef, makeVarDecl, isNumExp, isBoolExp, isStrExp, isPrimOp, isVarRef, isLetrecExp, isSetExp, parseL4Exp, parseL4Program, isCompoundExp } from './L4-ast';
import {Binding, VarDecl,DefineExp, Exp, Parsed, CExp, NumExp,BoolExp,StrExp, PrimOp,VarRef,CompoundExp,AppExp,IfExp,ProcExp,LetExp,LitExp,LetrecExp,SetExp,AtomicExp} from './L4-ast'
import { isVarDecl,isIfExp, isLitExp, isAppExp,isProcExp,isLetExp,parseL4 } from './L4-ast';
import {  } from '../shared/optional';
import { Closure,isClosure, CompoundSExp } from './L4-value';
import { compoundSExpToArray } from './L4-value';
import { makeDefineExp, makeNumExp } from './L4-ast';
import { makeBoolExp } from './L4-ast';


export const makeTypeVarGen = () : (s:string) => string => { 

    let countTypeShow: {[key:string]:number} = 
    {"NumExp":0,"BoolExp":0,"StrExp":0,"PrimOp":0,"VarRef":0,"VarDecl":0, 
    "AppExp":0,"IfExp":0,"ProcExp":0,"LetExp":0,"LitExp":0,"LetrecExp":0,"SetExp":0,"DefineExp":0,
     "number":0,"boolean":0,"string":0,"String":0,"SymbolSExp":0,"EmptySExp":0,"CompoundSExp":0,
      "Exps":0,"Params":0,"Rands": 0,"Body": 0,"Binding":0,"Bindings": 0,"Program": 0,};
    return (v: string) => {
        countTypeShow[v]++; 
        return `${v}_${countTypeShow[v]}`; 
    }; 
}

export const mapL4toMermaid = (exp: Parsed): Result<Graph> =>{
    const makeVarGen = makeTypeVarGen();
    return isProgram(exp)?  mapProgramToMermaid(exp,makeVarGen):
    isExp(exp)?  bind(mapExpToMermaid(exp, makeNodeRef("NULL"),makeVarGen), (edges: Edge[])=> 
        (edges.length === 0)? makeOk(makeGraph(makeDir("TD"), makeAtomicGraph(makeNodeDecl(makeVarGen(exp.tag),getStrOfExp(exp))))) :
        makeOk(makeGraph(makeDir("TD"), makeCompoundGraph(edges)))) :                                                                                         
    makeFailure("mapL4toMermaid: Unexpected type " + exp);
}


export const mapProgramToMermaid = (prog: Program,makeVarGen:(v:string)=>string) : Result<Graph> => {
    const currNode = makeNodeDecl(makeVarGen(prog.tag), prog.tag) ;
    const expsId = makeVarGen("Exps");
    const expsNode = makeNodeDecl(expsId, ":");
    const edge = [makeEdge(currNode, expsNode, "exps")];
    const expsEdges = mapExpArrToMermaid(prog.exps, makeNodeRef(expsId),makeVarGen);
    return bind(expsEdges, (edgesArr:Edge[])=> makeOk(makeGraph(makeDir("TD"),makeCompoundGraph(edge.concat(edgesArr)))));
}

export const mapExpArrToMermaid = (exps:Exp[], expsNodeRef: NodeRef,makeVarGen:(v:string)=>string) : Result<Edge[]> =>  
    exps.reduce( (acc: Result<Edge[]> ,curr:Exp)=> safe2((edgeArr:Edge[],ac:Edge[])=> makeOk(ac.concat(edgeArr)))
                                                    (mapExpsArgToMermaid(curr, expsNodeRef,makeVarGen), acc) , makeOk([]))
    

export const mapExpsArgToMermaid = (child:Exp, expsNodeRef: NodeRef,makeVarGen:(v:string)=>string ) : Result<Edge[]> =>{
    const childId = makeVarGen(child.tag);
    const childNode = makeNodeDecl(childId, getStrOfExp(child));
    const firstEdge = makeEdge(expsNodeRef, childNode);
    return bind(mapExpToMermaid(child, makeNodeRef(childId),makeVarGen), (edgeArr:Edge[])=> makeOk([firstEdge].concat(edgeArr)) );
}

export const mapExpToMermaid = (exp: Exp, currRef: NodeRef,makeVarGen:(v:string)=>string) : Result<Edge[]> => 
    isDefineExp(exp)? mapDefineToMermaid(exp, currRef,makeVarGen) :
    isCExp(exp)? mapCExpToMermaid (exp, currRef,makeVarGen) :
    makeFailure("mapExpToMermaid: Unexpected type " + exp);

export const mapCExpToMermaid = (exp: CExp, currRef: NodeRef,makeVarGen:(v:string)=>string) : Result<Edge[]> => 
    isAtomicExp(exp)? mapAtomicToMermaid(exp, currRef,makeVarGen) :
    isCompoundExp(exp)? mapCompoundToMermaid(exp, currRef,makeVarGen) :
    makeFailure("mapCExpToMermaid: Unexpected type " + JSON.stringify(exp));

export const mapDefineToMermaid = (exp: DefineExp, currRef: NodeRef,makeVarGen:(v:string)=>string) : Result<Edge[]> =>{ 
    const currNode = (currRef.id === "NULL")? makeNodeDecl(makeVarGen(exp.tag), exp.tag) : currRef ;
    const varId = makeVarGen(exp.var.tag);
    const varNode = makeNodeDecl(varId, exp.var.tag + "(" + exp.var.var + ")");
    const valId = makeVarGen(exp.val.tag);
    const valNode = makeNodeDecl(valId, getStrOfExp(exp.val));
    const edges = [makeEdge(currNode, varNode, "var"), makeEdge(isNodeDecl(currNode)? makeNodeRef(currNode.id) : currNode, valNode, "val")];
    const valEdges = mapCExpToMermaid(exp.val, makeNodeRef(valId),makeVarGen);
    return bind(valEdges, (edgesArr:Edge[])=> makeOk(edges.concat(edgesArr)));
}

export const mapAtomicToMermaid = (exp: AtomicExp, currRef: NodeRef,makeVarGen:(v:string)=>string) : Result<Edge[]> => makeOk([]);

export const mapCompoundToMermaid = (exp: CompoundExp, currRef: NodeRef,makeVarGen:(v:string)=>string) : Result<Edge[]> => 
    isIfExp(exp)? mapIfToMermaid(exp, currRef,makeVarGen) :
    isProcExp(exp)? mapProcToMermaid(exp, currRef,makeVarGen) :
    isLetExp(exp)? mapLetExpToMermaid(exp,currRef,makeVarGen) :
    isLitExp(exp)? mapLitExpToMermaid(exp,currRef,makeVarGen) :
    isLetrecExp(exp)? mapLetExpToMermaid(exp,currRef,makeVarGen) :
    isSetExp(exp)? mapSetToMermaid(exp,currRef,makeVarGen) :
    isAppExp(exp)? mapAppToMermaid(exp, currRef,makeVarGen) :
    makeFailure("mapCompoundToMermaid: Unexpected type " + exp);


export const mapIfToMermaid = (exp: IfExp, currRef: NodeRef,makeVarGen:(v:string)=>string) : Result<Edge[]> => {
    const currNode = (currRef.id === "NULL")? makeNodeDecl(makeVarGen(exp.tag), exp.tag) : currRef ;
    const testId =  makeVarGen(exp.test.tag);
    const testNode = makeNodeDecl(testId, getStrOfExp(exp.test));
    const thenId =  makeVarGen(exp.then.tag);
    const thenNode = makeNodeDecl(thenId, getStrOfExp(exp.then) );
    const altId = makeVarGen(exp.alt.tag);
    const altNode = makeNodeDecl(altId, getStrOfExp(exp.alt));
    const edges = [makeEdge(currNode,testNode,"test"), 
                  makeEdge(isNodeDecl(currNode)? makeNodeRef(currNode.id) : currNode ,thenNode,"then"), 
                  makeEdge(isNodeDecl(currNode)? makeNodeRef(currNode.id) : currNode ,altNode,"alt")];
    return safe3((testEdges: Edge[], thenEdges:Edge[], altEdges:Edge[])=> makeOk( edges.concat(testEdges).concat(thenEdges).concat(altEdges)) )
    ( mapCExpToMermaid(exp.test, makeNodeRef(testId),makeVarGen), mapCExpToMermaid(exp.then, makeNodeRef(thenId),makeVarGen), mapCExpToMermaid(exp.alt, makeNodeRef(altId),makeVarGen) );
}
    
export const mapProcToMermaid = (exp: ProcExp, currRef: NodeRef,makeVarGen:(v:string)=>string) : Result<Edge[]> => {
    const currNode = (currRef.id === "NULL")? makeNodeDecl(makeVarGen(exp.tag), exp.tag) : currRef ;
    const argsId = makeVarGen("Params");
    const argsNode = makeNodeDecl(argsId, ":");
    const bodyId = makeVarGen("Body");
    const bodyNode = makeNodeDecl(bodyId, ":");
    const edges = [makeEdge(currNode, argsNode, "args"), 
                   makeEdge(isNodeDecl(currNode)? makeNodeRef(currNode.id) : currNode, bodyNode, "body")];
    const argsEdges = map( (vard:VarDecl)=> makeEdge(makeNodeRef(argsId), makeNodeDecl(makeVarGen(vard.tag), vard.tag +"(" + vard.var + ")")) ,exp.args);
    const bodyEdges = mapCExpArrToMermaid(exp.body, makeNodeRef(bodyId),makeVarGen);
    return bind(bodyEdges, (edgesBody: Edge[])=> makeOk(edges.concat(argsEdges).concat(edgesBody) ));
}

export const mapCExpArrToMermaid = (body: CExp[], bodyNodeRef: NodeRef,makeVarGen:(v:string)=>string) : Result<Edge[]> => 
    body.reduce( (acc: Result<Edge[]> ,curr:CExp)=> safe2((edgeArr:Edge[],ac:Edge[])=> makeOk(ac.concat(edgeArr)))
                                                    (mapBodyArgToMermaid(curr, bodyNodeRef,makeVarGen), acc) , makeOk([]))
    

export const mapBodyArgToMermaid = (child:CExp, bodyNodeRef: NodeRef,makeVarGen:(v:string)=>string ) : Result<Edge[]> =>{
    const childId = makeVarGen(child.tag);
    const currNode = makeNodeDecl(childId, getStrOfExp(child));
    const firstEdge = makeEdge(bodyNodeRef, currNode);
    return bind(mapCExpToMermaid(child, makeNodeRef(childId),makeVarGen), (edgeArr:Edge[])=> makeOk([firstEdge].concat(edgeArr)) );
}

export const mapAppToMermaid = (exp: AppExp, currRef: NodeRef,makeVarGen:(v:string)=>string) : Result<Edge[]> => {
    const currNode = (currRef.id === "NULL")? makeNodeDecl(makeVarGen(exp.tag), exp.tag) : currRef ;
    const ratorId = makeVarGen(exp.rator.tag);
    const ratorNode = makeNodeDecl(ratorId, getStrOfExp(exp.rator));
    const randsId = makeVarGen("Rands");
    const randsNode = makeNodeDecl(randsId, ":");
    const edges = [makeEdge(currNode, ratorNode, "rator"), 
                    makeEdge(isNodeDecl(currNode)? makeNodeRef(currNode.id) : currNode, randsNode, "rands")];
    const ratorEdges = mapCExpToMermaid(exp.rator, makeNodeRef(ratorId),makeVarGen);
    const randsEdges = mapCExpArrToMermaid(exp.rands, makeNodeRef(randsId),makeVarGen);
    return safe2((ratorEdgesArr:Edge[], randsEdgesArr:Edge[])=> makeOk(edges.concat(ratorEdgesArr).concat(randsEdgesArr)) )(ratorEdges,randsEdges);
}

export const mapSetToMermaid = (exp: SetExp, currRef: NodeRef,makeVarGen:(v:string)=>string) : Result<Edge[]> => {
    const currNode = (currRef.id === "NULL")? makeNodeDecl(makeVarGen(exp.tag), exp.tag) : currRef ;
    const varId = makeVarGen(exp.var.tag);
    const varNode = makeNodeDecl(varId, getStrOfExp(exp.var));
    const valId = makeVarGen(exp.val.tag);
    const valNode = makeNodeDecl(valId, getStrOfExp(exp.val));
    const edges = [makeEdge(currNode, varNode, "var"), 
                    makeEdge(isNodeDecl(currNode)? makeNodeRef(currNode.id) : currNode, valNode, "val")];
    const valEdges = mapCExpToMermaid(exp.val, makeNodeRef(valId),makeVarGen);
    return bind(valEdges, (edgesArr:Edge[])=> makeOk(edges.concat(edgesArr)));
}

export const mapLetExpToMermaid = (exp: LetExp | LetrecExp, currRef: NodeRef,makeVarGen:(v:string)=>string) : Result<Edge[]> => {
    const currNode = (currRef.id === "NULL")? makeNodeDecl(makeVarGen(exp.tag), exp.tag) : currRef ;
    const bindingsId = makeVarGen("Bindings");
    const bindingsNode = makeNodeDecl(bindingsId, ":");
    const bodyId = makeVarGen("Body");
    const bodyNode = makeNodeDecl(bodyId, ":");
    const edges = [makeEdge(currNode, bindingsNode, "bindings"), 
                    makeEdge(isNodeDecl(currNode)? makeNodeRef(currNode.id) : currNode, bodyNode, "body")];
    const bindingsEdges = mapBindingsArrToMermaid(exp.bindings,makeNodeRef(bindingsId),makeVarGen);
    const bodyEdges = mapCExpArrToMermaid(exp.body, makeNodeRef(bodyId),makeVarGen);
    return safe2( (bindingsEdgesArr:Edge[],bodyEdgesArr:Edge[])=> makeOk( edges.concat(bindingsEdgesArr).concat(bodyEdgesArr)  ) )
            (bindingsEdges, bodyEdges);
}

export const mapBindingsArrToMermaid = (bindings: Binding[],bindingsRef:NodeRef ,makeVarGen:(v:string)=>string) : Result<Edge[]> => 
    bindings.reduce( (acc: Result<Edge[]> ,curr:Binding)=> safe2((edgeArr:Edge[],ac:Edge[])=> makeOk(ac.concat(edgeArr)))
(mapBindToMermaid(curr, bindingsRef,makeVarGen), acc) , makeOk([]))

export const mapBindToMermaid = (child:Binding, bindingsArrRef: NodeRef ,makeVarGen:(v:string)=>string) : Result<Edge[]> =>{
    const bindId = makeVarGen(child.tag);
    const bindNode = makeNodeDecl(bindId, child.tag);
    const declId = makeVarGen(child.var.tag);
    const declNode = makeNodeDecl(declId,child.var.tag+"("+child.var.var+")");
    const valId = makeVarGen(child.val.tag);
    const valNode = makeNodeDecl(valId,getStrOfExp(child.val));
    const edges = [ makeEdge(bindingsArrRef, bindNode),makeEdge(makeNodeRef(bindId),declNode),makeEdge(makeNodeRef(bindId),valNode) ];
    return bind(mapCExpToMermaid(child.val, makeNodeRef(valId),makeVarGen), (edgeArr:Edge[])=> makeOk(edges.concat(edgeArr)) );
}
export const getIdOfSExpValue = (exp: SExpValue) : string =>
    isPrimOp(exp)?  "PrimOp":
    isClosure(exp)? "Closure":
    isSymbolSExp(exp)? "SymbolSExp":
    isEmptySExp(exp)? "EmptySExp":
    isCompoundSExp(exp)? "CompoundSExp":
    isNumber(exp)? "number":
    isBoolean(exp)? "boolean" :
    isString(exp)? "string" :
    "ERROR";

export const getLabelOfSExpValue = (exp: SExpValue) : string =>
    isPrimOp(exp)?  "PrimOp"+"("+ exp.op + ")":
    isClosure(exp)? "Closure":
    isSymbolSExp(exp)? "SymbolSExp"+"("+ exp.val + ")":
    isEmptySExp(exp)? "EmptySExp":
    isCompoundSExp(exp)? "CompoundSExp":
    isNumber(exp)? "number" +"("+ exp + ")" :
    isBoolean(exp)? (exp)? "boolean(#t)"  : "boolean(#f)" :
    isString(exp)? "string" +"("+ exp + ")":
    "ERROR";

export const getStrOfExp = (exp: Exp) : string =>
    isNumExp(exp)? exp.tag +"("+ exp.val + ")" :
    isBoolExp(exp)? (exp.val)? exp.tag +"(#t)" :exp.tag +"(#f)":
    isStrExp(exp)? exp.tag +"("+ exp.val + ")":
    isPrimOp(exp)? exp.tag +"("+ exp.op + ")":
    isVarRef(exp)? exp.tag +"("+ exp.var + ")" :
    exp.tag;

export const mapLitExpToMermaid = (exp: LitExp, currRef: NodeRef,makeVarGen:(v:string)=>string) : Result<Edge[]> => {
    const currNode = (currRef.id === "NULL")? makeNodeDecl(makeVarGen(exp.tag), exp.tag) : currRef ;
    const expValId = makeVarGen(getIdOfSExpValue(exp.val));
    const expValNode = makeNodeDecl(expValId,getLabelOfSExpValue(exp.val));
    const firstEdge = makeEdge(currNode,expValNode,"val");
    return bind(mapSExpValueToMermaid(exp.val,makeNodeRef(expValId),makeVarGen), (edges:Edge[])=> makeOk([firstEdge].concat(edges)) );
}

export const mapSExpValueToMermaid = (exp: SExpValue, currRef: NodeRef,makeVarGen:(v:string)=>string) : Result<Edge[]> => 
    isCompoundSExp(exp)? mapCompoundSExpToMermaid(exp,currRef,makeVarGen) :   
    makeOk([]);


export const mapCompoundSExpToMermaid = (exp: CompoundSExp, currRef: NodeRef,makeVarGen:(v:string)=>string) : Result<Edge[]> => {
    const currNode = (currRef.id === "NULL")? makeNodeDecl(makeVarGen(exp.tag), exp.tag) : currRef ;
    const val1Id = makeVarGen(getIdOfSExpValue(exp.val1));//************************************************* */
    const val1Node = makeNodeDecl(val1Id,getLabelOfSExpValue(exp.val1));
    const val2Id = makeVarGen(getIdOfSExpValue(exp.val2));
    const val2Node = makeNodeDecl(val2Id,getLabelOfSExpValue(exp.val2));
    const edges = [makeEdge(currNode,val1Node,"val1"),makeEdge(isNodeDecl(currNode)? makeNodeRef(currNode.id):currNode,val2Node,"val2")];
    return safe2( (val1Arr:Edge[],val2Arr:Edge[]) => makeOk(edges.concat(val1Arr).concat(val2Arr)) )
    (mapSExpValueToMermaid(exp.val1,makeNodeRef(val1Id),makeVarGen),mapSExpValueToMermaid(exp.val2,makeNodeRef(val2Id),makeVarGen));

} 

export const unparseMermaid = (exp: Graph): Result<string> => 
    isAtomicGraph(exp.content)? unparseAtomic(exp.content, exp.dir.dir) :
    isCompoundGraph(exp.content)? unparseCompound(exp.content, exp.dir.dir) :
    makeFailure("Unexpected Graph " + exp);

export const unparseAtomic = (graph:AtomicGraph, dir: string) : Result<string> =>
    makeOk("graph " + dir + "\n" + graph.node.id + getNodeLabel(graph.node))

export const unparseCompound = (graph:CompoundGraph, dir: string) : Result<string> =>
    bind(unparseEdgesArr(graph.edges), (edges: string[])=> makeOk("graph " + dir + "\n\t" + edges.join("\n\t")))

export const unparseEdgesArr = (edges: Edge[]) : Result<string[]> =>
    mapResult( unparseEdge ,edges)

export const unparseEdge = (e:Edge) : Result<string> =>
    makeOk(unparsedNode(e.from) + " -->" + unparseEdgelabel(e.label) + unparsedNode(e.to) )

export const unparsedNode = (node: Node) : string =>
    isNodeDecl(node)? node.id + getNodeLabel(node) :
    isNodeRef(node)? node.id :
    "ERROR";

export const unparseEdgelabel = (label: string | undefined) : string  =>
    (label === undefined)? " ": "|" + label +"| "



export const getNodeLabel = (node: NodeDecl) : string => 
    ((node.label.indexOf("(") === -1) && node.label.indexOf("SExp") === -1) ? '['+ node.label + ']' : '["'+node.label + '"]'

export const L4toMermaid = (concrete: string): Result<string> => 
    isOk(parseL4(concrete))? 
    bind(parseL4(concrete), (p:Program) => bind(mapL4toMermaid(p), (g:Graph) => unparseMermaid(g))) :
    bind(p(concrete),(sexp:Sexp) => bind(parseL4Exp(sexp),(exp:Exp)=> bind(mapL4toMermaid(exp), (g:Graph) => unparseMermaid(g) ))); 
     

