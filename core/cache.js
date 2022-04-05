const { get, post } = require('../api/requests');

const cache = {
    resources: {
        ALL_RESOURCES: [],
        SORTED_RESOURCES: {}
    },
    projects: [],
    bookings: [],
    bookingsByProjectId: {},
    previousProjectColor: '',
    updatedIds: [],
    init: async function() {
        console.log('init started');
        try { 
            let all = await Promise.all([
                get('/resource'), 
                get('/project/?sort=+updatedDate'), 
                get('/booking?sort=+end')]);
            
            this.resources.ALL_RESOURCES = all[0];
            this.projects = all[1];
            this.bookings = all[2];
            
            console.log('cache loaded successfully '+
            '\n'+'resources: '+this.resources.ALL_RESOURCES.length+
            '\n'+'projects: '+this.projects.length+
            '\n'+'bookings: '+this.bookings.length);
            
            let sorted = await this.sortResources();
            this.resources.SORTED_RESOURCES = sorted;
            let finishState = await this.loadSortedBookings();
            console.log('finish state of Loading Resource bookings is: ',finishState);
            // this.loadProjectBookings();
            this.sortBookings();
            
        } catch (err) {
            throw new Error('Could Not Initialize Cache!'+ 
            '\n'+'resources: '+this.resources.length+
            '\n'+'projects: '+this.projects.length+
            '\n'+'bookings: '+this.bookings.length);
        }
    },
    load: async function() {
        // console.log(this.bookingsByProjectId);
        // console.log(this.projects);
    },
    sortResources: async function() {
        let sortedResources = await this.resources.ALL_RESOURCES.reduce((acc, cv) => {
            let rmv = cv.lastName.replace(/ /g, '');
            let abv = rmv.split('-')[1];
            if(abv === 'MA'){
                cv.bookings = [];
                acc.MA.push(cv)
                return acc;
            } else if(abv === 'Mixer'){
                cv.bookings = [];
                acc.MIXERS.push(cv);
                return acc;
            } else if(abv === 'MT'){
                cv.bookings = [];
                acc.MIXTECHS.push(cv);
                return acc;
            } else if(abv === 'QC'){
                cv.bookings = [];
                acc.QC.push(cv);
                return acc;
            } else {
                // console.log('no match found for: ', cv);
                return acc;
            }
        }, {MA:[], MIXERS:[], MIXTECHS:[], QC:[]});
        return sortedResources;
    },
    loadSortedBookings: async function() {
        try {
            for(var position in this.resources.SORTED_RESOURCES){
                console.log(position)
                let sorted = await Promise.all(this.resources.SORTED_RESOURCES[position].map(async (r, i) => {
                    let res = await post('/booking/search', JSON.stringify({'resource': r._id}), {'sort': 'end'});
                    console.log(`loaded ${r.firstName} ${r.lastName} bookings successfully with ${res.length} items`);
                    res = res.map((b, i, arr) => {
                        if(arr.length-1 == i){
                            b.nextResourceBooking = 'NULL';
                            // console.log(b);
                            return b
                        }
                        b.nextResourceBooking = arr[i+1]._id;
                        // console.log(b);
                        return b
                    });
                    this.resources.SORTED_RESOURCES[position][i].bookings = [...res];
                }));
            }
            
            return 'True'
        } catch (err) {
            console.log('could not load and sort bookings');
            console.log(err);
        }
    },
    loadProjectBookings: async function() {
        try {
            this.projects.map(v => {
                v.metadata = new Date(v.metadata);
                return v;
            });
            this.projects.sort((a,b) => a.metadata - b.metadata);
            let reduced1 = await this.projects.reduce((acc, cv, i, arr) => {
                if(i === arr.length-1){
                    cv.previousProject = `${arr[i-1]._id}`
                    cv.nextProject= 'NULL';
                } else if(i === 0){
                    cv.previousProject = 'NULL';
                    cv.nextProject = arr[i+1]._id;
                } else {
                    cv.previousProject = arr[i-1]._id;
                    cv.nextProject = arr[i+1]._id;
                }

                let modifiedProject = {...cv};
                acc.push(modifiedProject);
                return acc;
            }, []);


            let reduced2 = reduced1.map(p => {
                let ingest = exports.getIngestBookings(p, 'ingest');
                let initial = exports.getInitialBookings(p, 'initial');
                let mixtech = exports.getMixtechBookings(p);
                let qc = exports.getQCBookings(p);
                let consol = exports.getColidateBookings(p, 'consolidate');
                let finalmix = exports.getFinalMixBookings(p, 'finalmix');
                let deliverables =  exports.getDeliverablesBookings(p, 'deliverables');

                let bookings = [...ingest, ...initial, ...mixtech, ...qc, ...consol, ...finalmix, ...deliverables];
                p.bookings = bookings.map((b, i, a) => {
                    if(i === arr.length-1){
                        b.nextProjectBooking = "NULL";
                        b.prevProjectBooking = a[i-1]._id;
                    } else if(i === 0){
                        b.nextProjectBooking = a[i+1]._id;
                        b.prevProjectBooking = "NULL";
                    } else {
                        b.nextProjectBooking = a[i+1]._id;
                        b.prevProjectBooking = a[i-1]._id;
                    }
                    return b;
                });
                return p;
            });


            this.projects = reduced2;
        } catch(err) {
            console.log('could not process existing project bookings');
            console.log(err);
        }
    },
    sortBookings: async function() {
        try {
            let sortedBookings = await this.bookings.reduce((acc, cv) => {
                // console.log(cv.project);
                if(acc[cv.project]){
                    // console.log('project id exists');
                    acc[cv.project].push(cv);
                    return acc
                }
                // console.log('project id does not exist');
                acc[cv.project] = [{...cv}];
                return acc;
            }, {});
            
            for(var key in sortedBookings){
                sortedBookings[key].forEach((v, i, arr) => {
                    let position = exports.translatePosition(v.title);
                    let rIndex = this.resources.SORTED_RESOURCES[position].findIndex(x => x._id == v.resource);
                    let matchingBooking = this.resources.SORTED_RESOURCES[position][rIndex].bookings.findIndex(x => x._id == v._id);

                    if(i === arr.length-1){
                        v.nextProjectBooking = 'NULL';
                        this.resources.SORTED_RESOURCES[position][rIndex].bookings[matchingBooking].nextProjectBooking = 'NULL'
                        v.nextResourceBooking = this.resources.SORTED_RESOURCES[position][rIndex].bookings[matchingBooking].nextResourceBooking
                        return;
                    }
                    v.nextProjectBooking = arr[i+1]._id;
                    this.resources.SORTED_RESOURCES[position][rIndex].bookings[matchingBooking].nextProjectBooking = arr[i+1]._id;
                    v.nextResourceBooking = this.resources.SORTED_RESOURCES[position][rIndex].bookings[matchingBooking].nextResourceBooking
                });
            }
            // console.log(sortedBookings);
            this.bookingsByProjectId = sortedBookings;
            // console.log(this.bookingsByProjectId);
        } catch(err) {
            console.log('could not process reducing of sorted bookings');
            console.log(err);
        }
    },
    sortProjectsByCompletion: async function() {

    }

};

exports.translatePosition = (title) => {
    // console.log(title);
    let mt = RegExp('- MixTech*');
    let qc = RegExp('- QC*');
    let ma1 = RegExp('- Ingest', 'i');
    let ma2 = RegExp('- deliverables');
    let mixer1 = RegExp('- initial');
    let mixer2 = RegExp('- finalmix');
    let cons = RegExp('- Consolidation*', 'i');

    if(ma1.test(title) || ma2.test(title)){
        return 'MA'
    } else if(mixer1.test(title) || mixer2.test(title)){
        return 'MIXERS'
    } else if(mt.test(title)){
        return 'MIXTECHS'
    } else if(qc.test(title)){
        return 'QC'
    } else if(cons.test(title)){
        return 'MA'
    } else {
        console.log('ERROR, NO MATCH FOUND FROM TITLE '+title);
    }
}

exports.translateAbbreviation = (abv) => {
    if(abv === 'MA'){
        return 'MA';
    } else if(abv === 'Mixer'){
        return 'MIXERS';
    } else if(abv === 'MT'){
        return 'MIXTECHS';
    } else if(abv === 'QC'){
        return 'QC';
    } else {
        // console.log('no match found for: ', cv);
        return acc;
    }
}

exports.getIngestBookings = (p, note) => {
    return this.bookings.filter(b => {
        return b.project === p._id && b.note === note;
    });
};

exports.getInitialBookings = (p, note) => {
    return this.bookings.filter(b => {
        return b.project === p._id && b.note === note;
    });
};

exports.getMixtechBookings = (p) => {
    let mixtechNum = 1;
    let foundAllMixtechs = false;
    let mixtechBookings = [];
    while(!foundAllMixtechs){
        let re = RegExp(`- MixTech ${mixtechNum}`);
        let res = this.bookings.filter(b => {
            return b.project === p._id && re.test(b.title);
        });
        mixtechNum+=1
        if(res.length <= 0){
            foundAllMixtechs = true;
            break;
        }
        mixtechBookings = [...mixtechBookings, ...res];
    }
    return mixtechBookings;
};

exports.getQCBookings = (p) => {
    let qcNum = 1;
    let foundAllQCs = false;
    let qcBookings = [];
    while(!foundAllQCs){
        let re = RegExp(`- QC ${qcNum}`);
        let res = this.bookings.filter(b => {
            return b.project === p._id && re.test(b.title);
        });
        qcNum+=1;
        if(res.length <= 0){
            foundAllQCs = true;
            break;
        }
        qcBookings = [...qcBookings, ...res];
    }
};

exports.getColidateBookings = (p, note) => {
    return this.bookings.filter(b => {
        return b.project === p._id && b.note === note;
    });
};

exports.getFinalMixBookings = (p, note) => {
    return this.bookings.filter(b => {
        return b.project === p._id && b.note === note;
    });
};

exports.getDeliverablesBookings = (p, note) => {
    return this.bookings.filter(b => {
        return b.project === p._id && b.note === note;
    });
};





module.exports = cache;