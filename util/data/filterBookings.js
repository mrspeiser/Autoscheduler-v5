const cache = require('../../core/cache');
let { parseDateTime, compareDates } = require('../dates/handleDateTime');

exports.emptyBookingsArray = (position) => {
    let emptyBookingsArray = cache.resources.SORTED_RESOURCES[position].reduce((acc, cv) => {
        // console.log('the length for this person is: ', cv.bookings.length);
        if(cv.bookings.length === 0){
            acc.push(cv);
            return acc;
        }
        return acc;
    }, []);
    // console.log('empty bookings: ', emptyBookingsArray);
    return emptyBookingsArray;
}

exports.findSoonestBookingStart = (position) => {
    let bookingsCopy = [...cache.resources.SORTED_RESOURCES[position]]
    let firstBookingForEachResource = bookingsCopy.reduce((acc, cv, i) => {
        // console.log('inside soonest reduce for: ',position);
        // console.log(cv.bookings[0])
        // console.log(' ');
        // let sortedEnds = []
        if(cv.bookings.length > 0){
            // console.log('the bookings.length is greater than 0', cv.bookings, + ' '+position);

            cv.bookings.forEach(v => {
                v.start = parseDateTime(v.start);
                v.end = parseDateTime(v.end);
            });
            
            // if(position === 'MIXERS'){
            //     cv.bookings = cv.bookings.filter(b => b.note != 'finalmix');
            // }

            if(acc.length === 0 || compareDates(acc[0].bookings[0].end, cv.bookings[0].end)){
                // acc.unshift({_id:cv._id, start: end, bookings: sortedEnds,index: i});
                acc.push(cv);
                return acc;
            } else {
                // acc.push({_id:cv._id, start: end, bookings: sortedEnds,index: i})
                acc.unshift(cv);
                return acc;
            }
        } 
        return acc;
    }, []);
    return firstBookingForEachResource;
}

exports.sortMixerBookings = (bookings) => {
    let copy = [...bookings]
    let intialBookings = copy.filter(b => {
        b.note = b.note.replace(/ /g, '');
        // console.log(b.note.length);
        // console.log(test.length);
        return b.note == 'initial';
    });
    let finalmixBookings = copy.filter(b => {
        b.note = b.note.replace(/ /g, '');
        // console.log(b.note.length);
        // console.log(test.length);
        return b.note == 'finalmix';
    });

    return {initial: intialBookings, finalmix: finalmixBookings};
}

exports.filterProjectBookings = (bookings, position) => {
    return bookings.filter(b => {
        let titleSplit = b.title.replace(/ /g, '').split('-')
        let p = titleSplit[1];
        return p === position
    });
}