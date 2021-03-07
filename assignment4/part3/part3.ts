

function* braid (generator1:Generator, generator2:Generator):Generator {
    let iter1 = generator1.next();
    let iter2 = generator2.next();
    while( (!iter1.done) && (!iter2.done) ){  
        yield iter1.value;
        yield iter2.value;
        iter1 = generator1.next();
        iter2 = generator2.next();
    }
    while(!iter1.done){
        yield iter1.value; 
        iter1 = generator1.next();
    }
    while(!iter2.done){
        yield iter2.value;
        iter2 = generator2.next();
    }
}

function* biased (generator1:Generator, generator2:Generator):Generator {
    let iter1 = generator1.next();
    let iter2 = generator2.next();
    while( (!iter1.done) && (!iter2.done) ){  

        yield iter1.value
        iter1 = generator1.next();
        if(!iter1.done){
            yield iter1.value;
            iter1 = generator1.next();
        } 

        yield iter2.value
        iter2 = generator2.next();
    }

    while(!iter1.done){
        yield iter1.value; 
        iter1 = generator1.next();
    }
    while(!iter2.done){
        yield iter2.value;
        iter2 = generator2.next();
    }
}

  

