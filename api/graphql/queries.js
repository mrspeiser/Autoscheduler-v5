let request = require('request');
let rp = require('request-promise');

exports.getCard = (cardId) => {
    console.log('card id: ', cardId);
    console.log(' ');
   
    var options = { 
        method: 'POST',
        url: 'https://app.pipefy.com/queries',
        body: { query: `{ card(id: 11603279) { id title due_date created_at fields { name value } } }`},
        headers: {
            'Content-Type': 'application/json',
            'Authorization': 'Bearer '
        },
        json: true 
    };
    let p = new Promise(resolve => {
        request(options, function (error, response, body) {
            if (error) throw new Error(error);
            console.log('the body of the response is: ',body);
            console.log(body.data.card.fields);
            resolve(body);
        });
    });
    return p;

}

// exports.getCard = (cardId, query) => {
//     return rp({
//         method: "POST",
//         url: 'https://app.pipefy.com/queries',
//         headers: {
//             'Content-Type': 'application/json',
//             'Authorization': `Bearer `,
//         },
//         body: { query: `{ card(id: 11603279) { id title due_date created_at fields { name value } } }`},
//         qs: query
//     }).then(res => {
//         return new Promise(function(resolve){
//             resolve(JSON.parse(res));
//         });
//     }).catch(err => {
//         console.log('Error caught from POST request to ',+path);
//         console.log(err);
//     });
// }
