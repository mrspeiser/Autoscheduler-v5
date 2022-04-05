
exports.check = async (data) => {
    console.log('check has run');
    let error = false;
    return await error;
}

exports.checkSync = (data) => {
    console.log('check sync has run');
    let error = false;
    return error;
}

// if param 1 < param 2 pass param3 to cb
exports.passParam3 = (param1, param2, cb, param3) => {
    if(param1 < param2) {
        cb(param3);
    }
}

exports.notUndefined = (param1, cb) => {
    if(param1 !== undefined){
        return cb(param1);
    }
    console.log("param 1 is undefined");
}

exports.hasKey = (obj, keyName) => {
    for(var key in obj){
        if(key === keyName){
            return true;
        }
        return false;
    }
}

exports.indexOfArray = (arr, val) => {
    return arr.indexOf(val);
}

exports.ofType = (type, val) => {
    if(typeof(val) === type){
        return true;
    }
}

exports.checkAndFn = (val, type, cb) => {
    if(typeof(val) === type){
        return cb(val);
    }
}

exports.emptyString = (ref, cb) => {
    if(ref === ''){
        return cb();
    }
}

exports.findFromArray = (arr, cb, val) => {
    return arr.find(cb(val))
}

exports.sequence = (handler, ...seq) => {
        return handler(...seq);
}

exports.handler = (preProcess, type, cb, data) => {
    if(preProcess(type, data)){
        return cb(data)
    }
}

exports.processData = (fn, data) => {
    return fn(data);
}

exports.matchData = (data, ...d) => {
    d.find(exports.checkAndFn(data, 'object', handler(data)));
}

exports.matchString = (checkedString, characters) => {
    let re = new RegExp(characters, 'g');
    return checkedString.match(re) ? true : false;
}

exports.testString = (checkedString, characters) => {
    let re = RegExp(characters);
    return checkedString.test(re) ? true : false;
}