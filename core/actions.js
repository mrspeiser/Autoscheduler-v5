const cache = require('./cache');
const { post } = require('../api/requests');
const { getCard } = require('../api/graphql/queries');
const { getBookings} = require('../util/bookings/postPosition');
const { keyValueObject, returnBody } = require('../api/formatBody');
const { updateBookings, updateProject } = require('./updates');
const { getBackgroundColor, parseRuntime } = require('../util/data/variableData');
const { addProject, linkProjectBookings, addResourceBookings, addProjectBookings, concatAll } = require('../util/data/cacheAccess');


exports.newContent = async (body) => {
    try {
        console.log('body ',body);
        let cardData = await getCard(body.data.card.id);
        console.log('card data: ', cardData);
        // let langSplit = await body['Field "Languages (If Not Standard)" - Unformatted'].split(',');  OLD
        let langSplit = await cardData.data.card.fields[4]['value'].split(',');
        let dd = await cardData.data.card.due_date;
        let ddSplit1 = dd.split('T');
        let timeSplit1 = ddSplit1[1].split('-');
        let timesplit2 = timeSplit1[0].split(':');
        let timeString = timesplit2[0]+':00';
        // console.log(ddSplit1[0]);
        // console.log(timeString);
        let dueDate = `${ddSplit1[0]} ${timeString}`
        // let title = await body['Field "Content Title"'];  OLD
        let title = await cardData.data.card.title;

        // let totalRuntime = await body['Field "TRT"'];  OLD
        let totalRuntime = cardData.data.card.fields[1].value;

        let contentRuntime = parseRuntime(totalRuntime);
        let numLanguages = await langSplit.length;
        let color = await getBackgroundColor();
        // console.log(langSplit);
        // console.log(contentRuntime);
        // console.log(numLanguages);
        // console.log(title);
        // console.log(dueDate);

        // First We Need To Create a Project, Save Project Id
        let project = await post('/project', JSON.stringify({name: title, backgroundColor: color, metadata:dueDate}));
        // console.log(cache.projects);
        let newProject = addProject(project);
        // console.log(project);


        // Create and Post Bookings
        let maIngest = await getBookings('MA', title, contentRuntime, numLanguages, "Ingest");
        maIngest.forEach(b =>  console.log(JSON.stringify(b)));
        let MAbody = exports.parseBody(maIngest, project);
        let postIngest = await Promise.all(MAbody.map(b => post('/booking', b)));

        let mixerBooking = await getBookings('MIXERS', title, contentRuntime, numLanguages, "initial", maIngest[maIngest.length-1]);
        mixerBooking.forEach(b => console.log(JSON.stringify(b)));
        let mixbody = exports.parseBody(mixerBooking, project);
        let postMixerInitial = await Promise.all(mixbody.map(b => post('/booking', b)));


        let mixtechs = langSplit.map(async (l, i, a) => getBookings('MIXTECHS', title, contentRuntime, numLanguages, `${l} MixTech`, a[i-1], 2))
        await getBookings('MIXTECHS', title, contentRuntime, numLanguages, "MixTech", mixerBooking[mixerBooking.length-1], 2);
        mixtechs.forEach(b => console.log(JSON.stringify(b))); 
        let mixtechsbody = exports.parseBody(mixtechs, project);
        let postMixTechs = await Promise.all(mixtechsbody.map(b => post('/booking', b)));

        let qcs = await getBookings('QC', title, contentRuntime, numLanguages, 'QC', mixtechs[0], 2);
        qcs.forEach(b => console.log(JSON.stringify(b)));
        let qcbody = exports.parseBody(qcs, project);
        let postQCs = await Promise.all(qcbody.map(b => post('/booking', b)));

        let mixerFinalPass = await getBookings('MIXERS', title, contentRuntime, numLanguages, "finalmix", qcs[qcs.length-1], 1, mixerBooking);
        mixerFinalPass.forEach(b => console.log(JSON.stringify(b)));
        let mixfpbody = exports.parseBody(mixerFinalPass, project);
        let postMixerFinalPass = await Promise.all(mixfpbody.map(b => post('/booking', b)));

        let maDeliverable = await getBookings('MA', title, contentRuntime, numLanguages, 'deliverables', mixerFinalPass[mixerFinalPass.length-1], 1, maIngest);
        maDeliverable.forEach(b => console.log(JSON.stringify(b)));
        let madBody = exports.parseBody(maDeliverable, project);
        let postMaDeliverables = await Promise.all(madBody.map(b => post('/booking', b)));

        
        // // Cache All Results
        let bookings = concatAll(postIngest, postMixerInitial, postMixTechs, postQCs, postMixerFinalPass, postMaDeliverables);
        let linkedProjectBookings = linkProjectBookings(bookings);
        let linkedResourceBookings = addResourceBookings(linkedProjectBookings);
        console.log(linkedResourceBookings);
        addProjectBookings(linkedResourceBookings);
        

        // Finish
        return await "successfully ran and created project with bookings";

    } catch(err) {
        console.log(err);
        console.log('\ncould not complete creation of Project and Bookings \n');

    } 
}

exports.parseBody = (bookingsArray, project) => {
    // console.log(bookingsArray);
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