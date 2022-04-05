const requestQueue = require('../routes/queue');

const taskChecker = {
    hasRun: false,
    start: function() {
        let hourlyCheck = setInterval(() => {
                let date = new Date();
                let minutes = date.getMinutes();
                let hours = date.getHours();
                let dayOfWeek = date.getDay()
                console.log(minutes);
                if(minutes == 00 && hours >= 10 && hours <= 18 && dayOfWeek >= 1 && dayOfWeek <= 5){
                    console.log(minutes);
                    console.log('RUN THE CHECK');
                    console.log('Check is Commented Out');
                    requestQueue.enqueue('hourlyUpdate', {});
                    this.hasRun = true;
                }
        }, 60000);
    }
}

module.exports = taskChecker;