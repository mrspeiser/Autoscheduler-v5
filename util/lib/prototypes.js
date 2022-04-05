let { post } = require('../../api/requests');
let { check, checkSync } = require('./checks');
let { relativeBookingPosition, bookBy, phaseToPosition,getJobDuration } = require('../data/variableData');
let { bookSequentially, matchAndAssignIdsToModel, retrieveOptimalResources, populateSpecifiedSoonestResources } = require('./returns');

let keys = ['title', 'contentLength', 'languages', 'numberOfLanguages']
const phases = ['ingest', 'initial', 'mixtech', 'qc', 'consolidation', 'finalmix', 'deliverables'];
const positions = ['MA', 'MIXER', 'MIXTECH', 'QC'];

exports.loopThroughBookings = model => model.phases.forEach(p => model.phasesPreProcess[p].bookings.forEach(b => console.log(b)));

exports.postAllBookings = async model => {
	let post = await Promise.all(model.phases.map(async p => {
		let bookings = parseProjectionBody(p.bookings, model.apiResponse[project]._id);
		let posted = await Promise.all(bookings.map(b => post('/booking', b)))
	}));

}

exports.loopAndCheckBookings = model => {
	model.phases.forEach(p => {
		model.phasesPreProcess[p].bookings.forEach(b => {
			let overlaps = findAnyOverlaps(b);
		});
	});
}
exports.bookingLoop = (model) => {
	switch(model.bookProjectOrderBy){
		case 'sequence':
			return bookSequentially(model);
		case 'dueDate':
			// CALCULATE THE AMOUNT OF TIME FIRST;
			// TOTALTIME = DUEDATE-STARTIME;
			return model;
		default:
			return bookSequentially(model);
	}
}

exports.preProcessJobLength = model => {
	for(var key in model.phasesPreProcess){
		model.phasesPreProcess[key] = getJobDuration(model, model.phasesPreProcess, key);
	}
	return model;
}

exports.preProcessResourceData = (model) => {
	if(model.specifiedIds.length > 0){
		model = matchAndAssignIdsToModel(model);
		model = populateSpecifiedSoonestResources(model);
		return model;
	}
	model = retrieveOptimalResources(model);
	return model;
}
exports.bookPhaseBy = (model) => {
	for(var key in model.phasesPreProcess){
		model.phasesPreProcess[key] = bookBy(model.phasesPreProcess, key);
	}
	return model;
}
exports.assignTitles = (model) => {
	for(var key in model.phasesPreProcess) {
		model.phasesPreProcess[key].bookingTitle = `${model.title} - ${key}`
	}
	return model;
}
exports.assignRandomLanguages = model => {
	let numLangs = model.numberOfLanguages;
	for(var i=0; i<numLangs; i++){
		model.languages.push(`language${i}`);
		model.languagesMutable.push(`language${i}`);
	}
	return model;
}
exports.assignBookingPositioning = (model) => {
	for(var key in model.phasesPreProcess) {
		model.phasesPreProcess[key] = relativeBookingPosition(model, model.phasesPreProcess, key);
	}
	return model;
}

exports.linkPhaseToPosition = (model) => {
	for(var key in model.phasesPreProcess){
		model.phasesPreProcess[key] = phaseToPosition(model.phasesPreProcess, key);
	}
	return model;
}
exports.assignPositions = (model) => {
	let bool = model.specifiedIds.length > 5 ? true: false;
	let obj = positions.reduce((acc, p) => {
		acc[p] = {preSelectedIds: [], preSelected:bool, soonestResources:[], emptyResources:[]};
		return acc;
	}, {});
	model.positionsPreProcess = obj;
	return model;
}

exports.assignPhases = (model) => {
	let obj = phases.reduce((acc, p, i, arr) => {
		acc[p] = {
			bookings:[],
			nextPhase: arr[i+1],
			previousPhase: arr[i-1]
		};
		return acc;
	}, {});
	model.phases = phases;
	model.phasesPreProcess = obj;
	// console.log('model is: ',model);
	return model;
}
exports.dataProcessor = async (data, ...fn) => { 
	let newData = await fn.reduce(async (acc, cv) => {
        acc = await cv(acc);
        return await acc;
	}, data);
    // console.log('new data is: '+ newData + 'from function : '+cv);
	let error = await check(newData);
	if(!error){
		return newData;
	}
	throw new Error('ERROR FROM DATA PROCESSOR');
}

exports.dataProcessorSync =  (data, ...fn) => { 
	let newData = fn.reduce((acc, cv) => {
        acc = cv(acc);
        return acc;
	}, data);
    // console.log('new data is: '+ newData + 'from function : '+cv);
	let error = checkSync(newData);
	if(!error){
		return newData;
	}
	throw new Error('ERROR FROM DATA PROCESSOR');
}

exports.assignObjectsAsKVP = (...args) => {
	return args.reduce((acc, cv) => {
		for(var key in cv) {
			acc[key] = cv[key];
		}
		return acc;
	}, {});
}

exports.returnObjLiteral = (key, index) => {
	return Object.assign({}, {
		title: `${key}${index}`
	});
}

exports.runLoop = (k, v) => {
	let arr = [];
	for(let i=0; i<v; i++){
		let r = returnObjLiteral(k, i);
		arr.push(r);
	}
	return arr;
}

exports.newArraysByValue = (arr) => {
	return arr.map(o => {
		for(var key in o){
			return runLoop(key, o[key]);
		}
	});
}

exports.resourcesPerPhase = (ingest=1, initial=1, mixtech=2, qc=2, consolidation=1, finalmix=1, deliverables=1) => {
	return Object.assign({}, {
		ingest:ingest,
		initial:initial,
		mixtech:mixtech,
		qc:qc,
		consolidation:consolidation,
		finalmix:finalmix,
		deliverables:deliverables
	});
}

exports.mapBookings = async (object) => {
	return object.bookingsPreProcess.map(booking => {
		let a = getJobLength(booking, object);
		let b = getStartTime(booking, object);
		let c = getSplitBookings(booking, object);
		let d = finalChecks(booking, object);
		return d;   
    });	
}

exports.postProject = async (data) => {
    let { title, bgColor } = data;
    let postdata = JSON.stringify({name: title, backgroundColor: bgColor});
    let project = await post('/project', postdata);
    data.apiResponse = {};
    data.apiResponse.project = project;
    console.log('data to be returned: ', data);
    return await data;
}

exports.testref = async (data) => {
    console.log('test');
    data.NEWREF = 'testsetestestesrtsetstsets'
    return await data;
}

exports.testref2 = async (data) => {
    console.log('test');
    data.NEWREF2222 = '22222222222222222'
    return await data;
}

exports.newprocess = async (model) => {
	let a = await dataProcessor(model, [numResourcesPreProcess]);
	let b = await dataProcessor(a, [preProcessResourceData]);
	let c = await dataProcessor(b, [preProcessArray]);
	let d = await dataProcessor(c, [processBookings]);
	let e = await dataProcessor(d, [sendAll]);
	let f = await dataProcessor(e, [linkAndCache]);
	
	if(f){
		return 'Process Completed Successfully';
	}
	return new Error('could not complete process');
}
