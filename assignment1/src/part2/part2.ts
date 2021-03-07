import {map, filter, reduce,compose, type, concat} from 'ramda'


/* Question 1 */
export const partition : <T> (f :(x: T)=>Boolean ,arr : T[]) => T[][]        
= <T> (f :(x: T) =>Boolean, arr : T[]) : T[][]    => {
return [   arr.filter(f)   ,   arr.filter(x => !f(x))  ]   ;
}


/* Question 2 */
export const mapMat :  <T,U> ( f: (elemnt:T)=>U ,mat : T[][]  ) =>U[][]
= <T,U>(f: (elemnt:T)=>U, mat: T[][]) : U[][] => {
return mat.map(a => a.map(f));
}


/* Question 3 */

export const composeMany: <T> (arr : ((x:T)=> T)[]) => ((y:T)=>T) =
<T> (arr : ((x:T)=> T)[]) : ((y:T)=>T) => {
    return arr.reduce ((acc: (x:T)=>(T) , curr: (x:T)=>(T)) : (  (y:T) => T  )   => 
     compose(acc, curr) , x=>x) ;
};


/* Question 4 */
interface Languages {
    english: string;
    japanese: string;
    chinese: string;
    french: string;
}

interface Stats {
    HP: number;
    Attack: number;
    Defense: number;
    "Sp. Attack": number;
    "Sp. Defense": number;
    Speed: number;
}

interface Pokemon {
    id: number;
    name: Languages;
    type: string[];
    base: Stats;
}

export const maxSpeed : (pokedex: Pokemon[])=>Pokemon[]   = 
(pokedex: Pokemon[]) : Pokemon[]=>{

    let maxSpeed: number = reduce( (acc:number,curr:Pokemon)=>( Math.max(curr.base.Speed,acc) ) ,-Infinity,pokedex);
    return pokedex.filter( (pokemon:Pokemon) =>  pokemon.base.Speed === maxSpeed );
}  ;

export const grassTypes : (pokedex:Pokemon[])=>string[] =
(pokedex:Pokemon[]) : string[] =>{
    return pokedex.filter( (pokemon:Pokemon) => pokemon.type.reduce((acc:Boolean, curr:string) => (acc || curr==="Grass") ,false)   ).map(pok=>pok.name.english).sort();
} ;

export const uniqueTypes : (pokedex:Pokemon[]) => string[] = 
(pokedex:Pokemon[]): string[] =>{
        const includes : (arr: string[], s:string)=>Boolean =   (arr: string[], s:string) : Boolean => arr.reduce((ac:Boolean, cur:string)=> ac||cur===s,false);
        
        return pokedex.reduce( (acc:string[], curr:Pokemon)=> ( acc.concat( curr.type.filter(x => !includes(acc,x)) ))   ,[]  ).sort();
    };