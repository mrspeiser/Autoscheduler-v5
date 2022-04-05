const cache = require('../../core/cache');


exports.getJobLength = (position, runTime, numLanguages, numWorkers=1, step) => {
    //     'MA', 'MIXER', 'MT', 'QC', 'CONS', 'FINAL', 'DELIVER'
    let contentLength = exports.parseRuntime(runTime);
    // console.log('contentLength ratio: ', contentLength);
    if(position === "MA" && step === 'consolidation'){
        return Math.round(contentLength);
    } else if(position === "MA" && step === "deliverables"){
        return Math.round(contentLength*4);
    } else if(position == "MA"){
        return Math.round(contentLength*numLanguages/numWorkers);
    } else if(position === "MIXERS"){
        return Math.round(4*contentLength/numWorkers);
    } else if(position == "MIXTECHS"){
        let c1 = Math.round(2*numLanguages/numWorkers)
        return Math.round(c1*contentLength);
    } else if(position == "QC"){
        let c2 = Math.round(2*numLanguages/numWorkers);
        return Math.round(c2*contentLength);
    } else if(position === "CONS"){
        return Math.round(contentLength);
    } else if(position === "FINAL"){
        return Math.round(4*contentLength/numWorkers);
    } else if(position === "DELIVER") {
        return Math.round(3*contentLength/numWorkers);
    } 
}

    
exports.bookBy = (obj, key) => {
    if(key === 'ingest' || key === 'initial' || key === 'finalmix' || key === 'consolidation' || key === 'deliverables'){
        obj[key].bookBy = 'project';
        return obj[key];
    } else if(key === 'mixtech' || key === 'qc'){
        obj[key].bookBy = 'language';
        return obj[key];
    } else {
        console.log('no match found from relative booking data');
    }
}

exports.phaseToPosition = (obj, key) => {
    if(key === 'ingest' || key === 'consolidation' || key === 'deliverables'){
        obj[key].position = 'MA';
        return obj[key];
    } else if(key === 'mixtech'){
        obj[key].position = 'MIXTECH';
        return obj[key]
    } else if(key === 'initial' || key === 'finalmix'){
        obj[key].position = 'MIXER';
        return obj[key];
    } else if(key === 'qc'){
        obj[key].position = 'QC';
        return obj[key];
    } else {
        console.log('no match found when matching phase to position')
    }
}

exports.relativeBookingPosition = (model, obj, key) => {
    if(key === 'ingest'){
        obj[key].bookFrom = 'start';
        obj[key].offset = 0;
        return obj[key];
    } else if(key === 'initial'){
        obj[key].bookFrom = 'start';
        obj[key].offset = exports.parseRuntime(model.contentRuntime);
        return obj[key];
    } else if(key ===  'mixtech'){
        obj[key].bookFrom = 'end';
        obj[key].offset = 0;
        return obj[key];
    } else if(key === 'qc'){
        obj[key].bookFrom = 'start';
        obj[key].offset = 4
        return obj[key];
    } else if(key === 'consolidation'){
        obj[key].bookFrom = 'end';
        obj[key].offset = 0;
        return obj[key];
    } else if(key === 'finalmix'){
        obj[key].bookFrom = 'end';
        obj[key].offset = 0;
        return obj[key];
    } else if(key === 'deliverables'){
        obj[key].bookFrom = 'end';
        obj[key].offset = 0;
        // console.log(obj);
        return obj[key];
    } else {
        'no match found from relative booking data';
    }
}

exports.getJobDuration = (model, obj, phase) => {
    let contentLength = exports.parseRuntime(model.contentRuntime);
    let numLanguages = Number.parseInt(model.numberOfLanguages);
    if(phase === 'ingest'){
        let hours = Math.round(contentLength*numLanguages/model.numResourcesPerPhase['ingest']);
        obj[phase].jobDuration = hours;
        return obj[phase];
    } else if(phase === 'initial'){
        let hours = Math.round(4*contentLength/model.numResourcesPerPhase['initial'])
        obj[phase].jobDuration = hours;
        return obj[phase];
    } else if(phase === 'mixtech'){
        // WE CAN DO ANOTHER CHECK HERE TO SEE IF WE DO BY PROJECT OR LANGUAGE
        if(obj[phase].bookBy === 'languages'){
            let hours = Math.round(contentLength+1);
            obj[phase].jobDuration = hours;
            return obj[phase];
        }
        let hours = Math.round(2*numLanguages/model.numResourcesPerPhase['mixtech']);
        obj[phase].jobDuration = hours;
        return obj[phase];
    } else if(phase === 'qc'){
        // WE CAN DO ANOTHER CHECK HERE TO SEE IF WE DO BY PROJECT OR LANGUAGE
        if(obj[phase].bookBy === 'languages'){
            let hours = Math.round(contentLength+1);
            obj[phase].jobDuration = hours;
            return obj[phase];
        }
        let hours = Math.round(2*numLanguages/model.numResourcesPerPhase['qc']);
        obj[phase].jobDuration = hours;
        return obj[phase];
    } else if(phase === 'consolidation'){
        let hours = Math.round(contentLength);
        obj[phase].jobDuration = hours;
        return obj[phase];
    } else if(phase === 'finalmix'){
        let hours = Math.round(4*contentLength/model.numResourcesPerPhase['finalmix'])
        obj[phase].jobDuration = hours;
        return obj[phase];
    } else if(phase === 'deliverables'){
        let hours = Math.round(3*contentLength/model.numResourcesPerPhase['deliverables']);
        obj[phase].jobDuration = hours;
        return obj[phase];
    } else {
        console.log('ERROR NO MATCH FOUND FROM GETJOBDURATION');
    }
}

exports.getPositionHours = (position, contentLength, numLanguages, numWorkers) => {
    // console.log(`the position is ${position}, contentLength is: ${contentLength}, numlanguages is: ${numLanguages}`)
    if(position == "MA"){
        return Math.round(3*contentLength);
    } else if(position === "MIXERS"){
        return Math.round(4*contentLength);
    } else if(position == "MIXTECHS"){
        let c1 = Math.round(2*numLanguages/numWorkers)
        return Math.round(c1*contentLength);
    } else if(position == "QC"){
        let c2 = Math.round(2*numLanguages/numWorkers);
        return Math.round(c2*contentLength);
    }
}

exports.getBackgroundColor = () => {
    let arr  = ['#bc3e1a', '#0066cc', '#66cdaa', '#8b0000', '#0055a4', '#40e0d0', '#f6546a', '#c4c4c4','#468499', '#ffc425', '#f37735','#00aedb','#00b159', '#d11141', '#00b050', '#1986c8', '#c00000', '#1d1b10', '#57cf8c'];
    let randNum = Math.floor(Math.random()*arr.length);
    while(true){
        if(arr[randNum] == cache.previousProjectColor){
            randNum = Math.floor(Math.random()*arr.length);
            continue
        }
        break;
    }
    cache.previousProjectColor = arr[randNum]
    return arr[randNum];
}

exports.parseRuntime = (minutes) => {
    let ratio = parseInt(minutes);
    if(ratio <= 30){
        return .5;
    } else if(ratio >= 31 && ratio <= 60){
        return 1;
    } else if(ratio >= 61 && ratio <= 90){
        return 1.5;
    } else if(ratio >= 91 && ratio <= 120){
        return 2;
    } else if(ratio >= 121){
        return 2.5;
    } else {
        console.log('ERROR did not return value from getContent Time, returning default of 1');
        return 1;
    }
}