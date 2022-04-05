let { parseDateTime } = require('../dates/handleDateTime');

exports.collectSplitBookings = (bookings) => {
    return bookings.reduce((acc, cv) => {
        
        let exists = acc.findIndex((v, i) => {
            // console.log(v[0].title+ ' '+cv.title);
            return v[0].title == cv.title;
        });
        console.log(exists);

        if(exists == -1){
            acc.push([cv]);
            return acc;
        }
        acc[exists].push(cv);
        return acc;
    }, []);
}


exports.cleanBooking = (booking) => {
    let cleanBooking = {...booking};
    delete cleanBooking.nextProjectBooking;
    delete cleanBooking.nextResourceBooking;
    cleanBooking.end = parseDateTime(booking.end);
    cleanBooking.start = parseDateTime(booking.start);
    return cleanBooking
}


