require('dotenv').config({path: './config/.env'});
const http = require('http');
const https = require('https');
const fs = require('fs');
const cache = require('./core/cache');
const taskChecker = require('./core/taskChecker');
const {parseBody} = require('./util/parseReq');

const options = {
    key: fs.readFileSync('./config/server-key.pem'),
    cert: fs.readFileSync('./config/server-cert.pem')
}

const httpServer = http.createServer(async (req, res) => {
    parseBody(req, res);
});
httpServer.listen(4000, () => {
    console.log('http server listening');
    cache.init()
    taskChecker.start();
    
});

const httpsSever = https.createServer(options);
httpsSever.listen(4443, req => {
    console.log('https server running');
});