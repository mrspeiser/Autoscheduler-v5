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

const { 
    assignObjectsAsKVP, 
    dataProcessor, 
    dataProcessorSync,
    postProject, 
    assignPhases,
    assignPositions,
    assignRandomLanguages,
    resourcesPerPhase, 
    assignBookingPositioning,
    assignTitles,
    bookPhaseBy, 
    linkPhaseToPosition, 
    preProcessResourceData,
    preProcessJobLength,
    bookingLoop,
    loopThroughBookings } = require('../util/lib/prototypes');

let keys = ['title', 'contentLength', 'languages', 'numberOfLanguages']
let phases = ['ingest', 'initial', 'mixtech', 'qc', 'consolidation', 'finalmix', 'deliverables'];
let positions = ['MA', 'MIXER', 'MIXTECH', 'QC'];

exports.newprocess = async (formdata) => {
    console.log('running new process function');
    let data = JSON.parse(formdata);
    let {   
        title, 
        contentLength, 
        numberOfLanguages, 
        projectStart,
        languages,
        numIngest,
        numMixers, 
        numMixtechs,
        numQcs, 
        numConsolidation,
        numFinalmix,
        numDeliverables,
        ids
        } = data; 
    let projectStartParsed = parseDateTime(projectStart);
    let color = getBackgroundColor();
    let rpp = resourcesPerPhase(numIngest, numMixers, numMixtechs, numQcs, numConsolidation, numFinalmix, numDeliverables);
    let model = assignObjectsAsKVP(
        {title:title}, 
        {contentRuntime:contentLength}, 
        {numberOfLanguages:numberOfLanguages}, 
        {projectStarted: projectStartParsed},
        {languages:[]}, 
        {languagesMutable:[]}, 
        {bgColor: color},
        {specifiedIds: ids},
        {numResourcesPerPhase:rpp},
        {overlapIngest:false},
        {allBookings: []},
        {deadline:''},
        {bookProjectOrderBy:'sequence'},
        {priorityLevel:1});
    
    let aaa = dataProcessorSync(model,
        assignPositions, 
        assignRandomLanguages,
        assignPhases, 
        assignBookingPositioning, 
        assignTitles, 
        bookPhaseBy,
        linkPhaseToPosition);
        
    let aa = await dataProcessor(aaa, postProject);
    
    let a = dataProcessorSync(aa, 
        preProcessResourceData,
        preProcessJobLength);

    let b = dataProcessorSync(a, 
        bookingLoop,
        loopThroughBookings);

    let c = dataProcessor(b, postAllBookings);
    
    // console.log('response from a is: ',a.positionsPreProcess);
    // console.log('response from a is: ',b);
    ////////////////////////////////////////////////////////////////////////////////////////////////
    // OPTIMAL RESOURCES HAS NOT BEEN CREATED YET, SORTING THE SOONEST FIRST IN RESOURCES PREPROCESS
    ///// THEN YOU CAN LOOP THROUGH THE PHASES AND CREATE BOOKING OBJECTS //////////////////////////
    ////////////////////////////////////////////////////////////////////////////////////////////////

    // console.log('response from a is: ',a.positionsPreProcess.MA);
	// let b = await dataProcessor(a, preProcessResourceData);
	// let c = await dataProcessor(b, [preProcessArray]);
	// let d = await dataProcessor(c, [processBookings]);
	// let e = await dataProcessor(d, [sendAll]);
	// let f = await dataProcessor(e, [linkAndCache]);
	
	// if(f){
		return 'Process Completed Successfully';
	// }
	// return new Error('could not complete process');
}