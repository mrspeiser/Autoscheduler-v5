const cache = require('../../core/cache');

exports.getPositionById = (id) => {
    let found = cache.resources.ALL_RESOURCES.find(r => r._id === id);
    return exports.translateLastname(found.lastName);
}
exports.translateLastname = (lastName) => {
    let split = lastName.split(' - ')[1];
    if(split === 'MA'){
        return 'MA'
    } else if(split === 'Mixer'){
        return 'MIXER'
    } else if(split === 'QC'){
        return 'QC';
    } else if(split === 'MT'){
        return 'MIXTECH'
    } else {
        console.log('COULD NOT FIND MATCH IN LAST NAME');
    }
}
exports.addProject = (projectBooking) => {
    let newProject = Object.assign({}, projectBooking);
    newProject.nextProject = 'NULL';
    // console.log(cache.projects);
    let length = cache.projects.length-1;
    if(cache.projects.length > 0){
        cache.projects[length].nextProject = newProject._id;
    }
    cache.projects.push(newProject);
    return newProject;
}


exports.getResourceBookingById = (rIndex, position, bookingId) => {
    if(bookingId === 'NULL'){
        return 'NULL';
    }
    let booking = cache.resources.SORTED_RESOURCES[position][rIndex].bookings.find(b => b._id === bookingId);
    return {...booking};
}

exports.getLastBooking = (resourceId, position, step) => {
    if(step !== undefined){
        let rIndex = exports.getIndex(position, resourceId);
        if(cache.resources.SORTED_RESOURCES[position][rIndex].bookings.length === 0){
            return 'NULL'
        }
        let bookings = cache.resources.SORTED_RESOURCES[position][rIndex].bookings;
        let lastInitialBooking = exports.reduceMixerBookings(bookings);
        return lastInitialBooking;
    }
    let rIndex = exports.getIndex(position, resourceId);
    // console.log(cache.resources.SORTED_RESOURCES[position][rIndex]);
    if(cache.resources.SORTED_RESOURCES[position][rIndex].bookings.length === 0){
        return 'NULL';
    }
    let lastBooking = cache.resources.SORTED_RESOURCES[position][rIndex].bookings[cache.resources.SORTED_RESOURCES[position][rIndex].bookings.length-1];
    return lastBooking
}

exports.getLastBookingEnd = (resourceId, pos) => {
    let position = exports.translateNewPosition(pos);
    let rIndex = exports.getIndex(position, resourceId);
    let bookings = cache.resources.SORTED_RESOURCES[position][rIndex].bookings;
    let lastBooking = cache.resources.SORTED_RESOURCES[position][rIndex].bookings.length-1;
    if(bookings.length === 0){
        return 0
    }
    return bookings[lastBooking].end;

}
exports.translateNewPosition = pos => {
    if(pos === 'MIXTECH'){
        return 'MIXTECHS';
    } else if(pos === 'MIXER'){
        return 'MIXERS';
    } else {
        return pos;
    }
}
exports.getLastIngestBooking = (resourceId, position, step) => {
    if(step !== undefined){
        let rIndex = exports.getIndex(position, resourceId);
        if(cache.resources.SORTED_RESOURCES[position][rIndex].bookings.length === 0){
            return 'NULL'
        }
        let bookings = cache.resources.SORTED_RESOURCES[position][rIndex].bookings;
        let lastInitialBooking = exports.reduceMABookings(bookings);
        // console.log('last initial bookings are: ', lastInitialBooking);
        return lastInitialBooking;
    }
    let rIndex = exports.getIndex(position, resourceId);
    // console.log(cache.resources.SORTED_RESOURCES[position][rIndex]);
    if(cache.resources.SORTED_RESOURCES[position][rIndex].bookings.length === 0){
        return 'NULL';
    }
    let lastBooking = cache.resources.SORTED_RESOURCES[position][rIndex].bookings[cache.resources.SORTED_RESOURCES[position][rIndex].bookings.length-1];
    return lastBooking
}

exports.reduceMABookings = (bookings) => {
    let reducedIngest = bookings.reduce((acc, cv) => {
        if(cv.note === 'Ingest' || cv.note === 'ingest'){
            // console.log('cv is: ', cv);
            acc.push(cv);
            return acc;
        }
        return acc;
    }, []);
    // console.log('reducedIngest: ',reducedIngest);
    return reducedIngest;
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

exports.getProjectBookingById = (projectId, bookingId) => {
    if(bookingId === 'NULL'){
        return 'NULL';
    }
    let booking = cache.bookingsByProjectId[projectId].find(b => b._id === bookingId);
    return {...booking}
}

exports.checkForExistingTitle = (title) => {
    let result = cache.projects.find(p => p.name === title);
    if(result === undefined || result === 'undefined'){
        return false;
    } else {
        return true;
    }
}

exports.getResourceBookings = (resourceId, position) => {
    if(position === 'MIXER'){
        position = 'MIXERS';
    } else if(position === 'MIXTECH'){
        position = 'MIXTECHS'
    }
    let resourceIndex = exports.getIndex(position, resourceId);
    return [...cache.resources.SORTED_RESOURCES[position][resourceIndex].bookings];
}

exports.getUpdatedProjects = (bookingsToUpdate) => {
    // return the ids of the modified projects so that we can update each one from a certain position
    let projectIds = [];

    return projectIds
}

exports.linkProjectBookings = (bookings) => {
    return bookings.map((b, i, a) => {
        if(i === a.length-1){
            b.nextProjectBooking = 'NULL'
            return b
        }
        b.nextProjectBooking = a[i+1]._id;
        return b
    });
}
exports.concatAll = (...args) => {
    let allbookings = [];
    args.forEach(ba => ba.forEach(ib => allbookings.push(ib)));
    return allbookings;
}

exports.concatAllArrays = (...args) => {
    let allbookings = [];
    args.forEach(arr => arr.forEach(a => a.forEach(b => allbookings.push(b))));
    return allbookings;
}

exports.addResourceBookings = (bookings) => {
    // console.log(bookings);
    return bookings.map((b, i, a) => {
        let RID = b.resource;
        let title = b.title;
        let position = exports.translatePosition(title);
        let rIndex = exports.getIndex(position, RID);
        // console.log(' ');
        // console.log('Original resource ID: '+RID+' resource index is: '+rIndex+' for position: '+position+' booking title: '+title);
        // console.log(' ');
        if(cache.resources.SORTED_RESOURCES[position][rIndex].bookings.length > 0){
            let lbIndex = cache.resources.SORTED_RESOURCES[position][rIndex].bookings.length-1
            cache.resources.SORTED_RESOURCES[position][rIndex].bookings[lbIndex].nextResourceBooking = b._id;
            // console.log('last booking updated: ', lastBooking);
        }
        b.nextResourceBooking = 'NULL';
        cache.resources.SORTED_RESOURCES[position][rIndex].bookings.push(b);
        return b
    });
}



exports.addProjectBookings = (bookings) => {
    let PID = bookings[0].project;
    cache.bookingsByProjectId[PID] = [...bookings];
}

exports.translatePosition = (title) => {
    // console.log(title);
    let mt = RegExp('- MixTech*');
    let qc = RegExp('- QC*');
    let ma1 = RegExp('- Ingest');
    let ma2 = RegExp('- deliverables');
    let cons = RegExp('- Consolidation*', 'i');
    let mixer1 = RegExp('- initial');
    let mixer2 = RegExp('- finalmix');

    if(ma1.test(title) || ma2.test(title)){
        return 'MA'
    } else if(mixer1.test(title) || mixer2.test(title)){
        return 'MIXERS'
    } else if(mt.test(title)){
        return 'MIXTECHS'
    } else if(qc.test(title)){
        return 'QC'
    } else if (cons.test(title)) {
        return 'MA'
    } else {
        console.log('ERROR, NO MATCH FOUND FROM TITLE: ', title);
    }
}

exports.getIndex = (position, resourceId) => {
    // console.log('position: '+position+' RID: '+resourceId);
    return cache.resources.SORTED_RESOURCES[position].findIndex(o => o._id === resourceId);
}

exports.getProjectBookingIndex = (projectId, bookingId) => {
    if(bookingId === 'NULL'){
        return 'NULL';
    }
    return cache.bookingsByProjectId[projectId].findIndex(b => b._id === bookingId);
}

exports.getResourceBookingIndex = (position, resourceIndex, bookingId) => {
    if(bookingId === 'NULL'){
        return 'NULL';
    }
    return cache.resources.SORTED_RESOURCES[position][resourceIndex].bookings.findIndex(b => b._id === bookingId);
}

exports.getProjectIndexByTitle = (title) => {
    return cache.projects.findIndex(p => p.name === title);
}

exports.alreadyUpdated = (bookingId) => {
    return cache.updatedIds.includes(bookingId);
}