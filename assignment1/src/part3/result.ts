/* Question 3 */

type Ok<T> = { tag:"Ok", value:T};
type Failure<T> = { tag:"Failure", message:string};
export type Result<T> = Ok<T> | Failure<T>;

export const makeOk : <T> (arg: T) => Ok<T> = <T> (arg:T) : Ok<T> => {return {tag:"Ok",value:arg};};

export const makeFailure :<T> (s:string)=>Failure<T> = <T>(s:string) : Failure<T> => {return {tag:"Failure" , message:s};};

export const isOk : <T>(x:Result<T>)=> x is Ok<T> = <T>(x:Result<T>) : x is Ok<T> => x.tag ==="Ok" ;

export const isFailure: <T>(x:Result<T>)=> x is Failure<T> = <T> (x:Result<T>):x is Failure<T> => x.tag ==="Failure";

/* Question 4 */
export const bind : <T,U> (res: Result<T>, f: (x:T)=>Result<U>)=> Result<U> = 
<T,U> (res:Result<T>,f: (x:T)=> Result<U>) : Result<U> =>{
    return isOk(res)? f(res.value) : makeFailure(res.message);  
} ;


/* Question 5 */
interface User {
    name: string;
    email: string;
    handle: string;
}

const validateName = (user: User): Result<User> =>
    user.name.length === 0 ? makeFailure("Name cannot be empty") :
    user.name === "Bananas" ? makeFailure("Bananas is not a name") :
    makeOk(user);

const validateEmail = (user: User): Result<User> =>
    user.email.length === 0 ? makeFailure("Email cannot be empty") :
    user.email.endsWith("bananas.com") ? makeFailure("Domain bananas.com is not allowed") :
    makeOk(user);

const validateHandle = (user: User): Result<User> =>
    user.handle.length === 0 ? makeFailure("Handle cannot be empty") :
    user.handle.startsWith("@") ? makeFailure("This isn't Twitter") :
    makeOk(user);

export const naiveValidateUser : (user: User)=> Result<User> =
(user:User): Result<User> =>{
    const name  : Result<User> = validateName(user);
    const email :Result<User>  = validateEmail(user);
    const handle: Result<User> =  validateHandle(user);
    return isFailure(name) ? name : isFailure(email)? email : isFailure(handle)? handle : makeOk(user); 
};

export const monadicValidateUser : (user:User)=> Result<User> = (user:User): Result<User> =>{

    return bind(bind(validateName(user),validateEmail),validateHandle);


}; 

