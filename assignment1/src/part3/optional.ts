/* Question 1 */

import { any } from "ramda";
import { type } from "os";

type Some<T> = {tag: "Some";  value: T;}
type None<T> = {tag: "None";}
export type Optional<T> = None<T> | Some<T>;

export const makeSome : <T> (arg:T) => Optional<T>  = <T> (arg:T): Optional<T>  =>{  return {tag:"Some",value:arg};  };

export const makeNone : <T> () => Optional<T>  = <T> () : Optional<T>  => { return {tag:"None"} };

export const isSome : <T> (x:Optional<T>) => x is Some<T> = <T> (x:Optional<T>) : x is Some<T> => x.tag === "Some";

export const isNone : <T>(x:Optional<T>)=> x is None<T> = <T> (x:Optional<T>) : x is None<T> => x.tag === "None" ;

/* Question 2 */
export const bind : <T,U> (opt: Optional<T>, f: (x:T)=>Optional<U> )=>(Optional<U>) =
<T,U>(opt: Optional<T>, f: (x:T)=>Optional<U> ):(Optional<U>)=>{

    const newOptional : Optional<U> = isSome(opt)? f(opt.value) : makeNone() ;
    return isSome(newOptional)? makeSome(newOptional.value) : makeNone();
};


