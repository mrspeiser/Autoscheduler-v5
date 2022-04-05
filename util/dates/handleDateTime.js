let { getHoursFromDateString, getTimeString, getHoursOfOverflow, getNextMorning, getEndOfDayDateTime } = require('./getTimeString');

exports.parseDateTime = (dateString) => {
    if(dateString === undefined){
        return 'NULL';
    }
    let dateTimeArray = dateString.split('T');
    return dateTimeArray.join(' '); 
}

exports.returnFarthestStart = (resourceStart, projectStart) => {
    if(resourceStart === 'NULL'){
        return projectStart;
    }
    let rStart = new Date(resourceStart);
    let pStart = new Date(projectStart);
    if(rStart > pStart){
        return rStart
    } else {
        return pStart
    }
}

exports.compareDates = (curDateTime, nextDateTime) => {
    // return true if param 1 Greater than param2

    // console.log(typeof(prevDayOfMonth))
    var d1 = new Date(curDateTime);
    var d2 = new Date(nextDateTime);
    // console.log(`${prevDayOfMonth} should be greater than ${curDayOfMonth}`)
    if(d1 >= d2){
        return true;
    }
    return false
}

exports.addHoursToDateString = (dateString, hours) => {
    let dateTimeArray = dateString.split(' ');
    let DateSplit = dateTimeArray[0].split('-');
    let TimeSplit = dateTimeArray[1].split(':');
    
    let y = DateSplit[0];
    let m = DateSplit[1];
    let d = DateSplit[2];
    let h = Number.parseInt(TimeSplit[0])+hours;
    if(h > 24){
        h = h%24;
        let addDay = Number.parseInt(d)+1;
        d = addDay.toString();
    }
    if(h < 10){
        h="0"+h;
    }
    return getTimeString(y, m, d, h.toString());
}

exports.afterHours = (dateString) => {
    let hours = getHoursFromDateString(dateString);
    if(hours >= 18){
        // console.log('datestring hours are greater than 18 ', dateString);
        return true;
    }
    return false;
}

exports.jobTimeHasOverflow = (datetime, jobHours) => {
    let jobFinishHour = getHoursFromDateString(datetime)+jobHours
    if(jobFinishHour > 18){
        return true;
    }
    return false;
}

exports.startTimeHasOverflow = (datetime, jobHours) => {
    let jobFinishHour = getHoursFromDateString(datetime)+jobHours
    if(jobFinishHour >= 18){
        return true;
    }
    return false;
}

exports.getStartAndFinish = (startTime, amountToAdd) => {
    if(exports.afterHours(startTime)){
        startTime = getNextMorning(0, startTime);
    }
    if(exports.jobTimeHasOverflow(startTime, amountToAdd)){
        let overflow = getHoursOfOverflow(start, jobHours);
        let endOfDay = getEndOfDayDateTime(startTime);
        let nextMorning = getNextMorning(0, startTime);
        let endOfJob = exports.addHoursToDateString(nextMorning, overflow);
        if(overflow > 9){
            console.log('OVERFLOW GREATER THAN 9, FUNCTION NOT FINISHED, RETURNING FIRST 2 BOOKINGS');
            return [{start: startTime, end: endOfDay}, {start: nextMorning, end: endOfJob}]
        }
        return [{start: startTime, end: endOfDay}, {start: nextMorning, end: endOfJob}]
    } else {
        let endTime = exports.addHoursToDateString(startTime, amountToAdd);
        return [{start: startTime, end: endTime}]
    }

}