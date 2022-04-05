const Booking = require('./bookingObject');
let { getPositionHours, getJobLength } = require('../data/variableData');
let { getMixerBooking, reduceMixerBookings } = require('../dates/overlaps');
let { findSoonestBookingStart, emptyBookingsArray } = require('../data/filterBookings');
let { addHoursToDateString, afterHours, jobTimeHasOverflow, compareDates } = require('../dates/handleDateTime');
let { parseProjectDateTime, getNextMorning, getEndOfDayDateTime, getHoursOfOverflow} = require('../dates/getTimeString');


exports.getBookings = async (position, projectTitle, contentLength, languages, bookingTitle, prevJob={endTime: ''}, numOfResourcesToBook=1, useResource) => {
    let bookings = [];
    let numResources = numOfResourcesToBook;
    let nowTime = await parseProjectDateTime();
    // let jobHours = await getPositionHours(position, contentLength, languages, numOfResourcesToBook);
    let jobHours = await getJobLength(position, contentLength, languages, numOfResourcesToBook);
    console.log('job hours: '+jobHours)
    if(position === 'CONS'){
        console.log('changing CONS to MA');
        position = 'MA';
    }

    let emptyBookings = await emptyBookingsArray(position);
    let prevBooking = prevJob;
    let soonest = await findSoonestBookingStart(position);

    // console.log(' ');
    console.log('emptyBookings: ')
    emptyBookings.forEach(eb => console.log(eb.firstName+' '+eb.lastName));
    console.log(' ');
    // console.log('array of resources starting with the last person: ', soonest[soonest.length-1]);
    // console.log(' ');
 

    if(position === 'QC' && jobHours >= 4){
        if(jobTimeHasOverflow(prevBooking.startTime , 4)){
            let overflow = getHoursOfOverflow(prevBooking.startTime, 4);
            prevBooking.endTime = getNextMorning(0, prevBooking.startTime);
            prevBooking.endTime = addHoursToDateString(prevBooking.endTime, overflow);
        
        } else {
            prevBooking.endTime = addHoursToDateString(prevBooking.startTime, 4);
        }
    }

    for(var i=0; i < numResources; i++){
        let idx = i+1;
        let index = soonest.length-idx;
        if(index < 0){
            index = 0;
        }
        if(useResource){
            emptyBookings.unshift({_id: useResource[0].id});
            if(soonest.length > 0){
                soonest[index]._id = useResource[0].id;
            }
        }
        if(afterHours(nowTime)){
            nowTime = getNextMorning(0, nowTime);
        }
        if(prevBooking.endTime != ''){
            if(afterHours(prevBooking.endTime)){
                prevBooking.endTime = getNextMorning(0, prevBooking.endTime);
            }
        }
        //if resource has empty bookings and there is no job before them
        if(prevBooking.endTime === ''){
            let id = emptyBookings.length > 0 ? emptyBookings[i]._id : soonest[index]._id
            if(jobTimeHasOverflow(nowTime, jobHours)){
                let overflow = getHoursOfOverflow(nowTime, jobHours);
                if(overflow > 9){
                    let overflowBookings = exports.handleAllOverflows(overflow, nowTime, id, jobHours, bookingTitle, projectTitle, position, idx);
                    bookings = [...bookings, ...overflowBookings];
                    continue;
                }
                let splitBookings = exports.handleSplitBookings(overflow, nowTime, id, jobHours, bookingTitle, projectTitle, position, idx);
                bookings = [...bookings, ...splitBookings];
                continue;
            }
            let endOfJob = addHoursToDateString(nowTime, jobHours);
            bookings.push(new Booking(id, nowTime, endOfJob, jobHours, bookingTitle, `${projectTitle} - ${bookingTitle} ${idx}`, position))
        } else if (emptyBookings.length > 0 && prevBooking.endTime != ''){
           
            let start = prevBooking.endTime;
            if(jobTimeHasOverflow(start, jobHours)){
                let overflow = getHoursOfOverflow(start, jobHours);
                if(overflow > 9){
                    let overflowBookings = exports.handleAllOverflows(overflow, start, emptyBookings[0]._id, jobHours, bookingTitle, projectTitle, position, idx);
                    bookings = [...bookings, ...overflowBookings];
                    emptyBookings.shift();
                    continue;
                }
                let splitBookings = exports.handleSplitBookings(overflow, start, emptyBookings[0]._id, jobHours, bookingTitle, projectTitle, position, idx);
                bookings = [...bookings, ...splitBookings];
                emptyBookings.shift();
                continue;
            }
            let endOfJob = addHoursToDateString(start, jobHours);
            
            bookings.push(new Booking(emptyBookings[0]._id, start, endOfJob, jobHours, bookingTitle, `${projectTitle} - ${bookingTitle} ${idx}`, position))
            emptyBookings.shift();
        } else if (compareDates(prevBooking.endTime, soonest[index].bookings[soonest[index].bookings.length-1].end)){
            //if resource has a previous booking passed to them and its greater than any soonest bookings they have update soonest to previousBookingEnd
            
            let start = prevBooking.endTime;
            if(afterHours(start)){
                start = getNextMorning(0, start);
            }
            if(jobTimeHasOverflow(start, jobHours)){
                let overflow = getHoursOfOverflow(start, jobHours);
                if(overflow > 9){
                    let overflowBookings = exports.handleAllOverflows(overflow, start, soonest[index]._id, jobHours, bookingTitle, projectTitle, position, idx);
                    bookings = [...bookings, ...overflowBookings];
                    continue;
                }
                let splitBookings = exports.handleSplitBookings(overflow, start, soonest[index]._id, jobHours, bookingTitle, projectTitle, position, idx);
                bookings = [...bookings, ...splitBookings];
                continue;
            }
            let endOfJob = addHoursToDateString(start, jobHours);
            bookings.push(new Booking(soonest[index]._id, start, endOfJob, jobHours, bookingTitle, `${projectTitle} - ${bookingTitle} ${idx}`, position));
        } else if(compareDates(soonest[index].bookings[soonest[index].bookings.length-1].end, prevBooking.endTime)){
             //if the previous booking passed to them is less than the soonest resource can start, update soonest to soonestEnd
            let last = soonest[index].bookings.length-1;
            let start = soonest[index].bookings[last].end;
            console.log('the mixer start is: ', start);
            if(position === 'MIXERS' && useResource == undefined){  
                console.log('checking mixer booking');
                let reducedBookings = reduceMixerBookings(soonest[0].bookings);
                let optimalStart = await getMixerBooking(reducedBookings.initial[reducedBookings.initial.length-1], reducedBookings, jobHours);
                // let optimalStart = await getMixerBooking(soonest[index].bookings[last], jobHours);
                console.log('optimal start: ', optimalStart);
                start = optimalStart;
                
            }
            if(afterHours(start)){
                start = getNextMorning(0, start);
            }
            if(jobTimeHasOverflow(start, jobHours)){
                let overflow = getHoursOfOverflow(start, jobHours);
                if(overflow > 9){
                    let overflowBookings = exports.handleAllOverflows(overflow, start, soonest[index]._id, jobHours, bookingTitle, projectTitle, position, idx);
                    bookings = [...bookings, ...overflowBookings];
                    continue;
                }
                let splitBookings = exports.handleSplitBookings(overflow, start, soonest[index]._id, jobHours, bookingTitle, projectTitle, position, idx);
                bookings = [...bookings, ...splitBookings];
                continue;
            }
            let endOfJob = addHoursToDateString(start, jobHours);
            bookings.push(new Booking(soonest[index]._id, start, endOfJob, jobHours, bookingTitle, `${projectTitle} - ${bookingTitle} ${idx}`, position));
        } else {
            console.log('no conditional met');
        }
    }
    return await bookings
}

exports.handleSplitBookings = (overflow, start, id, jobHours, bookingTitle, projectTitle, position, idx) => {
    let splitBookings = [];
    let endOfDay = getEndOfDayDateTime(start);
    let nextMorning = getNextMorning(0, start);
    let endOfJob = addHoursToDateString(nextMorning, overflow);
    splitBookings.push(new Booking(id, start, endOfDay, jobHours, bookingTitle, `${projectTitle} - ${bookingTitle} ${idx}`, position));
    splitBookings.push(new Booking(id, nextMorning, endOfJob, jobHours, bookingTitle, `${projectTitle} - ${bookingTitle} ${idx}`, position));
    return splitBookings;
}

exports.handleAllOverflows = (overflow, start, id, jobHours, bookingTitle, projectTitle, position, i) => {
    let overflowBookings = [];
    let numberOfOverflows = Math.floor(overflow/9);

    let totalOverflowHours = overflow;
    let maxHoursToAdd = 9;

    let endOfDay = getEndOfDayDateTime(start);
    overflowBookings.push(new Booking(id, start, endOfDay, jobHours, bookingTitle, `${projectTitle} - ${bookingTitle} ${i}`, position));

    let nextMorning = getNextMorning(0, start);
    let endOfNextDay = getEndOfDayDateTime(nextMorning);
    overflowBookings.push(new Booking(id, nextMorning, endOfNextDay, jobHours, bookingTitle, `${projectTitle} - ${bookingTitle} ${i}`, position));
    totalOverflowHours-=9;

    for(var j=0; j<numberOfOverflows; j++){

        if(j == numberOfOverflows-1){
            nextMorning = getNextMorning(0, nextMorning);
            endOfNextDay = addHoursToDateString(nextMorning, totalOverflowHours);
            overflowBookings.push(new Booking(id, nextMorning, endOfNextDay, jobHours, bookingTitle, `${projectTitle} - ${bookingTitle} ${i}`, position));

        } else {
            nextMorning = getNextMorning(0, nextMorning);
            endOfNextDay = addHoursToDateString(nextMorning, maxHoursToAdd);
            overflowBookings.push(new Booking(id, nextMorning, endOfNextDay, jobHours, bookingTitle, `${projectTitle} - ${bookingTitle} ${i}`, position));
            totalOverflowHours-=9;
        }
    }

    let checked = overflowBookings.filter(b => {
        return b.endTime != b.startTime;
    });
    return checked;
}