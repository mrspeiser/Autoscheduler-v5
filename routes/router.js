const requestQueue = require('./queue');
const fs = require('fs');
const cache  = require('../core/cache');
let { checkForExistingTitle } = require('../util/data/cacheAccess');

const Router = async (req, res, data) => {
    switch(req.url){
        case '/':
            if(Object.keys(data).length === 0 && data.constructor === Object) {
                res.write('home page');
                res.end();
            } else if(data.data.from.name == 'INCOMING'){
                requestQueue.enqueue('create', data);
                res.write('home page');
                res.end();
            } else if(data.data.card.title) {
                let projectTitle = data.data.card.title;
                requestQueue.enqueue('update', { title: projectTitle ,user: data.data.moved_by.name })
                res.write('home page');
                res.end();
            } else {
                res.write('home page');
                res.end();
            }
            break;
        case '/projectionsForm':
            requestQueue.enqueue('createProjection', data);
            res.write('request successful');
            res.end();
            break;
        case '/hourlyUpdate':
            requestQueue.enqueue('hourlyUpdate');
            res.write('running check bookings');
            res.end();
            break;
        case '/allcache':
            res.write(JSON.stringify(cache));
            res.end();
            break;
        case '/formSubmit':
            requestQueue.enqueue('formSubmit', data);
            res.write(JSON.stringify('200'))
            res.end();
            break;
        case '/form':
            fs.readFile("./tests/html/form.html", (err, page) => {
                if(err) {
                    console.log(err);
                    res.writeHeader(400)
                    res.write('ERROR');
                    res.end()
                } else {
                    res.writeHeader(200, {"Content-Type": "text/html", "Content-Length":page.length})
                    res.write(page);
                    res.end();
                }
            });
            break;
        case '/main.js':
            fs.readFile("./tests/html/main.js", (err, data) => {
                if(err){
                    res.writeHead(404);
                    res.write('not found');
                    res.end();
                } else {
                    res.writeHead(200, {'Content-Type': 'text/javascript'});
                    res.write(data);
                    res.end()
                }
            });
            break;
        case '/pipeline':
            let title = await data['Field "Content Title'];
            let checkForTitle = checkForExistingTitle(title);
            if(checkForTitle){
                console.log(' ');
                console.log('the title exists in storage');
                console.log(' ');
                requestQueue.enqueue('update', data);
                res.end();
            } else{
                console.log(' ');
                console.log('the title does not exist');
                console.log(' ');
                requestQueue.enqueue('create', data);
                res.end();
            }
            break;
        case '/test':
            var request = {name: Math.floor(Math.random()*11)}
            requestQueue.enqueue('testing', request)
            res.write('test page');
            res.end();
            break;
        case '/newWebHook':
            requestQueue.enqueue('createWebHook');
            res.write('attempting to create new webhook');
            res.end();
            break;
        case '/incomingProject':
            requestQueue.enqueue('create', data);
            res.write('incoming');
            res.end();
            break;
        case '/updateTest':
            requestQueue.enqueue('update', data);
            res.write('update');
            res.end();
            break;
        case '/createAndUpdate':
            requestQueue.enqueue('createAndUpdate');
            res.write('create and update');
            res.end();
            break;
        case '/deleteAll99943':
            requestQueue.enqueue('deleteAll');
            res.write('deleting all projects');
            res.end();
            break;
        case '/updateAProjects':
        requestQueue.enqueue('updateAProjectState');
        res.write('updating a project');
        res.end();
        break;
    }
}

module.exports = Router;