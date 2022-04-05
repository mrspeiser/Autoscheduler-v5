const cache = require('./cache');
const Booking = require('../util/bookings/bookingObject');
let { getCard } = require('../api/graphql/queries');
let { post, put, del } = require('../api/requests');
let { cleanBooking } = require('../util/data/reduceBookings');
let { returnPostBody, parseUpdateBody } = require('../util/bookings/postBody');
let { getEndOfDayDateTime, getHoursOfOverflow, getNextMorning, getNowTime } = require('../util/dates/getTimeString');
let { parseDateTime, jobTimeHasOverflow, startTimeHasOverflow, addHoursToDateString } = require('../util/dates/handleDateTime');
let { alreadyUpdated, translatePosition, getProjectBookingIndex, getResourceBookingIndex, getIndex, getResourceBookingById, getProjectBookingById } = require('../util/data/cacheAccess');


exports.updateBookings = async (i) => {
    let iteration = i || 0;
    let maxIteration = cache.projects.length;
    console.log('iteration: '+iteration+' max iteration: - ', maxIteration);
    if(iteration === maxIteration){
        return 'finished looping for updating bookings'
    } 
    let projectId = cache.projects[iteration]._id;
    console.log('Project ID: '+projectId);
    console.log(cache.updatedIds);
    let booking = await cache.bookingsByProjectId[projectId].find(b => b.metadata === "PENDING");
    let title = booking.title;
    let position = translatePosition(title);
    let re = new RegExp(title, 'g');
    let getAllBookingsByType = cache.bookingsByProjectId[projectId].filter(b => b.title.match(re));

    let lastBooking = getAllBookingsByType[getAllBookingsByType.length-1];
    let bookingIndex = getProjectBookingIndex(projectId, lastBooking._id);
    let rIndex = getIndex(position, lastBooking.resource);
    let resourceBookingIndex = getResourceBookingIndex(position, rIndex, lastBooking._id);

    let projectBookingRef = cache.bookingsByProjectId[projectId][bookingIndex];
    let resourceBookingRef = cache.resources.SORTED_RESOURCES[position][rIndex].bookings[resourceBookingIndex];
    
    let timeString = getNowTime();
    let currentDate = new Date(timeString);
    let bookingEnd = new Date(parseDateTime(lastBooking.end));

    if(currentDate >= bookingEnd){
    // if(true){
        if(jobTimeHasOverflow(parseDateTime(lastBooking.end), 1)){
            let overflow = getHoursOfOverflow(parseDateTime(lastBooking.end) , 1);
            let start = getNextMorning(0, parseDateTime(lastBooking.end));
            let end = addHoursToDateString(start, overflow);
            let newBooking = new Booking(lastBooking.resource, start, end, 1, lastBooking.note, lastBooking.title);
            let body = returnPostBody(newBooking, projectId);
        
            let nextResourceBooking = cache.resources.SORTED_RESOURCES[position][rIndex].bookings[resourceBookingIndex+1];
            let nextProjectBooking = cache.bookingsByProjectId[projectId][bookingIndex+1];

            let postedNewBooking = await post('/booking', body);
            cache.updatedIds.push(postedNewBooking._id);
            getAllBookingsByType.forEach(sb => cache.updatedIds.push(sb));

            if(position === 'MIXTECHS' || position === 'QC'){
                let pairedBookingTitle = cache.bookingsByProjectId[projectId][bookingIndex+1].title;
                // let pairedResourceBookingTitle = cache.resources.SORTED_RESOURCES[position][rIndex].bookings[resourceBookingIndex+1].title;
                let re2 = new RegExp(pairedBookingTitle, 'g');
                let pairedBookings = cache.bookingsByProjectId[projectId].filter(b => b.title.match(re2));
                let lastPairedBooking = pairedBookings[pairedBookings.length-1];
                
                let pairedrIndex = getIndex(position, lastPairedBooking.resource);
                let pairedResourceBookingIndex = getResourceBookingIndex(position, pairedrIndex, lastPairedBooking._id);
                let pairedProjectsBookingIndex = getProjectBookingIndex(projectId, lastPairedBooking._id);
                
                console.log('last paired booking title: '+lastPairedBooking.title);
                let newPairedBooking = new Booking(lastPairedBooking.resource, start, end, 1, lastPairedBooking.note, lastPairedBooking.title);
                let pairedBody = returnPostBody(newPairedBooking, projectId);
                let postedPair = await post('/booking', pairedBody);
                
                cache.updatedIds.push(lastBooking._id);
                pairedBookings.forEach(pb => cache.updatedIds.push(pb._id));

                postedPair.nextProjectBooking = lastPairedBooking.nextProjectBooking;
                postedPair.nextResourceBooking = lastPairedBooking.nextResourceBooking;
                exports.updateBookingLinks(position, pairedrIndex, pairedResourceBookingIndex, projectId, pairedProjectsBookingIndex, postedPair);
                cache.bookingsByProjectId[projectId].splice(pairedProjectsBookingIndex+1, 0, postedPair);
                cache.resources.SORTED_RESOURCES[position][pairedrIndex].bookings.splice(pairedResourceBookingIndex+1, 0, postedPair);

                nextProjectBooking = getProjectBookingById(projectId, postedPair.nextProjectBooking);
                nextResourceBooking = cache.resources.SORTED_RESOURCES[position][pairedrIndex].bookings[pairedResourceBookingIndex+2];

            }

            postedNewBooking.nextProjectBooking = projectBookingRef.nextProjectBooking;
            postedNewBooking.nextResourceBooking = resourceBookingRef.nextResourceBooking;
            exports.updateBookingLinks(position, rIndex, resourceBookingIndex, projectId, bookingIndex, postedNewBooking);

            if(nextResourceBooking === undefined){
                nextResourceBooking = 'NULL';
            }
            if(nextProjectBooking === undefined){
                nextProjectBooking = 'NULL';
            }

            cache.bookingsByProjectId[projectId].splice(bookingIndex+1, 0, postedNewBooking);
            cache.resources.SORTED_RESOURCES[position][rIndex].bookings.splice(resourceBookingIndex+1, 0, postedNewBooking);

            let result = await exports.returnNextRipple(postedNewBooking, nextResourceBooking, nextProjectBooking, 1, []);
            return await exports.updateBookings(iteration+1);
        } else {

            let jobStart = parseDateTime(lastBooking.start);
            let endOfJob = addHoursToDateString(parseDateTime(lastBooking.end), 1);
            exports.updateCache(position, rIndex, resourceBookingIndex, projectId, bookingIndex, jobStart, endOfJob);
            
            let cleanedBooking = cleanBooking(projectBookingRef);
            let body = parseUpdateBody(cleanedBooking);
            let update = await put(`/booking/${projectBookingRef._id}`, body);
            cache.updatedIds.push(update._id);

            let updatedResourceBooking = cache.resources.SORTED_RESOURCES[position][rIndex].bookings[resourceBookingIndex];
            let nextResourceBooking = cache.resources.SORTED_RESOURCES[position][rIndex].bookings[resourceBookingIndex+1];
            
            let updatedProjectBooking = cache.bookingsByProjectId[projectId][bookingIndex];
            let nextProjectBooking = cache.bookingsByProjectId[projectId][bookingIndex+1];

            if(position === 'MIXTECHS' || position === 'QC'){
                console.log('updating 2nd mixtech or qc')
                let pairedBookingTitle = cache.bookingsByProjectId[projectId][bookingIndex+1].title;
                console.log('paired booking title: '+pairedBookingTitle);
                let re2 = new RegExp(pairedBookingTitle, 'g');
                let pairedBookings = cache.bookingsByProjectId[projectId].filter(b => b.title.match(re2));
                console.log('length: '+pairedBookings.length);
                let lastPairedBooking = pairedBookings[pairedBookings.length-1];

                let pairedrIndex = getIndex(position, lastPairedBooking.resource);
                let pairedResourceBookingIndex = getResourceBookingIndex(position, pairedrIndex, lastPairedBooking._id);
                let pairedBookingIndex = getProjectBookingIndex(projectId, lastPairedBooking._id);

                exports.updateCache(position, pairedrIndex, pairedResourceBookingIndex, projectId, pairedBookingIndex, jobStart, endOfJob);

                let cleanedPairedBooking = cleanBooking(lastPairedBooking);
                let pairedBody = parseUpdateBody(cleanedPairedBooking);
                let updatedPairedBooking = await put(`/booking/${lastPairedBooking._id}`, pairedBody);
                cache.updatedIds.push(updatedPairedBooking._id);
                pairedBookings.forEach(pb => cache.updatedIds.push(pb._id));

                nextProjectBooking = getProjectBookingById(projectId, lastPairedBooking.nextProjectBooking);

            }
            
            if(nextResourceBooking === undefined){
                nextResourceBooking = 'NULL';
            }

            if(nextProjectBooking === undefined){
                nextProjectBooking = 'NULL';
            }
            console.log(nextProjectBooking);
            let result = await exports.returnNextRipple(updatedResourceBooking, nextResourceBooking, nextProjectBooking, 1, []); 
            return await exports.updateBookings(iteration+1);

        }
    } else {
        return await exports.updateBookings(iteration+1);
    }
}

exports.returnNextRipple = async (rippleBookingResourceRef, nextResourceBookingRipple, nextProjectBookingRipple, amount, accumulatedBookings ) => {
    console.log('accumulated length: ', accumulatedBookings.length);
    if(exports.checkForOverlap(rippleBookingResourceRef, nextResourceBookingRipple)){
        accumulatedBookings.push(nextResourceBookingRipple);
    }  
    if(nextProjectBookingRipple._id === undefined && accumulatedBookings.length > 0){
        let firstAccumulated = accumulatedBookings.shift();
        console.log('returning the first resourceBooking off accumulated');
        return await exports.ripple(firstAccumulated, amount, accumulatedBookings);
    } else if(nextProjectBookingRipple._id !== undefined) {
        console.log('returning nextProjectBookingRipple');
        return await exports.ripple(nextProjectBookingRipple, amount, accumulatedBookings);
    } else {
        console.log('returning 0');
        return await 0;
    }
}

exports.ripple = async (rippleBooking, amount, accumulatedBookings) => {
    let title = rippleBooking.title;
    let position = translatePosition(title);
    console.log('position is: '+position+' - title: '+title);
    let rIndex = getIndex(position, rippleBooking.resource);
    let projectId = rippleBooking.project;

    let resourceBookingIndex = getResourceBookingIndex(position, rIndex, rippleBooking._id);
    let rippleBookingResourceRef = cache.resources.SORTED_RESOURCES[position][rIndex].bookings[resourceBookingIndex];
    let nextResourceBookingIndex = getResourceBookingIndex(position, rIndex, rippleBooking.nextResourceBooking);
    let nextResourceProjectIndex = getProjectBookingIndex(rippleBooking.project, rippleBooking.nextResourceBooking);

    let projectsBookingIndex = getProjectBookingIndex(rippleBooking.project, rippleBooking._id);
    let rippleBookingEnd = parseDateTime(cache.bookingsByProjectId[rippleBooking.project][projectsBookingIndex].end);
    let rippleBookingStart = parseDateTime(cache.bookingsByProjectId[rippleBooking.project][projectsBookingIndex].start);
    // let rippleProjectResourceRef = cache.bookingsByProjectId[rippleBooking.project][projectsBookingIndex];

    let nextProjectBookingRipple = getProjectBookingById(rippleBooking.project, rippleBooking.nextProjectBooking);
    let nextResourceBookingRipple = getResourceBookingById(rIndex, position, rippleBooking.nextResourceBooking);

    if(alreadyUpdated(rippleBooking._id)){
        return await exports.returnNextRipple(rippleBookingResourceRef, nextResourceBookingRipple, nextProjectBookingRipple, amount, accumulatedBookings);
    }

    if(startTimeHasOverflow(rippleBookingStart, amount)) {

        if(rippleBookingResourceRef.title === nextProjectBookingRipple.title){
            // this booking title equals next project booking title which means it's a split booking 
            let followingResourceBooking = getResourceBookingById(rIndex, position, nextProjectBookingRipple.nextResourceBooking);
            let followingProjectBookingRipple = getProjectBookingById(nextProjectBookingRipple.project, nextProjectBookingRipple.nextProjectBooking);
            let previousResourcesBookingIndexRef = cache.resources.SORTED_RESOURCES[position][rIndex].bookings[resourceBookingIndex-1];
            let previousProjectBookingIndexRef = cache.bookingsByProjectId[rippleBooking.project][projectsBookingIndex-1];

            if(cache.resources.SORTED_RESOURCES[position][rIndex].bookings[resourceBookingIndex-1] !== undefined){
                if(previousResourcesBookingIndexRef.nextResourceBooking === rippleBooking._id){
                    // make sure nextResourceBooking is 'NULL' if this is a deliverables. you're getting the previousbooking and it's an ingest booking so it's linking back to the ingest if its a deliverables
                    cache.resources.SORTED_RESOURCES[position][rIndex].bookings[resourceBookingIndex-1].nextResourceBooking = nextResourceBookingRipple._id;
                }
                if(previousProjectBookingIndexRef.nextProjectBooking === rippleBooking._id){
                    cache.bookingsByProjectId[rippleBooking.project][projectsBookingIndex-1].nextProjectBooking = rippleBooking.nextProjectBooking;
                }
            }
            if(!alreadyUpdated(rippleBooking._id)){    
                let finishDelete = await del(`/booking/${rippleBooking._id}`);
                let deleteFromCache = exports.deleteFromCache(position, rIndex, resourceBookingIndex, projectId, projectsBookingIndex);
            }
            if(!alreadyUpdated(nextProjectBookingRipple._id)){      
                let bookingEnd = addHoursToDateString(parseDateTime(nextProjectBookingRipple.end), amount);
                cache.resources.SORTED_RESOURCES[position][rIndex].bookings[nextResourceBookingIndex-1].end = bookingEnd;
                cache.bookingsByProjectId[nextProjectBookingRipple.project][nextResourceProjectIndex-1].end = bookingEnd;
                
                let bookingReference = cache.bookingsByProjectId[nextProjectBookingRipple.project][nextResourceProjectIndex-1];
                let cleanedBooking = cleanBooking(bookingReference);
                let updateBody = parseUpdateBody(cleanedBooking);
                let update = await put(`/booking/${nextProjectBookingRipple._id}`, updateBody);
                cache.updatedIds.push(update._id);
            }
            // console.log(nextResourceBookingRipple);
            // console.log(followingResourceBooking);
            // console.log(followingProjectBookingRipple);
            
            return await exports.returnNextRipple(nextResourceBookingRipple, followingResourceBooking, followingProjectBookingRipple, amount, accumulatedBookings);

        } else {
            let overflow = getHoursOfOverflow(rippleBookingStart, amount);
            let nextMorning = getNextMorning(0, rippleBookingStart);
            let jobStart = addHoursToDateString(nextMorning, overflow);
            let endBookingOverflow = getHoursOfOverflow(rippleBookingEnd, amount);
            let endJobBooking = addHoursToDateString(nextMorning, endBookingOverflow);
            let cacheFinish = exports.updateCache(position, rIndex, resourceBookingIndex, projectId, projectsBookingIndex, jobStart, endJobBooking);
            
            if(!alreadyUpdated(rippleBooking._id)){    
                let cleanedBooking = cleanBooking(rippleBookingResourceRef);
                let updateBody = parseUpdateBody(cleanedBooking);
                let putResponse = await put(`/booking/${cleanedBooking._id}`, updateBody);
                cache.updatedIds.push(putResponse._id);
            }
            return await exports.returnNextRipple(rippleBookingResourceRef, nextResourceBookingRipple, nextProjectBookingRipple, amount, accumulatedBookings);
        }

    } else if(jobTimeHasOverflow(parseDateTime(rippleBookingEnd), amount)){
        let jobStart = addHoursToDateString(rippleBookingStart, amount);
        let endOfDay = getEndOfDayDateTime(rippleBookingEnd);
        let overflow = getHoursOfOverflow(rippleBookingEnd, amount);
        let nextMorning = getNextMorning(0, rippleBookingEnd);
        let endOfJob = addHoursToDateString(nextMorning, overflow);
        
        if(!alreadyUpdated(rippleBooking._id)){
            let bookingConstructor = new Booking(rippleBooking.resource, nextMorning, endOfJob, amount, rippleBooking.note, rippleBooking.title);
            let body = returnPostBody(bookingConstructor, rippleBooking.project);
            let newBooking = await post('/booking', body);
            cache.updatedIds.push(newBooking._id);
            newBooking.nextProjectBooking = rippleBooking.nextProjectBooking;
            newBooking.nextResourceBooking = rippleBooking.nextResourceBooking;
            let cacheFinish = exports.updateCache(position, rIndex, resourceBookingIndex, projectId, projectsBookingIndex, jobStart, endOfDay);
            let updateLinksFinish = exports.updateBookingLinks(position, rIndex, resourceBookingIndex, rippleBooking.project, projectsBookingIndex, newBooking);

            cache.bookingsByProjectId[rippleBooking.project].splice(projectsBookingIndex+1, 0, newBooking);
            cache.resources.SORTED_RESOURCES[position][rIndex].bookings.splice(resourceBookingIndex+1, 0, newBooking);
            
            let cleanedBooking = cleanBooking(rippleBookingResourceRef);
            let updateBody = parseUpdateBody(cleanedBooking);
            let putResponse = await put(`/booking/${cleanedBooking._id}`, updateBody);
            cache.updatedIds.push(putResponse._id);
        }
        return await exports.returnNextRipple(rippleBookingResourceRef, nextResourceBookingRipple, nextProjectBookingRipple, amount, accumulatedBookings);

    } else {
        let bookingStart = addHoursToDateString(rippleBookingStart, amount);
        let bookingEnd = addHoursToDateString(rippleBookingEnd, amount);
        let cacheFinish = exports.updateCache(position, rIndex, resourceBookingIndex, projectId, projectsBookingIndex, bookingStart, bookingEnd)
        
        if(!alreadyUpdated(rippleBooking._id)){
            let cleanedBooking = cleanBooking(rippleBookingResourceRef);
            let body = parseUpdateBody(cleanedBooking);
            let putResponse = await put(`/booking/${cleanedBooking._id}`, body);
            cache.updatedIds.push(putResponse._id);
        }
        return await exports.returnNextRipple(rippleBookingResourceRef, nextResourceBookingRipple, nextProjectBookingRipple, amount, accumulatedBookings);
    }
}

exports.updateProject = async (body) => {
    let cardData = await getCard(body.data.card.id);
    let projectTitle = await cardData.data.card.title;
    let projectIndex = getProjectIndexByTitle(projectTitle);
    let project = cache.projects[projectIndex];
    
    let firstFoundPending = cache.bookingsByProjectId[project._id].find(b => b.metadata === "PENDING");
    let bookingTitle = firstFoundPending.title
    let position = translatePosition(bookingTitle);
    let match = bookingTitle.replace(/\d/, '');
    let re = new RegExp(match, 'g');
    let getAllBookingsByType = cache.bookingsByProjectId[project._id].filter(b => b.title.match(re));

    getAllBookingsByType.forEach(bo => {
        let rIndex = getIndex(position, bo.resource);
        let bookingIndex = getProjectBookingIndex(project._id, bo._id);
        let resourceBookingIndex = getResourceBookingIndex(position, rIndex, bo._id);
       
        cache.bookingsByProjectId[project._id][bookingIndex].metadata = "COMPLETE";
        cache.resources.SORTED_RESOURCES[position][rIndex].bookings[resourceBookingIndex].metadata = "COMPLETE";
        
        let ref = cache.resources.SORTED_RESOURCES[position][rIndex].bookings[resourceBookingIndex];
        let cleanBooking = cleanBooking(ref)
        let body = parseUpdateBody(cleanBooking);
        let updateResponse = put(`/booking/${cleanBooking._id}`, body);
        console.log(updateResponse);
    });  
}


exports.checkForOverlap = (currentBooking, newBooking) => {
    // the currentBooking is the the retrieved booking from hubplanner, the newBooking is the booking we are checking to make sure it doesn't overlap
    if(newBooking.start === undefined || newBooking.start === 'NULL' || newBooking.end === 'NULL' || newBooking === 'NULL' || newBooking === undefined ||  newBooking.end === undefined || Object.keys(newBooking).length === 0){
        return false;
    }
    let booking1start = new Date(parseDateTime(currentBooking.start));
    let booking1end = new Date(parseDateTime(currentBooking.end));
    let booking2start = new Date(parseDateTime(newBooking.start));
    let booking2end = new Date(parseDateTime(newBooking.end));
    
    if(booking1start >= booking2start && booking1start <= booking2end){
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

exports.updateCache = (position, rIndex, resourceBookingIndex, projectId, projectsBookingIndex, bookingStart, bookingEnd) => {
    cache.bookingsByProjectId[projectId][projectsBookingIndex].start = bookingStart
    cache.bookingsByProjectId[projectId][projectsBookingIndex].end = bookingEnd;
    cache.resources.SORTED_RESOURCES[position][rIndex].bookings[resourceBookingIndex].start = bookingStart;                
    cache.resources.SORTED_RESOURCES[position][rIndex].bookings[resourceBookingIndex].end = bookingEnd;
}

exports.updateBookingLinks = (position, rIndex, resourceBookingIndex, projectId, projectsBookingIndex, newBooking) => {
    cache.bookingsByProjectId[projectId][projectsBookingIndex].nextProjectBooking = newBooking._id;
    cache.bookingsByProjectId[projectId][projectsBookingIndex].nextResourceBooking = newBooking._id;
    cache.resources.SORTED_RESOURCES[position][rIndex].bookings[resourceBookingIndex].nextProjectBooking = newBooking._id;                
    cache.resources.SORTED_RESOURCES[position][rIndex].bookings[resourceBookingIndex].nextResourceBooking = newBooking._id;  
}

exports.deleteFromCache = (position, rIndex, resourceBookingIndex, projectId, projectsBookingIndex) => {
    console.log(position);
    console.log(rIndex);
    console.log(resourceBookingIndex);
    // console.log('about to delete ');
    // console.log(cache.bookingsByProjectId[projectId][projectsBookingIndex]);
    // console.log(cache.resources.SORTED_RESOURCES[position][rIndex].booking[resourceBookingIndex]);
    cache.bookingsByProjectId[projectId].splice(projectsBookingIndex, 1);
    cache.resources.SORTED_RESOURCES[position][rIndex].bookings.splice(resourceBookingIndex, 1);
}