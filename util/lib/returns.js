let { getPositionById, getLastBookingEnd } = require('../data/cacheAccess');
let { aBooking } = require('../bookings/postProjection');
let { returnFarthestStart, addHoursToDateString } = require('../dates/handleDateTime');
let { handleOverlaps } = require('../dates/overlaps');

exports.bookSequentially = (model) => {
    model.phases.forEach(phase => {
        for(var i=0; i<model.numResourcesPerPhase[phase]; i++){
            if(model.phasesPreProcess[phase].bookBy === 'languages'){
                exports.bookByLanguages(model, phase, i);
                continue;
            }
            exports.bookResource(model, phase, i);
        }
    });
    return model;
}


exports.bookResource = (model, phase, i) => {
    let start = exports.determineStart(model, phase, i);
    let position = model.phasesPreProcess[phase].position;
    // console.log('the start returned is: '+start);
    let title = model.numResourcesPerPhase[phase] > 1 ? model.phasesPreProcess[phase].bookingTitle+` ${i+1}` : model.phasesPreProcess[phase].bookingTitle
    model.phasesPreProcess[phase].globalStart = start.start;
    let obj = {
        id:start.id,
        start:start.start,
        step:phase,
        bookingTitle:title,
        position:position
    }
    let bookings = aBooking(model.phasesPreProcess[phase].jobDuration, obj);
    console.log('bookings returned are:');
    console.log(' ');
    console.log(bookings);
    bookings = handleOverlaps(model, bookings);
    
    let property = `${phase}${i+1}`
    model.phasesPreProcess[phase].globalEnd = bookings[bookings.length-1].endTime;
    model.phasesPreProcess[phase][property] = [];
    bookings.forEach(b => model.phasesPreProcess[phase][property].push(b));
    bookings.forEach(b => model.phasesPreProcess[phase].bookings.push(b));
    return model;
}

exports.determineStart = (model, phase, i) => {
    let position = model.phasesPreProcess[phase].position;
    console.log('position is: '+position);
    let resourceStart = model.positionsPreProcess[position].emptyResources.length > 0 ? 'NULL' : model.positionsPreProcess[position].soonestResources[i].start;
    console.log('resource start: '+resourceStart);

    let previousPhase = model.phasesPreProcess[phase].previousPhase;
    let bookFrom = model.phasesPreProcess[phase].bookFrom;
    let lastPhase = model.phasesPreProcess[previousPhase];
    
    let baseStart = lastPhase === undefined ? model.projectStarted
            : bookFrom === 'start' ? lastPhase.globalStart 
            : bookFrom === 'end' ? lastPhase.globalEnd
            : 'NULL';

    let offset = model.phasesPreProcess[phase].offset;
    let projectStart = addHoursToDateString(baseStart, offset);
    console.log('resourceStart: ',resourceStart);
    console.log('projectStart ',projectStart);

    let start = returnFarthestStart(resourceStart, projectStart);
    let rid = model.positionsPreProcess[position].emptyResources.length > 0 ? model.positionsPreProcess[position].emptyResources.shift() : model.positionsPreProcess[position].soonestResources[i].id;
    console.log('start is: ',start);
    console.log('resourceid is: ',rid)
    return {id:rid, start:start};
}

exports.matchAndAssignIdsToModel = (model) => {
    model.specifiedIds.forEach(id => {
        let position = getPositionById(id);
        model.positionsPreProcess[position].preSelectedIds.push(id);
    });
    return model;
}


exports.bookByLanguages = (model, phase, i) => {
    let numResourcesForPhase = model.numResourcesPerPhase[phase]
    let numLanguagesPerPerson = Math.round(Number.parseInt(model.numberOfLanguages)/Number.parseInt(numResourcesForPhase));
    let languagesSplice = i ===  numResourcesForPhase-1 ? model.languagesMutable : model.languagesMutable.splice(0, numLanguagesPerPerson);
    
    let totalBookings = [];
    let lastBookings = [];
    console.log('number of languages '+languagesSplice.length);
    languagesSplice.forEach(language => {
        let start = exports.determineStart(model, phase, i);
        console.log('returned start from dS', start);
        if(languagesBookings.length > 0){
            start.start = languagesBookings[languagesBookings.length-1].end;
        }

        let obj = {
            id: start.id,
            start: start.start,
            step:phase,
            bookingTitle: `${language}`+model.phasesPreProcess[phase].bookingTitle+`${i+1}`
        }
        console.log('object to be passed: ');
        console.log(obj);
        console.log(' ');
        let returnedBooking = aBooking(model.phasesPreProcess[phase].jobDuration, obj);
        console.log('returned booking from language loop: ',returnedBooking);
        
        returnedBooking.forEach(b => totalBookings.push(b));
        lastBookings.length = 0;
        returnedBooking.forEach(b => lastBookings.push(b));
    });

    let property = `${phase}${i+1}`
    model.phasesPreProcess
}

exports.populateSpecifiedSoonestResources = (model) => {
    for(var key in model.positionsPreProcess){
        model.positionsPreProcess[key].preSelectedIds.forEach(id => {
            let soonestAvailableDateTime = getLastBookingEnd(id, key);
            if(soonestAvailableDateTime === 0){
                if(model.positionsPreProcess[key].emptyResources.length !== 0){
                    // if(!model.positionsPreProcess[key].emptyResources.some(o => o === id)){
                        model.positionsPreProcess[key].emptyResources.push(id);
                    // }
                } else {
                    model.positionsPreProcess[key].emptyResources.push(id);
                }
            } else {
                // if(!model.positionsPreProcess[key].soonestResources.some(o => o.id === id)){
                    model.positionsPreProcess[key].soonestResources.push({id:id, start:soonestAvailableDateTime});
                // }
            }
        });
    }
    return model;
}

exports.retrieveOptimalResources = (model) => {
    // need to retrieve optimal resources
    for(var key in model.positionsPreProcess){
        return model;
    }
    return model;
}

exports.returnObjLiteral = (key, index) => {
	return Object.assign({}, {
		title: `${key}${index}`
	});
}

exports.runLoop = (k, v) => {
	let arr = [];
	for(let i=0; i<v; i++){
		let r = exports.returnObjLiteral(k, i);
		arr.push(r);
	}
	return arr;
}

exports.newArraysByValue = (arr) => {
	return arr.map(o => {
		for(var key in o){
			return exports.runLoop(key, o[key]);
		}
	});
}

exports.returnLinked = (...items) => {
    return items[0].reduce((x, v, i, a) => {
		console.log
        x[v] = {next: a[i+1]}
        return x;
    }, {});
}

exports.returnObjectLiteral = (id, position, step, projectTitle, idx) => {
    let bookingTitle = `${projectTitle} - ${step}`
    if(idx > 0 && idx !== undefined){
        bookingTitle = `${projectTitle} - ${step} ${idx}`
    }

    return Object.assign({}, {
        id: id,
        position: position,
        step: step,
        projectTitle: projectTitle,
        bookingTitle: bookingTitle,
        bookings: []
    });
}

exports.returnWholeObject = () => {
    return {
        INGEST: {
            position: 'MA',
            numOfResources: numIngest,
            ids: [...ingestIds],
            bookings: [],
            nextPosition: 'INITIAL'
        },
        INITIAL: {
            position: 'Mixer',
            type: 'initial',
            numOfResources: numMixers,
            ids: ['123123123123'],
            bookings: [...initialIds],
            nextPosition: 'MIXTECHS'
        },
        MIXTECHS: {
            position: 'MT',
            numOfResources: numMixtechs,
            ids: ['12312412843', '129080984209'],
            bookings: [...mixtechIds],
            nextPosition: 'QC'
        },
        QC: {
            position: 'QC',
            numOfResources: numQcs,
            ids: [...qcIds],
            bookings: [],
            nextPosition: 'CONS'
        },
        CONS: {
            position: 'CONS',
            numOfResources: numConsolidateion,
            ids: [...consIds],
            bookings: [],
            nextPosition: 'FINALMIX'
        },
        FINALMIX: {
            position: 'Mixer',
            type: 'finalmix',
            numOfResources: numFinalmix,
            ids: [...finalmixIds],
            bookings: [],
            nextPosition: 'DELVERABLES'
        },
        DELIVERABLES: {
            position: 'MA',
            numOfResources: numDeliverables,
            ids: [...deliverableIds],
            bookings: [],
            nextPosition: 'NULL'
        }
    }
}