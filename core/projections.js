const cache = require('./cache');
const { post } = require('../api/requests');
const { aBooking } = require('../util/bookings/postProjection');
const { getBookings } = require('../util/bookings/postPosition');
const { parseBody } = require('./actions');
const { getOverlaps, collectAllSplits, calculateMoveAmt } = require('../util/dates/overlaps');
const { getMixerBookingSync } = require('../util/dates/overlaps');
const { afterHours, compareDates, parseDateTime, addHoursToDateString } = require('../util/dates/handleDateTime');
const { returnObjectLiteral } = require('../util/lib/returns');
const { keyValueObject, returnBody } = require('../api/formatBody');
const { updateBookings, updateProject } = require('./updates');
const { getBackgroundColor, getJobLength, parseRuntime } = require('../util/data/variableData');
const { getNextMorning, parseProjectDateTime, getHoursOfOverflow } = require('../util/dates/getTimeString');
const { addProject, getLastBooking, getLastIngestBooking, linkProjectBookings, addResourceBookings, addProjectBookings, concatAll, concatAllArrays } = require('../util/data/cacheAccess');



exports.newProjection = async (body) => {
    try {
        let formdata = JSON.parse(body);
        console.log('formdata: ',formdata); 
        let color = await getBackgroundColor();
        
        // First We Need To Create a Project, Save Project Id
        let { title, ids, projectStart } = formdata
        let project = await post('/project', JSON.stringify({name: title, backgroundColor: color}));
        let newProject = addProject(project);

        //mapIds to 

        // Create and Post Bookings
        if(formdata.ids.length > 0 && formdata.projectStart.length > 0){
            return await exports.fromIdsAndNow(formdata, project, formdata.projectStart);
        } else if(projectStart.length > 0) {
            return await exports.optimalResourcesAndSetDate(formdata, project, formdata.projectStart);
        } else if(ids.length > 0){
            return await exports.fromIdsAndNow(formdata, project);
        } else {
            return await exports.optimalResourcesAndSetDate(formdata, project);
        }

    } catch(err) {
        console.log(err);
        console.log('\ncould not complete creation of Project and Bookings \n');
    } 
}

exports.fromIdsAndNow = async (formdata, project, specifiedDate) => {
    console.log('about to run post for the form with PRESET IDS and create Date from NOW')
    let {   
        title, 
        contentLength, 
        numberOfLanguages, 
        numIngest,
        numMixers, 
        numMixtechs,
        numQcs, 
        numConsolidation,
        numFinalmix, 
        numDeliverables,
        ids
        } = formdata; 
         
    let projectStart = await parseProjectDateTime();

    if(specifiedDate !== undefined || specifiedDate.length > 1){
        console.log(' ');
        console.log('updating date! '+specifiedDate);
        console.log(' ');
        projectStart = parseDateTime(specifiedDate)
    }

    let ingestIds = ids.splice(0,numIngest);
    let initialIds = ids.splice(0,numMixers);
    let mixtechIds = ids.splice(0,numMixtechs);
    let qcIds = ids.splice(0,numQcs);
    let consIds = ids.splice(0, numConsolidation);
    let finalmixIds = ids.splice(0, numFinalmix);
    let deliverableIds = ids.splice(0,numDeliverables);
    
    let ingestPreprocess = ingestIds.map((v, i) => {
        return returnObjectLiteral(v, 'MA', 'Ingest', title);
    });

    let initialPreprocess = initialIds.map((v, i) => {
        return returnObjectLiteral(v, 'MIXERS', 'initial', title);
    });

    let mixtechPreprocess = mixtechIds.map((v, i) => {
        return returnObjectLiteral(v, 'MIXTECHS', 'MixTech', title, i+1);
    });

    let qcPreprocess = qcIds.map((v, i) => {
        return returnObjectLiteral(v, 'QC', 'QC', title, i+1);
    });

    let consPreprocess = consIds.map((v, i) => {
        return returnObjectLiteral(v, 'MA', 'consolidation', title);
    });

    let finalmixPreprocess = finalmixIds.map((v, i) => {
        return returnObjectLiteral(v, 'MIXERS', 'finalmix', title);
    });

    let deliverablesPreprocess = deliverableIds.map((v, i) => {
        return returnObjectLiteral(v, 'MA', 'deliverables', title);
    });


    let ingestBookings = await exports.mapBookings(ingestPreprocess, projectStart, contentLength, numberOfLanguages);
    // console.log(ingestBookings);
    if(ingestBookings.ripple === true){
        let rippleIngest = moveBookings(ingestBookings.rippleBooking.booking, ingestBookings.amount)
        let ingestBody = exports.parseProjectionBody(ingestBookings.bookings, project);
        let postIngest = await Promise.all(ingestBody.map(a => Promise.all(a.map(b => post('/booking', b)))));
    }
    console.log(ingestBookings)
    let ingestBody = exports.parseProjectionBody(ingestBookings.bookings, project);
    console.log(ingestBody);
    let postIngest = await Promise.all(ingestBody.map(a => Promise.all(a.map(b => post('/booking', b)))));




    let firstIngestBooking = ingestBookings[0][0];
    console.log('starttime for first ingest booking: ', firstIngestBooking.startTime);
    let parsed = parseRuntime(contentLength);
    let offset = parsed*2;
    console.log('content length: ', offset);

    let initialStart = addHoursToDateString(parseDateTime(firstIngestBooking.startTime), offset);
    console.log('the initial start is: ', initialStart);
    if(afterHours(initialStart)){
        let overflow = getHoursOfOverflow(firstIngestBooking.startTime, offset);
        initialStart = getNextMorning(overflow, firstIngestBooking.startTime);
        console.log('there was an overflow');
    
    }
    // let lastIngestBooking = ingestBookings[ingestBookings.length-1][ingestBookings[ingestBookings.length-1].length-1];
    console.log('initialstart: ',initialStart);
    let initialBookings = exports.mapBookings(initialPreprocess, initialStart, contentLength, numberOfLanguages);
    // console.log(initialBookings);
    let initialBody = exports.parseProjectionBody(initialBookings, project);
    console.log(initialBody);
    let postInitial = await Promise.all(initialBody.map(a => Promise.all(a.map(b => post('/booking', b)))));

    let lastInitialBooking = initialBookings[initialBookings.length-1][initialBookings[initialBookings.length-1].length-1];
    let mixtechBookings = exports.mapBookings(mixtechPreprocess, lastInitialBooking.endTime, contentLength, numberOfLanguages);
    // console.log(mixtechBookings)
    let mixtechBody = exports.parseProjectionBody(mixtechBookings, project);
    console.log(mixtechBody);
    let postMixtechs = await Promise.all(mixtechBody.map(a => Promise.all(a.map(b => post('/booking', b)))));

    let firstMixtechBooking = mixtechBookings[0][0];
    let soonestStart = addHoursToDateString(parseDateTime(firstMixtechBooking.startTime), 4);
    if(afterHours(soonestStart)){
        let overflow = getHoursOfOverflow(firstMixtechBooking.startTime, 4);
        soonestStart = getNextMorning(overflow, firstMixtechBooking.startTime);
    }

    let qcBookings = exports.mapBookings(qcPreprocess, soonestStart, contentLength, numberOfLanguages);
    let qcBody = exports.parseProjectionBody(qcBookings, project);
    console.log(qcBody);
    let postQCs = await Promise.all(qcBody.map(a => Promise.all(a.map(b => post('/booking', b)))));

    let lastQcBooking = qcBookings[qcBookings.length-1][qcBookings[qcBookings.length-1].length-1];
    let consolidationBooking = exports.mapBookings(consPreprocess, lastQcBooking.endTime, contentLength, numberOfLanguages);
    let consolidationBody = exports.parseProjectionBody(consolidationBooking, project);
    console.log(consolidationBody)
    let postConsolidation = await Promise.all(consolidationBody.map(a => Promise.all(a.map(b => post('/booking', b)))));

    let lastConsolidationBooking = consolidationBooking[consolidationBooking.length-1][consolidationBooking[consolidationBooking.length-1].length-1];
    let finalmixBookings = exports.mapBookings(finalmixPreprocess, lastConsolidationBooking.endTime, contentLength, numberOfLanguages);
    let finalmixBody = exports.parseProjectionBody(finalmixBookings, project);
    console.log(finalmixBody)
    let postFinalMix = await Promise.all(finalmixBody.map(a => Promise.all(a.map(b => post('/booking', b)))));

    let lastfinalmixBooking = finalmixBookings[finalmixBookings.length-1][finalmixBookings[finalmixBookings.length-1].length-1];
    let deliverablesBookings = exports.mapBookings(deliverablesPreprocess, lastfinalmixBooking.endTime, contentLength, numberOfLanguages);
    let deliverablesBody = exports.parseProjectionBody(deliverablesBookings, project);
    console.log(deliverablesBody)
    let postDeliverables = await Promise.all(deliverablesBody.map(a => Promise.all(a.map(b => post('/booking', b)))));

    // console.log(postIngest);
    // console.log(postDeliverables);
    // // Cache All Results
    let bookings = concatAllArrays(postIngest, postInitial, postMixtechs, postQCs, postConsolidation, postFinalMix, postDeliverables);
    // console.log(bookings);
    let linkedProjectBookings = linkProjectBookings(bookings);
    let linkedResourceBookings = addResourceBookings(linkedProjectBookings);
    addProjectBookings(linkedResourceBookings);

    return await "successfully ran and created project with bookings";
}

exports.fromIdsAndSetDate = async (formdata) => {
    console.log('about to run post for the form with specified IDS and a PRESET DATE');
    let {   
        title, 
        contentLength, 
        numberOfLanguages, 
        projectStart, 
        numIngest,
        numMixers, 
        numMixtechs,
        numQcs, 
        numConsolidation,
        numFinalmix, 
        numDeliverables,
        ids
         } = formdata; 

    let bookingsArray = [];
    let ingestIds = ids.splice(0, numIngest);
    let initialIds = ids.splice(0, numMixers);
    let mixtechIds = ids.splice(0, numMixtechs);
    let qcIds = ids.splice(0, numQcs);
    let consIds = ids.splice(0, numConsolidation);
    let finalmixIds = ids.splice(0, numFinalmix);
    let deliverableIds = ids.splice(0, numDeliverables);
    
    let ingestPreprocess = ingestIds.map((v, i) => {
        return v = returnObjectLiteral(v, 'MA', 'ingest', title, i+1);
    });

    let initialPreprocess = initialIds.map((v, i) => {
        return v = returnObjectLiteral(v, 'MIXERS', 'initial', title, i+1);
    });

    let mixtechPreprocess = mixtechIds.map((v, i) => {
        return v = returnObjectLiteral(v, 'MIXTECHS', 'MixTech', title, i+1);
    });

    let qcPreprocess = qcIds.map((v, i) => {
        return v = returnObjectLiteral(v, 'QC', 'QC', title, i+1);
    });

    let consPreprocess = consIds.map((v, i) => {
        return v = returnObjectLiteral(v, 'CONS', 'consolidation', title, i+1);
    });

    let finalmixPreprocess = finalmixIds.map((v, i) => {
        return v = returnObjectLiteral(v, 'MIXERS', 'finalmix', title, i+1);
    });

    let deliverablesPreprocess = deliverableIds.map((v, i) => {
        return v = returnObjectLiteral(v, 'MA', 'deliverables', title);
    });

    bookingsArray = [...ingestPreprocess, ...initialPreprocess, ...mixtechPreprocess, ...qcPreprocess, ...consPreprocess, ...finalmixPreprocess, ...deliverablesPreprocess];
    console.log(bookingsArray);

    let ingestBookings = ingestPreprocess.map((v, i, arr) => {
        console.log(v);
        console.log(v.id);
        console.log(v.position);
        let lastBooking = getLastBooking(v.id, v.position);
        let projectStart = projectStart;
        let resourceStart = lastBooking.end;
        let jobHours = getJobLength(v.position, contentLength, numberOfLanguages, arr.length-1);
        if(lastBooking === 'NULL' || compareDates(projectStart, resourceStart)){
            v.start = projectStart;
            if(afterHours(v.start)){
                v.start = getNextMorning(0, v.start);
            }
            return aBooking(jobHours, v);
        } else {
            v.start = resourceStart;
            if(afterHours(v.start)){
                v.start = getNextMorning(0, v.start);
            }
            return aBooking(jobHours, v);
        }
    });

        
    return await "successfully ran and created project with bookings";
}

exports.optimalResourcesAndSetDate = async (formdata, project, specifiedDate) => {
    console.log('about to run post with PRESET DATE, find optimal resources');
    let {   
        title, 
        contentLength, 
        numberOfLanguages,
        numIngest,
        numMixers, 
        numMixtechs,
        numQcs, 
        numConsolidation,
        numFinalmix, 
        numDeliverables
         } = formdata; 

    let start = await parseProjectDateTime();
    if(specifiedDate !== undefined || specifiedDate.length > 1){
        console.log(' ');
        console.log('updating date! '+specifiedDate);
        console.log(' ');
        start = parseDateTime(specifiedDate)
    }

    let numLanguages = numberOfLanguages;
    let contentRuntime = contentLength;
    
    // Create and Post Bookings
    let maIngest = await getBookings('MA', title, contentRuntime, numLanguages, "Ingest", {endTime: start}, numIngest);
    maIngest.forEach(b =>  console.log(JSON.stringify(b)));
    let MAbody = parseBody(maIngest, project);
    let postIngest = await Promise.all(MAbody.map(b => post('/booking', b)));

    let mixerBooking = await getBookings('MIXERS', title, contentRuntime, numLanguages, "initial", maIngest[maIngest.length-1], numMixers);
    mixerBooking.forEach(b => console.log(JSON.stringify(b)));
    let mixbody = parseBody(mixerBooking, project);
    let postMixerInitial = await Promise.all(mixbody.map(b => post('/booking', b)));

    let mixtechs = await getBookings('MIXTECHS', title, contentRuntime, numLanguages, "MixTech", mixerBooking[mixerBooking.length-1], numMixtechs);
    mixtechs.forEach(b => console.log(JSON.stringify(b))); 
    let mixtechsbody = parseBody(mixtechs, project);
    let postMixTechs = await Promise.all(mixtechsbody.map(b => post('/booking', b)));

    let qcs = await getBookings('QC', title, contentRuntime, numLanguages, 'QC', mixtechs[0], numQcs);
    qcs.forEach(b => console.log(JSON.stringify(b)));
    let qcbody = parseBody(qcs, project);
    let postQCs = await Promise.all(qcbody.map(b => post('/booking', b)));
         
    let cons = await getBookings('CONS', title, contentRuntime, numLanguages, "Consolidation", qcs[qcs.length-1], numConsolidation, maIngest)
    cons.forEach(b => console.log(JSON.stringify(b)));
    let consBody = parseBody(cons, project);
    let postCons = await Promise.all(consBody.map(b => post('/booking', b)));

    let mixerFinalPass = await getBookings('MIXERS', title, contentRuntime, numLanguages, "finalmix", cons[cons.length-1], numFinalmix, mixerBooking);
    mixerFinalPass.forEach(b => console.log(JSON.stringify(b)));
    let mixfpbody = parseBody(mixerFinalPass, project);
    let postMixerFinalPass = await Promise.all(mixfpbody.map(b => post('/booking', b)));

    let maDeliverable = await getBookings('MA', title, contentRuntime, numLanguages, 'deliverables', mixerFinalPass[mixerFinalPass.length-1], numDeliverables, maIngest);
    maDeliverable.forEach(b => console.log(JSON.stringify(b)));
    let madBody = parseBody(maDeliverable, project);
    let postMaDeliverables = await Promise.all(madBody.map(b => post('/booking', b)));

    // Cache All Results
    let bookings = concatAll(postIngest, postMixerInitial, postMixTechs, postQCs, postCons, postMixerFinalPass, postMaDeliverables);
    // console.log(bookings);
    let linkedProjectBookings = linkProjectBookings(bookings);
    let linkedResourceBookings = addResourceBookings(linkedProjectBookings);
    addProjectBookings(linkedResourceBookings);
}

exports.fromAmountofPositions = async (formdata) => {
// try {
    console.log('about to run projections for the form ONLY NUM OF POSITIONS SUPPLIED');
    let {   
           title, 
           contentLength, 
           numberOfLanguages, 
           projectStart, 
           numIngest,
           numMixers, 
           numMixtechs,
           numQcs, 
           numConsolidation,
           numFinalmix, 
           numDeliverables,
           ids
        } = formdata; 

    projectStart = await parseProjectDateTime();
    let numLanguages = numberOfLanguages;
    let contentRuntime = contentLength;
    console.log(projectStart);

    // Create and Post Bookings
    let maIngest = await getBookings('MA', title, contentRuntime, numLanguages, "Ingest", {endTime: projectStart}, numIngest);
    maIngest.forEach(b =>  console.log(JSON.stringify(b)));
    // let MAbody = parseBody(maIngest, project);
    // let postIngest = await Promise.all(MAbody.map(b => post('/booking', b)));

    let mixerBooking = await getBookings('MIXERS', title, contentRuntime, numLanguages, "initial", maIngest[maIngest.length-1], numMixers);
    mixerBooking.forEach(b => console.log(JSON.stringify(b)));
    // let mixbody = parseBody(mixerBooking, project);
    // let postMixerInitial = await Promise.all(mixbody.map(b => post('/booking', b)));

    // let mixtechs = langSplit.map(async (l, i, a) => getBookings('MIXTECHS', title, contentRuntime, numLanguages, `${l} MixTech`, a[i-1], numMixtechs))
    let mixtechs = await getBookings('MIXTECHS', title, contentRuntime, numLanguages, "MixTech", mixerBooking[mixerBooking.length-1], numMixtechs);
    mixtechs.forEach(b => console.log(JSON.stringify(b))); 
    // let mixtechsbody = parseBody(mixtechs, project);
    // let postMixTechs = await Promise.all(mixtechsbody.map(b => post('/booking', b)));

    let qcs = await getBookings('QC', title, contentRuntime, numLanguages, 'QC', mixtechs[0], numQcs);
    qcs.forEach(b => console.log(JSON.stringify(b)));
    // let qcbody = parseBody(qcs, project);
    // let postQCs = await Promise.all(qcbody.map(b => post('/booking', b)));
            
    let cons = await getBookings('CONS', title, contentRuntime, numLanguages, "Consolidation", qcs[qcs.length-1], numConsolidation)
    cons.forEach(b => console.log(JSON.stringify(b)));
    // let consBody = parseBody(cons, project);
    // let postCons = await Promise.all(cons.map(b => post('/booking', b)));

    let mixerFinalPass = await getBookings('MIXERS', title, contentRuntime, numLanguages, "finalmix", cons[cons.length-1], numFinalmix, mixerBooking);
    mixerFinalPass.forEach(b => console.log(JSON.stringify(b)));
    // let mixfpbody = parseBody(mixerFinalPass, project);
    // let postMixerFinalPass = await Promise.all(mixfpbody.map(b => post('/booking', b)));

    let maDeliverable = await getBookings('MA', title, contentRuntime, numLanguages, 'deliverables', mixerFinalPass[mixerFinalPass.length-1], numDeliverables, maIngest);
    maDeliverable.forEach(b => console.log(JSON.stringify(b)));
    // let madBody = parseBody(maDeliverable, project);
    // let postMaDeliverables = await Promise.all(madBody.map(b => post('/booking', b)));

    
    // // Cache All Results
    // let bookings = concatAll(postIngest, postMixerInitial, postMixTechs, postQCs, postMixerFinalPass, postMaDeliverables);
    // let linkedProjectBookings = linkProjectBookings(bookings);
    // let linkedResourceBookings = addResourceBookings(linkedProjectBookings);
    // console.log(linkedResourceBookings);
    // addProjectBookings(linkedResourceBookings);

    return 'projection created successfully';
    // } catch(err) {
    //     console.log('could not create projection');
    // }
}

exports.mapBookings = (preprocessed, defualtStart, contentLength, numberOfLanguages) => {
    return preprocessed.map((v, i, arr) => {
        console.log(' ');
        let lastBooking = getLastBooking(v.id, v.position);
        let jobHours = getJobLength(v.position, contentLength, numberOfLanguages, arr.length, v.step);
       
        if(v.step === 'Ingest' && lastBooking !== 'NULL'){
            let reducedBookings = getLastIngestBooking(v.id, v.position, v.step);
            lastBooking = reducedBookings[reducedBookings.length-1];
        }

        if(v.step === 'initial' && lastBooking !== 'NULL'){
            let reducedBookings = getLastBooking(v.id, v.position, v.step);
            console.log(reducedBookings.initial[reducedBookings.initial.length-1]);
            lastBooking = reducedBookings.initial[reducedBookings.initial.length-1]
            let optimalStart = getMixerBookingSync(lastBooking, reducedBookings, jobHours);
            // console.log(optimalStart);
            // let optimalStart = getMixerBooking(lastBooking, reducedBookings, jobHours);
            lastBooking = optimalStart;
        }

        let resourceStart = parseDateTime(lastBooking.end);
       
        if(lastBooking === 'NULL' || compareDates(defualtStart, resourceStart)){
            v.start = defualtStart;
            console.log(v.start);
            if(afterHours(v.start)){
                v.start = getNextMorning(0, v.start);
            }
            let bookings = aBooking(jobHours, v);
            // console.log(bookings);
            if(v.step === 'Ingest'){
                let check = exports.checkForOverlapRipple(bookings);
                if(check.ripple !== false){
                    return {bookings:bookings, ripple:true, rippleBooking:check};
                }
                return bookings;
            }
            return bookings;
        } else {
            v.start = resourceStart;
            console.log(resourceStart)
            if(afterHours(v.start)){
                v.start = getNextMorning(0, v.start);
            }
            let bookings = aBooking(jobHours, v);
            // console.log(bookings);
            return bookings;
            
        }
    });
}

exports.checkForOverlapRipple = async (bookings) => {
    let overlappedBookings = getOverlaps(bookings);
    let checkInnerArrays = overlappedBookings.reduce((acc, cv) => acc+=cv.length, 0);
    if(checkInnerArrays === 0){
        return {ripple: false}
    }
    console.log('overlapped resource bookings: ',overlappedBookings);
    console.log(' ');

    let collectAll = collectAllSplits(bookings[0].id, bookings[0].position, overlappedBookings);
    let moveAmount = calculateMoveAmt(collectAll[0].start, bookings[bookings.length-1].end);
    return {ripple:true, booking:collectAll[0], amount:moveAmount};
}

exports.parseProjectionBody = (bookingsArray, project) => {
    console.log(bookingsArray);
    return bookingsArray.map(a => {
        return a.map(b => {
            return returnBody(keyValueObject(
                'project', project._id, 
                'resource', b.id, 
                'start', b.startTime, 
                'end', b.endTime, 
                'title', b.title,
                'note', b.note, 
                'allDay', false, 
                'state', 'STATE_DAY_MINUTE', 
                'metadata', 'PENDING'));
        });
    });   
}













































































































































exports.parseBody = (bookingsArray, project) => {
    return bookingsArray.map(b => {
        return returnBody(keyValueObject(
            'project', project._id, 
            'resource', b.id, 
            'start', b.startTime, 
            'end', b.endTime, 
            'title', b.title,
            'note', b.note, 
            'allDay', false, 
            'state', 'STATE_DAY_MINUTE', 
            'metadata', 'PENDING'));
    });   
}

exports.updateProject  = async (body) => {
    let title = body.title;
    let returnCode = await updateProject(title);
    cache.updatedIds.length = 0;
    return returnCode
}
exports.hourlyUpdate = async () => {
    console.log('running hourly update');
    cache.updatedIds = [];
    let returnCode = await updateBookings();
    return returnCode;
}




        // let maIngest = [];
        // if(projectStart === ''){
        //     maIngest = await getBookings('MA', title, contentLength, numberOfLanguages, "Ingest");    
        // } else {
        //     let start = projectStart.split('T').join(' ');
        //     maIngest = await getBookings('MA', title, contentLength, numberOfLanguages, "Ingest", start);
        // }
        // maIngest.forEach(b =>  console.log(JSON.stringify(b)));
        // let MAbody = exports.parseBody(maIngest, project);
        // let postIngest = await Promise.all(MAbody.map(b => post('/booking', b)));

        // let mixerBooking = await getBookings('MIXERS', title, contentLength, numberOfLanguages, "initial", maIngest[maIngest.length-1], numMixers);
        // mixerBooking.forEach(b => console.log(JSON.stringify(b)));
        // let mixbody = exports.parseBody(mixerBooking, project);
        // let postMixerInitial = await Promise.all(mixbody.map(b => post('/booking', b)));


        // let mixtechs = await getBookings('MIXTECHS', title, contentLength, numberOfLanguages, "MixTech", mixerBooking[mixerBooking.length-1], numMixtechs);
        // mixtechs.forEach(b => console.log(JSON.stringify(b))); 
        // let mixtechsbody = exports.parseBody(mixtechs, project);
        // let postMixTechs = await Promise.all(mixtechsbody.map(b => post('/booking', b)));

        // let qcs = await getBookings('QC', title, contentLength, numberOfLanguages, 'QC', mixtechs[0], numQcs);
        // qcs.forEach(b => console.log(JSON.stringify(b)));
        // let qcbody = exports.parseBody(qcs, project);
        // let postQCs = await Promise.all(qcbody.map(b => post('/booking', b)));

        // let consolidation = await getBookings('CONS', title, contentLength, numberOfLanguages, 'consolidation', qcs[qcs.length-1], numDeliverables, maIngest);
        // consolidation.forEach(b => console.log(JSON.stringify(b)));
        // let consolidationBody = exports.parseBody(consolidation, project);
        // let postConsolidation= await Promise.all(consolidationBody.map(b => post('/booking', b)));

        // let mixerFinalPass = await getBookings('MIXERS', title, contentLength, numberOfLanguages, "finalmix", consolidation[consolidation.length-1], numFinalmix, mixerBooking);
        // mixerFinalPass.forEach(b => console.log(JSON.stringify(b)));
        // let mixfpbody = exports.parseBody(mixerFinalPass, project);
        // let postMixerFinalPass = await Promise.all(mixfpbody.map(b => post('/booking', b)));

        // let maDeliverable = await getBookings('MA', title, contentLength, numberOfLanguages, 'deliverables', mixerFinalPass[mixerFinalPass.length-1], numDeliverables, maIngest);
        // maDeliverable.forEach(b => console.log(JSON.stringify(b)));
        // let madBody = exports.parseBody(maDeliverable, project);
        // let postMaDeliverables = await Promise.all(madBody.map(b => post('/booking', b)));

        // // // Cache All Results
        // let bookings = concatAll(postIngest, postMixerInitial, postMixTechs, postQCs, postConsolidation, postMixerFinalPass, postMaDeliverables);
        // let linkedProjectBookings = linkProjectBookings(bookings);
        // let linkedResourceBookings = addResourceBookings(linkedProjectBookings);
        // // console.log(linkedResourceBookings);
        // addProjectBookings(linkedResourceBookings);
        
        // Finish
        // cache.init();

