const handler = require('./handler');

function Queue(){
    this.tasks = [];
    this.runningTask = false;
    this.exits = [];

    this.enqueue = (name, req) => {
        // console.log('body passed to ENQUEUE: ',req);
        this.tasks.push({func: name, data: req});
        if(!this.runningTask){
            this.dequeue()
        }
    },
    this.dequeue = async () => {
        this.runningTask = true;
        try {
            while(this.checkTask()){
                exit = await this.runNextTask(this.tasks.shift());
                this.exits.push(exit);
            }
            this.runningTask = false;
            console.log('while loop finished');
            console.log('exits: ',this.exits);
        } catch (err){
            console.log(err+ ' '+exit);
            console.log('dequeue ecountered an error');
        }
    },
    this.runNextTask = async (firstElement) => {
        try {
            let exitStatus = await handler(firstElement);
            return exitStatus;
        } catch (err) {
            console.log('Error inside runNextTask '+
            '\n err: ', err);
        }

    },
    this.checkTask = () => {
        console.log('number of tasks is: ', this.tasks.length)
        if(this.tasks.length > 0){
            return true;
        }
        return false;
    }
}
const requestQueue = new Queue();

module.exports = requestQueue;