// var graphqlRequest = require("graphql-request");
const { request, GraphQLClient } = require('graphql-request');
var reqst = require('request');

// var options = { 
//   method: 'POST',
//   url: 'https://app.pipefy.com/queries',
//   body: { query: `mutation { createWebhook( input: { pipe_id: 484893 name: "Netflix Webhook" email: "mattrspeiser@gmail.com" url: "http://159.65.98.35:4000/" actions: ["card.move"] }) { webhook { id name }} }`},
//   headers: {
//     'Content-Type': 'application/json',
//     'Authorization': 'Bearer '
//   },
//   json: true };
// var options = { 
//   method: 'POST',
//   url: 'https://app.pipefy.com/queries',
//   body: { query: `mutation { deleteWebhook( input: { id: 722}) { success } }`},
//   headers: {
//     'Content-Type': 'application/json',
//     'Authorization': 'Bearer '
//   },
//   json: true };

  exports.createWebHook = () => {
    reqst(options, async function (error, response, body) {
      if (error) throw new Error(error);
      console.log(body);
      console.log(body.data);
      return await body.data;
    });


//IMPORTANT//
// { createWebhook: { webhook: { id: '7228', name: 'Netflix Webhook' } } }
//IMPORTANT//

// const pipefy = new GraphQLClient('https://app.pipefy.com/queries', {
//   headers: {
//     'Content-Type': 'application/json',
//     'Authorization': ''
//   }
// });

// const query = ` { query mutation { createWebhook( input: { pipe_id: 494061 name: "Next Webhook" email: "mattrspeiser@gmail.com" url: "http://159.65.98.35:4000/ actions: ["card.move"] headers: "{\"Content-Type\": \"application/json\"}" }) { webhook { id name }} }`
// let query = { "query": "{ me { id name username email avatar_url created_at locale time_zone } }" }
// query = JSON.stringify(query);


  // pipefy.request(query)
  //   .then(data => {
  //     console.log('return data: ');
  //     console.log(JSON.parse(data))
  //   })
  //   .catch(err => {
  //     // for(var key in err.response){
  //     //   console.log(key);
  //     // }
  //     console.log(' ')
  //     console.log('Inside Error Block')
  //     console.log(err.response.error);
  //     console.log(' ')
  //   });
}
// exports.createWebHook = () => {
//   request({
//     method: 'POST',
//     url: 'https://app.pipefy.com/queries',
//     headers: {
//       'Content-Type': 'application/json',
//       'Authorization': ''
//     },
//     body: "{  \"query\": \"{ me { id name username email avatar_url created_at locale time_zone } }\"}"
//   }, function(err, res, body) {
//       if(err){
//         console.log(err);
//       }
//       console.log(res);
//       console.log('Status:', res.statusCode);
//       console.log('Headers:', JSON.stringify(res.headers));
//       console.log('body:',body);
  
//   })


// }
