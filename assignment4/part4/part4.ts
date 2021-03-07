//4.a

const DivPromise = (x: number): Promise<number> => 
    new Promise<number>( (resolve, reject) => (x===0)? reject("division by zero") : resolve(1/x) ); 

const squarePromise = (x: number): Promise<number> => 
    new Promise<number>( (resolve, reject) => (false)? reject("never") : resolve(x*x) ); 

const squareAndDivPromise = (x: number) => 
    squarePromise(x)
    .then((squared:number) => DivPromise(squared))
    .then((res:number)=>console.log(res))
    .catch((err:string)    => console.error(err));

//4.2

import {Box, makeBox,unbox,setBox} from "../shared/box";

const promise1 = new Promise((resolve, reject)=> setTimeout(resolve, 100, "two"));
const promise2 = new Promise((resolve, reject)=> setTimeout(resolve, 300, "one"));

const slower = (promises:[Promise<any>,Promise<any>]) => {
    return new Promise ((resolve, reject)=>{
        const pending = makeBox(2);
        const foo = (res:any , i:number)=> {
            if(unbox(pending) === 1){
                resolve([i,res]);
                //resolve("(" + i + ", " + res + ")");
            }                
            else
                setBox(pending, unbox(pending) - 1 );
        };

        promises[0].then((res)=>foo(res, 0))
        .catch((err)=> reject(err));

        promises[1].then((res)=>foo(res, 1))
        .catch((err)=> reject(err));

    })
}
