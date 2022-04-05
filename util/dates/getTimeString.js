
exports.parseProjectDateTime = () => {
    let dateTime = new Date();
    let year = dateTime.getFullYear();
    let date = dateTime.getDate();
    if(date < 10){
        date = "0"+date;
    }
    let month = dateTime.getMonth()+1;
    if(month < 10){
        month = "0"+month;
    }
    let hourRoundedUp = dateTime.getHours()+1;
    if(hourRoundedUp < 10){
        hourRoundedUp = "0"+hourRoundedUp;
    }
    return `${year}-${month}-${date} ${hourRoundedUp}:00`;
}


exports.getNextMorning = (overflowHours, currentDateTime) => {
    // console.log('the overflow and datetime passed into functions is: ',overflowHours+ ' '+ currentDateTime);
    let date1 = new Date(currentDateTime);
    let dt = currentDateTime.split(' ');
    let dtd = dt[0].split('-');
    let y = dtd[0];
    let m = dtd[1];
    let d = Number.parseInt(dtd[2])+1;

    let daysInMonth = exports.daysInMonth(Number.parseInt(m), Number.parseInt(y));

    if(date1.getDay() === 5){
        // if the date is Friday
        d+=2
        // add 2 more days to the day of month
        // check to see if we're over month
        if(exports.daysInMonth(m, y) < d){ 
            // if the days in month are less than the number of days calculated
            let dofm = exports.daysInMonth(m, y);
            let dif = d-dofm;
            // find the left over days and that is the new day of the month, also add 1 to the current month
            d = dif;
            m = Number.parseInt(m)+1;
            if(m < 10){
                m = "0"+m;
            }
            if(d < 10){
                d = "0"+d;
            }

            // if month is greater than 12
            if(m > 12){
                y = Number.parseInt(y)+1
                m = "01";
                d = dif;
                if(d < 10){
                    d = "0"+d;
                }
                let h = 9+overflowHours;
                if(overflowHours === 0){
                    return exports.getTimeString(y,m,d,"09");
                }
                return exports.getTimeString(y,m,d,h);
            }

            let h = 9+overflowHours;
            if(overflowHours === 0){
                return exports.getTimeString(y,m,d,"09");
            }
            return exports.getTimeString(y,m,d,h);
        
        } else {
            
            if(d < 10){
                d = "0"+d;
            }
            let h = 9+overflowHours;
            if(overflowHours === 0){
                return exports.getTimeString(y, m, d, "09");
            }
            return exports.getTimeString(y, m, d, h);
        }

    } else if(daysInMonth < d) {
        console.log('days are greater than current days in month');
            // if the days in month are less than the number of days calculated
            let dofm = exports.daysInMonth(m, y);
            let dif = d-dofm;
            // find the left over days and that is the new day of the month, also add 1 to the current month
            d = dif;
            m = Number.parseInt(m)+1;

            // write check to see if month > 12
            if(m > 12){
                y = Number.parseInt(y)+1
                m = "01";
                d = dif;
                if(d < 10){
                    d = "0"+d;
                }
                let h = 9+overflowHours;
                if(overflowHours === 0){
                    return exports.getTimeString(y,m,d,"09");
                }
                return exports.getTimeString(y,m,d,h);
            }

            if(m < 10){
                m = "0"+m;
            }
            if(d < 10){
                d = "0"+d;
            }
            if(m > 12){
                y = Number.parseInt(y)+1
                m = "01";
                d = dif;
            }

            let h = 9+overflowHours;

            if(overflowHours === 0){
                return exports.getTimeString(y,m,d,"09");
            }
            return exports.getTimeString(y,m,d,h);
    } else {
        
        if(m.length < 2){
            m = "0"+m;
        }
        if(d < 10){
            d = "0"+d;
        }
        
        let h = 9+overflowHours;
        if(overflowHours === 0){
            return exports.getTimeString(y,m,d,"09");
        }
        return exports.getTimeString(y,m,d,h);

    }
}

exports.daysInMonth = (month, year) => { // Use 1 for January, 2 for February, etc.
    return new Date(year, month, 0).getDate();
  }


exports.getEndOfDayDateTime = (currentDateTime) => {
    let endOfDayHour = 18;
    let dt = currentDateTime.split(' ');
    let dtd = dt[0].split('-');
    let y = dtd[0];
    let m = dtd[1];
    let d = dtd[2];
    return exports.getTimeString(y, m, d, "18");

}

exports.getHoursOfOverflow = (requestDateTime, jobHours) => {
    // console.log('\nexports is inside getHoursOfOverflow, datetime: '+requestDateTime+' jobHours: '+jobHours);
    let hours = exports.getHoursFromDateString(requestDateTime);
    // console.log('the hours from getHoursFromDateStringAre: '+hours+ ' '+typeof(hours));
    let newduration = hours+jobHours-18;
    // console.log('new duration is: '+newduration);
    return newduration;
}

exports.getHoursFromDateString = (dateString) => {
    let dateTimeSplit = dateString.split(' ');
    let timeSplit = dateTimeSplit[1].split(':');
    return Number.parseInt(timeSplit[0]);
}

exports.getNowTime = () => {
    let nowTime = new Date();
    let y = nowTime.getFullYear();
    let m = nowTime.getMonth()+1;
    let d = nowTime.getDate();
    let h = nowTime.getHours();
    
    if(h < 10){
        h = "0"+h;
    }
    if(d < 10){
        d = "0"+d
    }
    if(m < 10){
        m = "0"+m
    }
    
    return exports.getTimeString(y, m, d, h);
}

exports.getTimeString = (y,m,d,h) => {
    return `${y}-${m}-${d} ${h}:00`;
}