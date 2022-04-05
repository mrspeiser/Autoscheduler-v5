const router = require('../routes/router');

exports.parseBody = (req, res) => {
    console.log('parse body function started');
    if(req.method === 'POST'){
        let body = '';
        req.setEncoding('utf8');
        
        req.on('data', (chunk) => {
            body+=chunk;
        });

        req.on('end', () => {
            console.log('data chunking has ended');
            try {
                let json = JSON.parse(body);
                console.log('parsed json is: ', json);
                router(req, res, json);
            } catch(err){
                console.log('could not parse body from request');
                console.log('error: ', err);
            }
        });
        
    } else {
        router(req, res, {});
    }
}