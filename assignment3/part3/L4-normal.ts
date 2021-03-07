
import { Sexp } from "s-expression";
import { map } from "ramda";
import { CExp, Exp, IfExp, Program, parseL4Exp,VarDecl,LetExp,VarRef, Binding } from "./L4-ast";
import { isAppExp, isBoolExp, isCExp, isDefineExp, isIfExp, isLitExp, isNumExp,isLetExp,
         isPrimOp, isProcExp, isStrExp, isVarRef ,parseL4, isAtomicExp} from "./L4-ast";
import { applyEnv, makeEmptyEnv, Env,makeExtEnv } from './L4-env-normal';
import { applyPrimitive } from "./evalPrimitive";
import { isClosure, makeClosure, Value,makeLazyValue, isLazyValue, Closure,LazyValue} from "./L4-value";
import { first, rest, isEmpty } from '../shared/list';
import { Result, makeOk, makeFailure, bind, mapResult ,isOk} from "../shared/result";
import { parse as p } from "../shared/parser";

export const isTrueValue = (x: Value): boolean =>
    ! (x === false);

export const evalExps = (exps: Exp[], env: Env): Result<Value> =>
    isEmpty(exps) ? makeFailure("Empty program") :
    isDefineExp(first(exps)) ? evalDefineExps(first(exps), rest(exps), env) :
    evalCExps(first(exps), rest(exps), env);

const evalCExps = (exp1: Exp, rest: Exp[], env: Env): Result<Value> =>
    isCExp(exp1) && isEmpty(rest) ? L4normalEval(exp1, env) :
    isCExp(exp1) ? bind(L4normalEval(exp1, env), _ => evalExps(rest, env)) :
    makeFailure("Never");

const evalDefineExps = (def: Exp, rest: Exp[], env: Env): Result<Value> =>
    isDefineExp(def) ? evalExps(rest, makeExtEnv( [def.var.var], [def.val], env)) :
    makeFailure("Unexpected " + def);

export const evalNormalProgram = (program: Program): Result<Value> =>
    evalExps(program.exps, makeEmptyEnv());

export const evalNormalParse = (s: string): Result<Value> =>
    bind(p(s),
         (parsed: Sexp) => bind(parseL4Exp(parsed),
                                (exp: Exp) => evalExps([exp], makeEmptyEnv())));


/*******************************************************************************************************/

export const L4normalEval = (exp: CExp, env: Env): Result<Value> =>
    isBoolExp(exp) ? makeOk(exp.val) :
    isNumExp(exp) ? makeOk(exp.val) :
    isStrExp(exp) ? makeOk(exp.val) :
    isPrimOp(exp) ? makeOk(exp) :
    isLitExp(exp) ? makeOk(exp.val) :
    isVarRef(exp) ? normalEvalVarRef(exp, env) :
    isIfExp(exp) ? normalEvalIf(exp, env) :
    isProcExp(exp) ? makeOk(makeClosure(exp.args, exp.body, env)) :
    isLetExp(exp)? normalEvalLet(exp,env) :
    // This is the difference between applicative-eval and normal-eval
    // Substitute the arguments into the body without evaluating them first.
    isAppExp(exp) ? bind(L4normalEval(exp.rator, env), (proc:Value) => L4NormalApplyProc(proc, exp.rands, env)) :
    makeFailure(`Bad ast: ${exp}`);

export const normalEvalLet = (exp:LetExp, env:Env) : Result<Value> =>{
    const namesOfArgs = map((bind:Binding)=> bind.var.var ,exp.bindings); 
    const vals = map((bind:Binding)=> bind.val ,exp.bindings); 
    return evalExps(exp.body, makeExtEnv(namesOfArgs ,vals ,env));
}

export const isLazyRef = (cexp:CExp) : boolean => isAppExp(cexp) || isLetExp(cexp) || isIfExp(cexp); 

export const normalEvalVarRef = (exp:VarRef, env:Env) : Result<Value> =>
    bind(applyEnv(env, exp.var), (cexp:CExp)=> (isLazyRef(cexp))? makeOk(makeLazyValue(cexp)) : L4normalEval(cexp,env)) ;

const normalEvalIf = (exp: IfExp, env: Env): Result<Value> =>
    bind(L4normalEval(exp.test,env), (test:Value) => 
    isLazyValue(test)? bind( L4normalEval(test.cexp,env), (valOfTest:Value) => isTrueValue(valOfTest)? L4normalEval(exp.then, env) : L4normalEval(exp.alt, env)) : 
    isTrueValue(test)? L4normalEval(exp.then, env) : L4normalEval(exp.alt, env)) 

const L4NormalApplyProc = (proc: Value, rands: CExp[], env: Env): Result<Value> => {
    if(isPrimOp(proc)){
        const argVals = mapResult((rand:CExp) => 
            bind(L4normalEval(rand, env),(val:Value)=> 
                            isLazyValue(val)? L4normalEval(val.cexp, env): makeOk(val)), rands);
        return bind(argVals, (args: Value[]) => applyPrimitive(proc, args));
    }
    else if(isClosure(proc)){
        const namesOfArgs = map((v:VarDecl)=> v.var,proc.params);
        return evalExps(proc.body, makeExtEnv(namesOfArgs ,rands ,proc.env));
    }
    else if(isLazyValue(proc))
        return bind (L4normalEval(proc.cexp,env) , (v:Value)=> L4NormalApplyProc(v, rands,env));
    else  
        return makeFailure("ERROR - not a procedure!!!");
}