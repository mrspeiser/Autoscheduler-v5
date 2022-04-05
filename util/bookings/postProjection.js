const Booking = require('./bookingObject');
let { getPositionHours, getJobLength } = require('../data/variableData');
let { getMixerBooking, reduceMixerBookings } = require('../dates/overlaps');
let { findSoonestBookingStart, emptyBookingsArray } = require('../data/filterBookings');
let { addHoursToDateString, afterHours, jobTimeHasOverflow, compareDates } = require('../dates/handleDateTime');
let { parseProjectDateTime, getNextMorning, getEndOfDayDateTime, getHoursOfOverflow} = require('../dates/getTimeString');

exports.getBookingsById = async (id, index, formData) => {
    let getSoonestBookingById = getBookingsForId(id);
    let start = formData.bookingStart === '' ? parseProjectDateTime() : formData.bookingStart

    formData.start = start;
    return 
}

exports.getBookingsR = async (booking, bookings) => {
    let position = booking.position;
    let bookingTitle = `${booking.projectTitle} - ${booking.position} ${booking.resourceId}`;
    let jobHours = getJobLength(position, booking.contentLength, languages, numberOfResources);
    let start = booking.start;
    let resource = booking.resourceId !== '' ? findSoonestBookingStart(position) : booking.resourceId;
    
    if(startTime === ''){
        bookings = exports.noPreviousBooking(bookings, ids[i], start, jobHours, bookingTitle, projectTitle, position, idx)
    } else if (emptyBookings.length > 0 && startTime !== ''){
        bookings = exports.emptyBookingsHasPreviousBooking(bookings)
    } else if (compareDates(startTime, soonest[index].bookings[soonest[index].bookings.length-1].end)){
        bookings = exports.projectBookingGreaterThanSoonestBooking(bookings);
    } else if(compareDates(soonest[index].bookings[soonest[index].bookings.length-1].end, startTime)){
        bookings = exports.resourceBookingGreaterThanSoonestBooing(bookings);
    } else {
        console.log('no condition met');
    }

    return getBookingsR(booking.nextBooking, bookings);
}



exports.aBooking = (jobHours, obj) => {
    let bookings = [];
    // console.log(obj);
    // console.log(jobHours);
    if(jobTimeHasOverflow(obj.start, jobHours)){
        let overflow = getHoursOfOverflow(obj.start, jobHours);
        // console.log(overflow);
        if(overflow > 9){
            let overflowBookings = exports.handleAllOverflows(overflow, obj.start, obj.id, jobHours, obj.step, obj.bookingTitle, obj.position);
            return bookings = [...bookings, ...overflowBookings];
        }
        let splitBookings = exports.handleSplitBookings(overflow, obj.start, obj.id, jobHours, obj.step, obj.bookingTitle, obj.position);
        // console.log(splitBookings);
        return splitBookings
        
    }
    let endOfJob = addHoursToDateString(obj.start, jobHours);
    bookings.push(new Booking(obj.id, obj.start, endOfJob, jobHours, obj.step, obj.bookingTitle, obj.position));
    // console.log(bookings);
    return bookings;
}

exports.getBookings2 = async (position, contentLength, languages, projectTitle, bookingStart) => {
    return async(bookingTitle, numOfResourcesToBook, resources, scheduleByLanguages) => {
        let jobTime = getJobLength(position, contentLength, languages, numOfResourcesToBook)
        
        let emptyBookingsForPosition = resources === null ? emptyBookingsArray(position) : resources; 
        let soonestBookingForPosition = resources === null ? findSoonestBookingStart(position) : getSoonestBookingsForIds(resources);
        let startTime = bookingStart === '' ? parseProjectDateTime() : bookingStart;

        if(scheduleByLanguages){
            console.log('schedule by languages should be false for now');
        } else if(useResourceIds.length > 0 && numOfResourcesToBook > 0 && useResourceIds.length === numOfResourcesToBook){
            return await createBookingObjectsLoop(position, jobTime, startTime, numOfResourcesToBook, emptyBookingsForPosition, soonestBookingForPosition,) // if we need to use the predetermined resources
        } else if(false){
            return await createBookingObjectsLoop(position, jobTime, )
        } else if(false) {

        } else {
            return await exports.createBookingObjectsLoop(startTime, numOfResourcesToBook, soonestBookingForPosition, projectTitle, bookingTitle); // find optimal
        }
    }
}

exports.getBookingsFromId = async (startTime, resourceId, projectTitle, position, jobLength, idx) => {
    
    if(jobTimeHasOverflow(startTime, jobLength)){

    } else {
        let endOfJob = addHoursToDateString(startTime, jobLength);
        return new Booking(resourceId, startTime, endOfJob, jobLength, position, `${projectTitle} - ${position} ${idx}`, position);

    }
}

exports.createBookingObjectsLoop = async (position, jobHours, startTime, numOfResourcesToBook, ids, projectTitle, bookingTitle) => {
    let bookings = [];
    let start = startTime;
    start = checkForQcOffset(position, jobHours, start);
    
    if(afterHours(startTime)){
        start = getNextMorning(0, startTime);
    }
    
    for(var i=0; i<numOfResourcesToBook; i++){
        let idx = i+1;
        let index = soonest.length-idx;

        if(startTime === ''){
            bookings = exports.noPreviousBooking(bookings, ids[i], start, jobHours, bookingTitle, projectTitle, position, idx)
        } else if (emptyBookings.length > 0 && startTime !== ''){
            bookings = exports.emptyBookingsHasPreviousBooking(bookings)
        } else if (compareDates(startTime, soonest[index].bookings[soonest[index].bookings.length-1].end)){
            bookings = exports.projectBookingGreaterThanSoonestBooking(bookings);
        } else if(compareDates(soonest[index].bookings[soonest[index].bookings.length-1].end, startTime)){
            bookings = exports.resourceBookingGreaterThanSoonestBooing(bookings);
        } else {
            console.log('no condition met');
        }
    }
    return bookings;
}

exports.noPreviousBooking = async (bookings, id, startTime, jobHours, bookingTitle, projectTitle, position, idx) => {
    if(jobTimeHasOverflow(startTime, jobHours)){
        let overflow = getHoursOfOverflow(startTime, jobHours);
        if(overflow > 9){
            let overflowBookings = exports.handleAllOverflows(overflow, startTime, id, jobHours, bookingTitle, projectTitle, position, idx);
            return bookings = [...bookings, ...overflowBookings];
            
        }
        let splitBookings = exports.handleSplitBookings(overflow, startTime, id, jobHours, bookingTitle, projectTitle, position, idx);
        return bookings = [...bookings, ...splitBookings];
        
    }
    let endOfJob = addHoursToDateString(startTime, jobHours);
    bookings.push(new Booking(id, startTime, endOfJob, jobHours, bookingTitle, `${projectTitle} - ${bookingTitle} ${idx}`, position))
    return bookings;
}

exports.emptyBookingsHasPreviousBooking = async (bookings) => {

    let start = prevBooking.endTime;
    if(jobTimeHasOverflow(start, jobHours)){
        let overflow = getHoursOfOverflow(start, jobHours);
        if(overflow > 9){
            let overflowBookings = exports.handleAllOverflows(overflow, start, emptyBookings[0]._id, jobHours, bookingTitle, projectTitle, position, idx);
            bookings = [...bookings, ...overflowBookings];
            emptyBookings.shift();
            return bookings
        }
        let splitBookings = exports.handleSplitBookings(overflow, start, emptyBookings[0]._id, jobHours, bookingTitle, projectTitle, position, idx);
        bookings = [...bookings, ...splitBookings];
        emptyBookings.shift();
        return bookings;
    }
    let endOfJob = addHoursToDateString(start, jobHours);
    
    bookings.push(new Booking(emptyBookings[0]._id, start, endOfJob, jobHours, bookingTitle, `${projectTitle} - ${bookingTitle} ${idx}`, position))
    emptyBookings.shift();
    return bookings
}

exports.projectBookingGreaterThanSoonestBooking = async (bookings) => {
    let start = prevBooking.endTime;
    if(afterHours(start)){
        start = getNextMorning(0, start);
    }
    if(jobTimeHasOverflow(start, jobHours)){
        let overflow = getHoursOfOverflow(start, jobHours);
        if(overflow > 9){
            let overflowBookings = exports.handleAllOverflows(overflow, start, soonest[index]._id, jobHours, bookingTitle, projectTitle, position, idx);
            return bookings = [...bookings, ...overflowBookings];
            
        }
        let splitBookings = exports.handleSplitBookings(overflow, start, soonest[index]._id, jobHours, bookingTitle, projectTitle, position, idx);
        return bookings = [...bookings, ...splitBookings];
        
    }
    let endOfJob = addHoursToDateString(start, jobHours);
    bookings.push(new Booking(soonest[index]._id, start, endOfJob, jobHours, bookingTitle, `${projectTitle} - ${bookingTitle} ${idx}`, position));
    return bookings;
}
exports.resourceBookingGreaterThanSoonestBooing = async (bookings) => {
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
                    return bookings = [...bookings, ...overflowBookings];
                    
                }
                let splitBookings = exports.handleSplitBookings(overflow, start, soonest[index]._id, jobHours, bookingTitle, projectTitle, position, idx);
                return bookings = [...bookings, ...splitBookings];
                
            }
            let endOfJob = addHoursToDateString(start, jobHours);
            bookings.push(new Booking(soonest[index]._id, start, endOfJob, jobHours, bookingTitle, `${projectTitle} - ${bookingTitle} ${idx}`, position));
        return bookings;
}

exports.getBookings = async (position, projectTitle, contentLength, languages, bookingTitle, prevJob, numOfResourcesToBook=1, useResource) => {
    let bookings = [];
    let numResources = numOfResourcesToBook;
    let nowTime = await parseProjectDateTime();
    // let jobHours = await getPositionHours(position, contentLength, languages, numOfResourcesToBook);
    let jobHours = await getJobLength(position, contentLength, languages, numOfResourcesToBook);
    console.log('job hours: '+jobHours)
    if(position === 'CONS'){
        position = 'MA';
    }

    let emptyBookings = await emptyBookingsArray(position);
    let prevBooking = prevJob || {endTime: ''};
    let soonest = await findSoonestBookingStart(position);

    console.log(' ');
    console.log('emptyBookings: ')
    emptyBookings.forEach(eb => console.log(eb.firstName+' '+eb.lastName));
    console.log(' ');
    if(soonest.length > 0){
        console.log('soonest booking or last booking for person ', soonest[0].bookings[soonest[0].bookings.length-1]);
        console.log(' ');
    }
 

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

exports.handleSplitBookings = (overflow, start, id, jobHours, note, bookingTitle, position) => {
    let splitBookings = [];
    let endOfDay = getEndOfDayDateTime(start);
    let nextMorning = getNextMorning(0, start);
    let endOfJob = addHoursToDateString(nextMorning, overflow);
    splitBookings.push(new Booking(id, start, endOfDay, jobHours, note, `${bookingTitle}`, position));
    splitBookings.push(new Booking(id, nextMorning, endOfJob, jobHours, note, `${bookingTitle}`, position));
    // console.log('split bookings: ', splitBookings);
    return splitBookings;
}

exports.handleAllOverflows = (overflow, start, id, jobHours, note, bookingTitle, position, i) => {
    let overflowBookings = [];
    let numberOfOverflows = Math.floor(overflow/9);

    let totalOverflowHours = overflow;
    let maxHoursToAdd = 9;

    let endOfDay = getEndOfDayDateTime(start);
    overflowBookings.push(new Booking(id, start, endOfDay, jobHours, note, `${bookingTitle}`, position));

    let nextMorning = getNextMorning(0, start);
    let endOfNextDay = getEndOfDayDateTime(nextMorning);
    overflowBookings.push(new Booking(id, nextMorning, endOfNextDay, jobHours, note, `${bookingTitle}`, position));
    totalOverflowHours-=9;

    for(var j=0; j<numberOfOverflows; j++){

        if(j == numberOfOverflows-1){
            nextMorning = getNextMorning(0, nextMorning);
            endOfNextDay = addHoursToDateString(nextMorning, totalOverflowHours);
            overflowBookings.push(new Booking(id, nextMorning, endOfNextDay, jobHours, bookingTitle, `${bookingTitle}`, position));

        } else {
            nextMorning = getNextMorning(0, nextMorning);
            endOfNextDay = addHoursToDateString(nextMorning, maxHoursToAdd);
            overflowBookings.push(new Booking(id, nextMorning, endOfNextDay, jobHours, bookingTitle, `${bookingTitle}`, position));
            totalOverflowHours-=9;
        }
    }

    let checked = overflowBookings.filter(b => {
        return b.endTime != b.startTime;
    });
    return checked;
}

exports.checkForQcOffset = async (position, jobHours, prevBooking) => {
    if(position === 'QC' && jobHours >= 4){
        if(jobTimeHasOverflow(prevBooking.startTime , 4)){
            let overflow = getHoursOfOverflow(prevBooking.startTime, 4);
            prevBooking.endTime = getNextMorning(0, prevBooking.startTime);
            prevBooking.endTime = addHoursToDateString(prevBooking.endTime, overflow);
            return prevBooking;
        
        } else {
            prevBooking.endTime = addHoursToDateString(prevBooking.startTime, 4);
            return prevBooking;
        }
    }
    return prevBooking;
}


let createBookingsLoop = (projectBookings, nextBooking, startTime) => {
    if(nextBooking === 'NULL'){
        return projectBookings;
    }
    let bookings = projectBookings[nextBooking].ids.map(id => {
        let rIndex = getIndex(nextBooking, id);
        let resourceStart = cache.resources.SORTED_RESOURCES[nextBooking][rIndex].bookings[bookings.length-1].end;
        
        if (compareDates(startTime, resourceStart)){
            bookings = exports.projectBookingGreaterThanSoonestBooking(bookings);
        } else if(compareDates(resourceStart, startTime)){
            bookings = exports.resourceBookingGreaterThanSoonestBooing(bookings);
        } else {
            console.log('no condition met');
        }
    
    });
    projectBookings[nextBooking].bookings = [...bookings];
    return createBookingsLoop(projectBookings, projectBookings[nextBooking].nextBooking, bookings[bookings.length-1].endTime);
}
