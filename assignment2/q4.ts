// import { Exp, Program, isProgram} from '../imp/L2-ast';
// import { Result, mapResult, makeOk } from '../imp/result';

import { ForExp, AppExp, CExp, Exp, Program, makeAppExp, makeProcExp, makeNumExp, isForExp, isDefineExp, makeDefineExp, makeProgram, isProcExp, isIfExp, isProgram,
    isCExp, isExp, isAppExp, makeIfExp } from "./L21-ast";
import { Result, makeOk, bind, mapResult, safe2, safe3, makeFailure } from "../imp/result";
import { reduce, range, map, xprod, concat } from "ramda";
import { isAtomicExp, isCompoundExp, VarDecl, isBoolExp, isNumExp, isVarRef, isPrimOp } from "../imp/L2-ast";

/*
Purpose: gets an array of strings and returns an array of strings with the last element wrapped with console.log
Signature: addConsoleLog(string[])
Type: [ string[] => string[]]
*/
export const addConsoleLog = (str: string[]) : string[] =>  map( (s:string)=> `console.log(${s});`, str) ;

/*
Purpose: gets an array of strings and returns an array of strings with prefix 'return' on each element 
Signature: addReturn(string[])
Type: [ string[] => string[]]
*/
export const addReturn = (str: string[]) : string[] =>  map( (s:string)=> `return ${s};`, str) ;

/*
Purpose: gets an array of strings and a function  and returns an array of strings with last element modified by the func recieved
Signature: editLastElement(string[],(str:string[]) => string[] )
Type: [ string[], (str:string[]) => string[] ]
*/
export const editLastElement = (exps: string[],f: (str:string[]) => string[]) : string[] => 
(exps.length === 0) ? exps :
exps.slice(0,exps.length -1).concat(f(exps.slice(exps.length -1)));

/*
Purpose: gets a string that represent PrimOp and returns the equivalent string opertor in JavaScript 
Signature: editPrimOp(string)
Type: [ string => string]
*/
export const editPrimOp = (op:string) : string =>
    (op === "=")? "===" :
    (op === "!=")? "!==" :
    (op === "not")? "!" :
    (op === "and")? "&&" :
    (op === "or")? "||" :
    (op === "eq?")? "===" :
    op;
/*
Purpose: gets a CExp and returnes if is a not operator
Signature: isOpNot(CExp)
Type: [ CExp => Boolean]
*/
export const isOpNot = (operator:CExp) : Boolean =>
    ! isPrimOp(operator)? false :
    (operator.op !== "not") ? false :
    true;

/*
Purpose: gets a string operator and returns a string with pedding.
Signature: peddOp(string)
Type: [ string => string]
*/
export const peddOp = (op: string) : string=>
[" "].concat([op]).concat([" "]).join("");

/*
Purpose: gets an L2 AST and returns a string of the equivalent JavaScript program.
Signature: l2ToJS(Exp | Program)
Type: [ Exp | Program => Result<string>]
*/
export const l2ToJS = (exp: Exp | Program): Result<string> => 
    isProgram(exp)? bind(mapResult(l2ToJS, exp.exps), (exps: string[])=> makeOk(editLastElement(exps,addConsoleLog).join(";\n") )) : //change
    isBoolExp(exp)? makeOk(exp.val? "true":"false") :
    isNumExp(exp)? makeOk(exp.val.toString()) :
    isVarRef(exp)? makeOk(exp.var) :
    isPrimOp(exp)? makeOk(editPrimOp(exp.op)) :
    isDefineExp(exp)? bind(l2ToJS(exp.val), (str:string)=> makeOk(`const ${exp.var.var} = ${str}`) ) :

    isProcExp(exp) ?  bind( mapResult(l2ToJS,exp.body), 
    (body: string[]) => makeOk ( (body.length === 1)? ( `((${exp.args.map((v:VarDecl) => v.var).join(',')}) => ${body.join()})`) :
                                             (`((${exp.args.map((v:VarDecl)=> v.var).join(',') }) => {${editLastElement(body,addReturn).join('; ')}})`  ) ))  :

    isIfExp(exp)? safe3( (test: string, then: string, alt: string) => makeOk(`(${test} ? ${then} : ${alt})`) ) (l2ToJS(exp.test),l2ToJS(exp.then),l2ToJS(exp.alt)):
    isAppExp(exp)? safe2( (rator: string,rands:string[]) => makeOk( (rator === "number?")?  `(typeof ${rands.join()} === "number")`:
                                                                    (rator === "boolean?")? `(typeof ${rands.join()} === "boolean")`:
                                                                    isOpNot(exp.rator)?  `(${rator}${rands.join()})`: 
                                                                    isPrimOp(exp.rator)? `(${rands.join(peddOp(rator))})`:
                                                                                         `${rator}(${rands.join(',')})` )  ) 
                        (l2ToJS(exp.rator),mapResult(l2ToJS,exp.rands)) :
    makeFailure(`Unknown expression: ${exp}`);
