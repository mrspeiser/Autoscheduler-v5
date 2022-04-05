const cache = require('../core/cache');
let { get, post, put, del } = require('../api/requests');
let { cleanBooking } = require('../util/data/reduceBookings');
let { parseUpdateBody } = require('../util/bookings/postBody');
let { getCard } = require('../api/graphql/queries');
let { parseDateTime, getStartAndFinish } = require('../util/dates/handleDateTime');
let { getJobLength, getBackgroundColor } = require('../util/data/variableData');
let { translatePosition, getIndex, getResourceBookingIndex, getProjectBookingIndex } = require('../util/data/cacheAccess');

exports.createViaForm = async (data) => {
    console.log('createViaForm function has run');
    console.log('data: ', data);
    //project data
    let title = data.title;
    let contentLength = data.contentLength;
    let numLanguages = data.numLanguages;
    let projectStart = data.datetimeMA;

    //post project
    let color = getBackgroundColor();
    let project = await post('/project', JSON.stringify({name: title, backgroundColor: color}));
    
    //resource ids:
    let ingest = exports.matchKeys(data, 'selectMA');
    let mixer = exports.matchKeys(data, 'selectMixer');
    let mixtechs = exports.matchKeys(data, 'selectMixtech');
    let qcs = exports.matchKeys(data, 'selectQC');
    let consolidation = exports.matchKeys(data, 'selectCons');
    let finalmix = exports.matchKeys(data, 'finalmix');
    let deliverables = exports.matchKeys(data, 'selectDeliverable');

    //amount of resources for each task
    let numIngests = ingest.length;
    let numMixers = mixer.length;
    let numMixtechs = mixtechs.length;
    let numQcs = qcs.length;
    let numCons = consolidation.length;
    let numFinalmix = finalmix.length;
    let numDeliverables = deliverables.length;

    //job lengths
    let ingestJobLength = getJobLength('MA', contentLength, numLanguages, numIngests);
    let mixerJobLength = getJobLength('MIXER', contentLength, numLanguages, numMixers);
    let mixtechsJobLength = getJobLength('MT', contentLength, numLanguages, numMixtechs);
    let qcJobLength = getJobLength('QC', contentLength, numLanguages, numQcs);
    let consolidationJobLength = getJobLength('CONS', contentLength, numLanguages, numCons);
    let finalmixJobLength = getJobLength('FINAL', contentLength, numLanguages, numFinalmix);
    let deliverablesJobLength = getJobLength('DELIVER', contentLength, numLanguages, numDeliverables);

    //start & endtimes
    let ingestTimes = getStartAndFinish(parseDateTime(projectStart), ingestJobLength);
    let mixerTimes = getStartAndFinish(ingestTimes.end[ingestTimes.end.length-1], mixerJobLength);
    let mtTimes = getStartAndFinish(mixerTimes.end[mixerTimes.end.length-1], mixtechsJobLength);
    let qcTimes = getStartAndFinish(mtTimes.end[mtTimes.end.length-1], qcJobLength);
    let consTimes = getStartAndFinish(qcTimes.end[qcTimes.end.length-1], consolidationJobLength);
    let finalmixTimes = getStartAndFinish(consTimes.end[consTimes.end.length-1], finalmixJobLength);
    let deliverablesTimes = getStartAndFinish(finalmixTimes.end[finalmixTimes.end.length-1], deliverablesJobLength);

    //create bookings
    let ingestBookings = ingest.map(r => ingestTimes.map(t => new Booking(r, t.start, t.end, ingestJobLength, 'ingest', `${title} - Ingest`, 'MA')));  
    let mixerBookings = mixer.map(r => mixerTimes.map(t => new Booking(r, t.start, t.end, mixerJobLength, 'initial', `${title} - initial`, 'Initial'))); 
    let mixtechBookings = mixtechs.map((r, i) => mtTimes.map(t => new Booking(r, t.start, t.end, mixtechsJobLength, 'mt', `${title} - MT${i}`)));
    let qcBookings = qcs.map((r, i) => qcTimes.map(t => new Booking(r, t.start, t.end, qcJobLength, 'mt', `${title} - QC${i}`)));
    let consolidationBookings = consolidation.map(r => consTimes.map(t => new Booking(r, t.start, t.end, consolidationJobLength, 'consolidation', `${title} - Consolidation`)));
    let finalmixBookings = finalmix.map(r => finalmixTimes.map(t => new Booking(r, t.start, t.end, finalmixJobLength, 'finalmix', `${title} - final`, 'Finalmix')));
    let deliverablesBookings = deliverables.map(r => deliverablesTimes.map(t => new Booking(r, t.start, t.end, deliverablesJobLength, 'deliverables', `${title} - Deliverables`, 'deliverables')));

    //create json bodies:
    let ingestBody = exports.parseBody(ingestBookings, project);
    let mixerBody = exports.parseBody(mixerBookings, project);
    let mixtechBody = exports.parseBody(mixtechBookings, project);
    let qcBody = exports.parseBody(qcBookings, project);
    let consBody = exports.parseBody(consolidationBookings, project);
    let finalmixBody = exports.parseBody(finalmixBookings, project);
    let deliverablesBody = exports.parseBody(deliverablesBookings, project);

    console.log(ingestBody);
    console.log(mixerBody);
    console.log(mixtechBody);
    console.log(qcBody);
    console.log(consBody);
    console.log(finalmixBody);
    console.log(deliverablesBody);
    
    //post requests
    // let postIngest = await Promise.all(ingestBody.map(b => post('/booking', b)));
    // let postMixer = await Promise.all(mixerBody.map(b => post('/booking', b)))
    // let postMixtech = await Promise.all(mixtechBody.map(b => post('/booking', b)))
    // let postQCs = await Promise.all(qcBody.map(b => post('/booking', b)));
    // let postConsolidate = await Promise.all(consBody.map(b => post('/booking', b)));
    // let postfinalmix = await Promise.all(finalmixBody.map(b => post('/booking', b)));
    // let postDeliver = await Promise.all(deliverablesBody.map(b => post('/booking', b)));
    return 'success';
}   
exports.matchKeys = (data, charactersToMatch) => {
    let re = new RegExp(charactersToMatch);
    let reduced = []
    for(var key in data){
        if(key.match(re)){
            data.push(data[key]);
        }
    }
    return reduced;
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


exports.timeOuts = async (data) => {
    console.log('\ntimeouts received data\n');
    let timeout = data.name*1000;
    return await new Promise(resolve => setTimeout(() => {
        console.log('timeout was: '+timeout+'ms');
        console.log('\n');
        resolve(timeout);
    }, timeout)); 
};

exports.deleteAll = async () => {
    let projects = [];
    try {
        let projects = cache.projects.map(p => del(`/project/${p._id}`));
        let all = await Promise.all(projects);
        console.log('ran delete projects');
        // console.log('num: 0 '.cache.resources.ALL_RESOURCES[0]._id)
        // let res = await Promise.all(cache.resources.ALL_RESOURCES.map(r => get(`/booking?resourceId=${r._id}`, null, 'DELETE')));
        // console.log(res);
        cache.init();
        
        
    } catch(err) {
        console.log('error inside delete all projects');
    }
}

exports.updateProjectState = async () => {
    console.log('update project state fired');
    // let cardData = await getCard(body.data.card.id);
    // let projectTitle = await cardData.data.card.title;
    // let projectIndex = getProjectIndexByTitle(projectTitle);
    let projectIndex = Math.floor(Math.random()* cache.projects.length);
    let project = cache.projects[projectIndex];
    console.log(' ');
    console.log('project id is: '+project._id);
    console.log(' ');
    let firstFoundPending = cache.bookingsByProjectId[project._id].find(b => b.metadata === "PENDING");
    let bookingTitle = firstFoundPending.title
    let position = translatePosition(bookingTitle);
    let match = bookingTitle.replace(/\d/, '');
    console.log(match);
    let re = new RegExp(match, 'g');
    let getAllBookingsByType = cache.bookingsByProjectId[project._id].filter(b => b.title.match(re));

    getAllBookingsByType.forEach(bo => {
        let rIndex = getIndex(position, bo.resource);
        let bookingIndex = getProjectBookingIndex(project._id, bo._id);
        let resourceBookingIndex = getResourceBookingIndex(position, rIndex, bo._id);
        
        cache.bookingsByProjectId[project._id][bookingIndex].metadata = "COMPLETE";
        cache.resources.SORTED_RESOURCES[position][rIndex].bookings[resourceBookingIndex].metadata = "COMPLETE";
        
        let ref = cache.resources.SORTED_RESOURCES[position][rIndex].bookings[resourceBookingIndex];
        let cleanedBooking = cleanBooking(ref);
        let body = parseUpdateBody(cleanedBooking);
        let updateResponse = put(`/booking/${cleanedBooking._id}`, body);
        console.log(updateResponse);
    });  
}

exports.createAndUpdate = async () => {
    let body = JSON.stringify({ _id: '5ba19a9cd0652c0c6735d180',
    title: 'PROJECT 3 - finalmix',
    state: 'STATE_DAY_MINUTE',
    allDay: false,
    scale: 'SCALE_HOUR',
    start: '2018-09-27 15:00',
    end: '2018-09-27 18:00',
    categoryTemplateId: '5b84259540198920a45dd193',
    categoryName: 'General',
    bookingCreatorId: '5b84259540198920a45dd149',
    stateValue: 0,
    resource: '5b84259540198920a45dd154',
    project: '5ba19a9819631f0c70b03402',
    note: 'finalmix',
    details: [Object],
    createdDate: '2018-09-19T00:38:52.046Z',
    updatedDate: '2018-09-19T00:38:52.046Z',
    metadata: 'PENDING',
    backgroundColor: '',
    customFields: [],
    nextBooking: '5ba19a9c19631f0c70b03420' });
    let result = await put('/booking/5ba19a9cd0652c0c6735d180', body);
    console.log(result);

}