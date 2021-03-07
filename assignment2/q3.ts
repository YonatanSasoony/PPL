// import { ForExp, AppExp, Exp, Program} from "./L21-ast"; 
// import { Result } from "../imp/result";
// import { makeAppExp, makeProcExp, CExp, NumExp, makeNumExp } from "../imp/L2-ast";
// import { reduce } from "ramda";

import { ForExp, AppExp, CExp, Exp, Program, makeAppExp, makeProcExp, makeNumExp, isForExp, isDefineExp, makeDefineExp, makeProgram, isProcExp, isIfExp, isProgram,
    isCExp, isExp, isAppExp, makeIfExp,makeVarDecl } from "./L21-ast";
import { Result, makeOk, bind, mapResult, safe2, safe3, makeFailure } from "../imp/result";
import { reduce, range, map, xprod } from "ramda";
import { isAtomicExp, isCompoundExp, VarDecl } from "../imp/L2-ast";

/*
Purpose: creates an array of AppExp from a ForExp
Signature: makeBody(exp,x)
Type: [ ForExp*number => AppExp[] ]
*/
export const makeBody = (exp: ForExp, x: number): AppExp[] => (x > exp.end.val) ? [] :
                                                              [makeAppExp(makeProcExp([exp.var], [exp.body]),  [makeNumExp(x)]  )].concat(makeBody( exp, x+1 ));

/*
Purpose: applies a syntactic transformation from a ForExp to an equivalent AppExp
Signature: for2app(exp)
Type: [ForExp => AppExp]
*/
export const for2app = (exp: ForExp): AppExp => makeAppExp(makeProcExp([], makeBody(exp, exp.start.val)), []);  


/*
Purpose: gets an L21 AST and returns an equivalent L2 AST.
Signature: L21ToL2(exp)
Type: [ Exp | Program => Result<Exp | Program> ]
*/
export const L21ToL2 = (exp: Exp | Program): Result<Exp | Program> =>
    isProgram(exp)? bind(mapResult(rewriteAllForExp,exp.exps), (exps:Exp[])=> makeOk(makeProgram(exps))) :
    isExp(exp)? rewriteAllForExp(exp) :
    makeFailure("not Program or Exp");

    /*
Purpose: gets an exp and returns an equivalent exp modified without forExp.
Signature: rewriteAllForExp(exp)
Type: [ Exp => Result<Exp> ]
*/
export const rewriteAllForExp = (exp: Exp) : Result<Exp> =>
    isCExp(exp)? rewriteAllForCExp(exp) :
    isDefineExp(exp)? safe2 ( (v:VarDecl, val:CExp)=> makeOk(makeDefineExp(v, val)) )
                            ( makeOk(exp.var)  ,  rewriteAllForCExp(exp.val) ) :
    makeFailure("not CExp or Define");

/*
Purpose: gets an CExp and returns an equivalent CExp modified without forExp.
Signature: rewriteAllForCExp(cExp)
Type: [ CExp  => Result<CExp> ]
*/
export const rewriteAllForCExp = (cExp: CExp) : Result<CExp> =>
    isAtomicExp(cExp)? makeOk(cExp) :
    isAppExp(cExp)? safe2( (operator:CExp, operands:CExp[])=> makeOk(makeAppExp(operator,operands)))
                        (   rewriteAllForCExp(cExp.rator),  mapResult(rewriteAllForCExp,cExp.rands) ) :
                    
    isIfExp(cExp)? safe3(  (test: CExp, then: CExp, alt: CExp) => makeOk(makeIfExp(test,then,alt))   )
                        ( rewriteAllForCExp(cExp.test),rewriteAllForCExp(cExp.then),rewriteAllForCExp(cExp.alt)  ) :
    isProcExp(cExp)? safe2( (params:VarDecl[], body:CExp[])=> makeOk(makeProcExp(params,body))  )
                        ( makeOk(cExp.args)  ,mapResult(rewriteAllForCExp,cExp.body) ) :
    isForExp(cExp)? rewriteAllForCExp(for2app(cExp)) :
    makeFailure("could not rewriteAllForCExp");


