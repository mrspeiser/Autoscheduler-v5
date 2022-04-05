let { returnBody, keyValueObject } = require('../../api/formatBody');

exports.returnPostBody = (newBooking, projectId) => {
    return returnBody(keyValueObject(
        'project', projectId, 
        'resource', newBooking.id, 
        'start', newBooking.startTime, 
        'end', newBooking.endTime, 
        'title', newBooking.title,
        'note', newBooking.note, 
        'allDay', false, 
        'state', 'STATE_DAY_MINUTE', 
        'metadata', 'PENDING'));
}

exports.parseUpdateBody = (booking) => {
    return JSON.stringify(booking);
}