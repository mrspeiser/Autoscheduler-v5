let { parseDateTime } = require('./handleDateTime');
let { ripple, returnNextRipple } = require('../../core/updates');
let { addHoursToDateString, jobTimeHasOverflow } = require('./handleDateTime');
let { getIndex, getProjectBookingById, getResourceBookingById, getResourceBookings } = require('../data/cacheAccess');
let { getEndOfDayDateTime, getHoursOfOverflow, getNextMorning, getHoursFromDateString } = require('./getTimeString');


exports.handleOverlaps = (model, bookings) => {
    // get the overlapped bookings
    let overlappedBookings = exports.getBookingOverlaps(bookings);
    if(overlappedBookings > 0){
        console.log('overlapped bookings: ', overlappedBookings);
    }
    model.bookingsToRipple = [];
    return bookings;
}
exports.getBookingOverlaps = (bookings) => {
    let resourceId = bookings[0].id;
    let position = bookings[0].position;
    
    let resourceBookings = getResourceBookings(resourceId, position);

    let overlappedBookings = [];
    bookings.forEach(b => {
        // check each new booking against each booking inside the resourceBookings
        console.log('new booking is: ',b);
        console.log('current resource bookings are: ',resourceBookings);
        let check = exports.checkForBookingOverlaps(b, resourceBookings);
        if(check.length > 0){
            check.forEach(ob => overlappedBookings.push(ob));
        }
    });
    return overlappedBookings;
}
exports.checkForBookingOverlaps = (newBooking, allBookings) => {
    // return the bookings that overlap with the amount it overlaps
    let filtered = exports.checkBookingWithAllBookings(newBooking, allBookings);
    // collect the full bookings
    let collectAllSplitBookings = exports.collectAllSplits(newBooking.id, newBooking.position, filtered);
    // determine whether to move the new bookings OR to ripple the currentBookings
    return collectAllSplitBookings;
}

exports.getOverlaps = (bookings) => {
    let resourceId = bookings[0].id;
    let resourceBookings = getResourceBookings(resourceId, bookings[0].position);

    let overlappedBookings = [];
    
    bookings.forEach(b => {
       let checked = exports.checkBookingWithAllBookings(b, resourceBookings);
       if(checked !== false){
           overlappedBookings.push(checked);
       } 
    });
    return overlappedBookings;
}

exports.collectAllSplits = (resourceid, position, overlappedBookings) => {
    let resourceBookings = getResourceBookings(resourceid, position);
    let collected = [];
    overlappedBookings.forEach(ob => {
        resourceBookings.forEach(b => {
            if(ob.title === b.title){
                collected.push(b);
            }
        });
    });
    return collected;
}

exports.checkBookingWithAllBookings = (booking, resourceBookings) => {
    return resourceBookings.filter(v => {
        return exports.checkForOverlap(v, booking);
    });
}

exports.calculateMoveAmt = (firstOverlappedBookingStart, endTimeLastBooking) => {
    let endHour = getHoursFromDateString(endTimeLastBooking);
    let startHour = getHoursFromDateString(firstOverlappedBookingStart);
    let amount = endHour-startHour;
    return amount;
}

exports.moveBookings = async (rippleBooking, moveAmount) => {
    let result = await ripple(rippleBooking, moveAmount, []);
}

exports.getMixerBooking = async (booking, reducedMixerBookings, jobHours) => {
    console.log('booking is: ', booking);
    let currentStart = parseDateTime(booking.end);
    // console.log('reduced mixer bookings: ', reducedMixerBookings);
    console.log('current start: '+currentStart);
    let rIndex = getIndex('MIXERS', booking.resource);
    let nextProjectBookingRipple = getProjectBookingById(booking.project, booking.nextProjectBooking);
    let nextResourceBookingRipple = getResourceBookingById(rIndex, 'MIXERS', booking.nextResourceBooking);

    if(getHoursFromDateString(parseDateTime(currentStart))===18){
        currentStart = getNextMorning(0, currentStart);
    }
    
    if(jobTimeHasOverflow(currentStart, jobHours)){
        let overflow = getHoursOfOverflow(currentStart, jobHours);
        let startTime = currentStart;
        let endOfDay = getEndOfDayDateTime(currentStart);
        let nextMorning = getNextMorning(0, currentStart);
        let endOfJob = addHoursToDateString(nextMorning, overflow);
        let split1Overlaps = reducedMixerBookings.finalmix.filter(b => {
            return exports.checkForOverlap(b, {start:startTime, end:endOfDay});
        });
        let split2Overlaps = reducedMixerBookings.finalmix.filter(b => {
            return exports.checkForOverlap(b, {start:nextMorning, end:endOfJob});
        });
        console.log('overlaps:');
        console.log(split1Overlaps);
        console.log(split2Overlaps);

        if(split1Overlaps.length > 0 && split2Overlaps.length > 0){
            let overlap1Amount = exports.getOverlapDurationHours(split1Overlaps[0].start, endOfDay);
            let overlap2Amount = exports.getOverlapDurationHours(split2Overlaps[0].start, endOfDay);
            let totalOverlap = overlap1Amount+overlap2Amount;
            if(totalOverlap < .5*jobHours && totalOverlap > 0){
                let rippleReturned = await returnNextRipple(split1Overlaps[0], nextResourceBookingRipple, nextProjectBookingRipple, totalOverlap, []);
                return await currentStart;
            } else {
                return await exports.getMixerBooking(split2Overlaps[0], reducedMixerBookings, jobHours);
            }
        } else {
            return await currentStart;
        }
    } else {
        let startTime = currentStart;
        let endOfJob = addHoursToDateString(startTime, jobHours);
        console.log('end of job: '+endOfJob);
        let finalMixOverlaps = reducedMixerBookings.finalmix.filter(b => {
            return exports.checkForOverlap(b, {start: startTime, end:endOfJob});
        });
        console.log(finalMixOverlaps);
        if(finalMixOverlaps.length > 0){
            let overlapAmount = exports.getOverlapDurationHours(finalMixOverlaps[0].start, endOfJob);
            if(overlapAmount < .5*jobHours && overlapAmount !== 0){
                let rippleReturned = await returnNextRipple(finalMixOverlaps[0], nextResourceBookingRipple, nextProjectBookingRipple, overlapAmount, []);
                return currentStart;
            } else {
                return await exports.getMixerBooking(finalMixOverlaps[0], reducedMixerBookings, jobHours);
            }
        } else {
            return await currentStart;
        }
    }
}


exports.getMixerBookingSync = (booking, reducedMixerBookings, jobHours) => {
    console.log('booking is: ', booking);
    let currentStart = parseDateTime(booking.end);
    // console.log('reduced mixer bookings: ', reducedMixerBookings);
    console.log('current start: '+currentStart);
    let rIndex = getIndex('MIXERS', booking.resource);
    let nextProjectBookingRipple = getProjectBookingById(booking.project, booking.nextProjectBooking);
    let nextResourceBookingRipple = getResourceBookingById(rIndex, 'MIXERS', booking.nextResourceBooking);

    if(getHoursFromDateString(parseDateTime(currentStart))===18){
        currentStart = getNextMorning(0, currentStart);
    }
    
    if(jobTimeHasOverflow(currentStart, jobHours)){
        let overflow = getHoursOfOverflow(currentStart, jobHours);
        let startTime = currentStart;
        let endOfDay = getEndOfDayDateTime(currentStart);
        let nextMorning = getNextMorning(0, currentStart);
        let endOfJob = addHoursToDateString(nextMorning, overflow);
        let split1Overlaps = reducedMixerBookings.finalmix.filter(b => {
            return exports.checkForOverlap(b, {start:startTime, end:endOfDay});
        });
        let split2Overlaps = reducedMixerBookings.finalmix.filter(b => {
            return exports.checkForOverlap(b, {start:nextMorning, end:endOfJob});
        });
        console.log('overlaps:');
        console.log(split1Overlaps);
        console.log(split2Overlaps);

        if(split1Overlaps.length > 0 && split2Overlaps.length > 0){
            let overlap1Amount = exports.getOverlapDurationHours(split1Overlaps[0].start, endOfDay);
            let overlap2Amount = exports.getOverlapDurationHours(split2Overlaps[0].start, endOfDay);
            let totalOverlap = overlap1Amount+overlap2Amount;
            // if(totalOverlap < .5*jobHours && totalOverlap > 0){
                // let rippleReturned = await returnNextRipple(split1Overlaps[0], nextResourceBookingRipple, nextProjectBookingRipple, totalOverlap, []);
                // return await currentStart;
            // } else {
            let allMatchingTitles = reducedMixerBookings.finalmix.filter(b => {
                b.title === split2Overlaps.title;
            });
            if(allMatchingTitles.length > 1){
                return allMatchingTitles[1];
            }
            return split2Overlaps[0] //exports.getMixerBooking(split2Overlaps[0], reducedMixerBookings, jobHours);
            // }
        } else {
            return booking;
        }
    } else {
        let startTime = currentStart;
        let endOfJob = addHoursToDateString(startTime, jobHours);
        console.log('end of job: '+endOfJob);
        let finalMixOverlaps = reducedMixerBookings.finalmix.filter(b => {
            return exports.checkForOverlap(b, {start: startTime, end:endOfJob});
        });
        console.log(finalMixOverlaps);
        if(finalMixOverlaps.length > 0){
            let overlapAmount = exports.getOverlapDurationHours(finalMixOverlaps[0].start, endOfJob);
            // if(overlapAmount < .5*jobHours && overlapAmount !== 0){

                // let rippleReturned = await returnNextRipple(finalMixOverlaps[0], nextResourceBookingRipple, nextProjectBookingRipple, overlapAmount, []);
                // return currentStart;
            // } else {
                return finalMixOverlaps[0] // exports.getMixerBooking(finalMixOverlaps[0], reducedMixerBookings, jobHours);
            // }
        } else {
            return booking;
        }
    }
}


exports.reduceMixerBookings = (bookings) => {
    let reducedMixerBookings = bookings.reduce((acc, cv) => {
        if(cv.note == 'initial'){
            acc.initial.push(cv);
            return acc;
        }
        acc.finalmix.push(cv);
        return acc;
    }, {finalmix: [], initial: []})
    return reducedMixerBookings;
}

exports.overlapsExistIn = (arrayOfBookings) => {
    console.log('running check on overlaps');
    if(arrayOfBookings){
        return arrayOfBookings.some((b, i, a) => {
            if(i == a.length-1){
                return;
            }
            b.start = parseDateTime(b.start);
            b.end = parseDateTime(b.end);
            // console.log('\n')
            // console.log('new times: '+b.start+ ' '+ b.end);

            a[i+1].start = parseDateTime(a[i+1].start);
            a[i+1].end = parseDateTime(a[i+1].end);
            // console.log('next times: '+a[i+1].start + ' '+a[i+1].end);
            
            let resultFromCheck = exports.checkForOverlap(b, a[i+1])
            // console.log('check result: '+resultFromCheck);
            return resultFromCheck;
        })
    } else {
        console.log(typeof(arrayOfBookings));
        console.log('error, bookings array returned false from if check');
    }
}

exports.getIndexBookingOverlap = (arrayOfBookings) => {
    //return the index of the booking that has the first occurance of an overlap
    return arrayOfBookings.findIndex(exports.checkForIndexOverlap)
}


exports.getBookingDuration = (booking, allbookings) => {
    // check to see if the booking is a split booking
    let bookingTitle = booking.title;
    let splitBookings = allbookings.filter(b => b.title == bookingTitle);
    let bookingDuration = booking.details.bookedMinutes/60;
    let splitBookingsDuration = 0;
    if(splitBookings.length > 0){
        splitBookings.forEach(sb => splitBookingsDuration += sb.details.bookedMinutes/60);
    }
    return bookingDuration+splitBookings;
}

exports.getOverlapDurationHours = (indexBookingStart, nextBookingEnd) => {
    //return the duration as an integer representing the duration in hours
    let overlappedBookingStart = getHoursFromDateString(parseDateTime(indexBookingStart));
    let endOfNewBooking = getHoursFromDateString(parseDateTime(nextBookingEnd));
    totalOverlap = endOfNewBooking-overlappedBookingStart
    return totalOverlap
}


exports.getConflicts = (seperatedBookings, key, bookingToCheck) => {
    console.log('booking to check is: ', bookingToCheck);
    let conflicts = seperatedBookings[key].reduce((acc, cv, i) => {
        if(exports.checkForOverlap(cv, bookingToCheck)){
            acc.push({booking: cv, index: i});
            return acc;
        }
        return acc;
    }, []);
    return conflicts;
}

exports.checkForOverlapAndAmount = (currentBooking, newBooking) => {
    // console.log('inside check for overlaps function')
    // the currentBooking is the the retrieved booking from hubplanner
    // the newBooking is the booking we are checking to make sure it doesn't overlap
    let booking1start = new Date(parseDateTime(currentBooking.start));
    let booking1end = new Date(parseDateTime(currentBooking.end));
    let booking2start = new Date(parseDateTime(newBooking.startTime));
    let booking2end = new Date(parseDateTime(newBooking.endTime));
    
    if(booking1start >= booking2start && booking1start < booking2end){
        let overlapAmount = exports.calculateOverlap(currentBooking, newBooking);
        return {overlappedBooking:currentBooking, amount:overlapAmount};
    }
    if(booking1end > booking2start && booking1end <= booking2end){
        let overlapAmount = exports.calculateOverlap(currentBooking, newBooking);
        return {overlappedBooking:currentBooking, amount:overlapAmount};
    }
    if(booking2start >= booking1start && booking2start < booking1end){
        let overlapAmount = exports.calculateOverlap(currentBooking, newBooking);
        return {overlappedBooking:currentBooking, amount:overlapAmount};
    }
    if(booking2end > booking1start && booking2end <= booking1end){
        let overlapAmount = exports.calculateOverlap(currentBooking, newBooking);
        return {overlappedBooking:currentBooking, amount:overlapAmount};
    }
    if(booking2start == booking1start && booking2end == booking1end){
        let overlapAmount = exports.calculateOverlap(currentBooking, newBooking);
        return {overlappedBooking:currentBooking, amount:overlapAmount};
    }
    return false;
}


exports.checkForOverlap = (currentBooking, newBooking) => {
    // console.log('inside check for overlaps function')
    // the currentBooking is the the retrieved booking from hubplanner
    // the newBooking is the booking we are checking to make sure it doesn't overlap
    let booking1start = new Date(parseDateTime(currentBooking.start));
    let booking1end = new Date(parseDateTime(currentBooking.end));
    let booking2start = new Date(parseDateTime(newBooking.start));
    let booking2end = new Date(parseDateTime(newBooking.end));
    
    if(booking1start >= booking2start && booking1start < booking2end){
        return true;
    }
    if(booking1end > booking2start && booking1end <= booking2end){
        return true;
    }
    if(booking2start >= booking1start && booking2start < booking1end){
        return true;
    }
    if(booking2end > booking1start && booking2end <= booking1end){
        return true;
    }
    if(booking2start == booking1start && booking2end == booking1end){
        return true;
    }
    return false;
}

exports.checkForIndexOverlap = (element, index, array) => {
    // console.log('inside check for index overlap', array[2]);
    // the currentBooking is the the retrieved booking from hubplanner
    // the newBooking is the booking we are checking to make sure it doesn't overlap
    let booking1start = new Date(parseDateTime(element.start));
    let booking1end = new Date(parseDateTime(element.end));
    let booking2start = new Date(parseDateTime(array[index+1].start));
    let booking2end = new Date(parseDateTime(array[index+1].end));
    
    if(booking1start >= booking2start && booking1start <= booking2end){
        return index;
    }
    if(booking1end > booking2start && booking1end <= booking2end){
        return index;
    }
    if(booking2start >= booking1start && booking2start < booking1end){
        return index;
    }
    if(booking2end > booking1start && booking2end <= booking1end){
        return index;
    }
    if(booking2start == booking1start && booking2end == booking1end){
        return index;
    }
    return false;
}