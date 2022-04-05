exports.keyValueObject = (...kv) => {
    let obj = kv.reduce((acc, cv, i, arr) => {
        if(i === arr.length-1){
            return acc;
        } else if( i === 0){
            acc[cv] = arr[i+1];
            return acc
        } else if(i % 2 !== 0){
           return acc
        } else if( i % 2 === 0){
            acc[cv] = arr[i+1];
            return acc
        }
        return acc;
    } , {});
    return obj
}

exports.returnBody = (object) => {
    return JSON.stringify(object);
}