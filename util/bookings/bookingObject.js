
function Booking(id, startTime, endTime, duration, note, title, position){
    this.id = id;
    this.startTime = startTime;
    this.endTime = endTime;
    this.duration = duration;
    this.note = note || 'noNote';
    this.title = title;
    this.position = position || 'none-specified';
    
}
module.exports = Booking;