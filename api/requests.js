const rp = require("request-promise");

exports.get = (path, data, query) => {
    return rp({
        method: "GET",
        url: `${process.env.HUBPLANNER_ROOT}${path}`,
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `${process.env.HUBPLANNER_APIKEY}`,
            'Ueser-Agent': 'Create Test Project (matthew.speiser@twentyfoursevensound.com)',
        },
        body: data,
        qs: query
    }).then(res => {
        return new Promise(function(resolve){
            resolve(JSON.parse(res));
        });
    }).catch(err => {
        console.log('Error caught from GET request to: ',+path);
        console.log(err);
    });
}

exports.post = (path, data, query) => {
    return rp({
        method: "POST",
        url: `${process.env.HUBPLANNER_ROOT}${path}`,
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `${process.env.HUBPLANNER_APIKEY}`,
            'Ueser-Agent': 'Create Test Project (matthew.speiser@twentyfoursevensound.com)',
        },
        body: data,
        qs: query
    }).then(res => {
        return new Promise(function(resolve){
            resolve(JSON.parse(res));
        });
    }).catch(err => {
        console.log('Error caught from POST request to ',+path);
        console.log(err);
    });
}

exports.put = (path, data, query) => {
    return rp({
        method: "PUT",
        url: `${process.env.HUBPLANNER_ROOT}${path}`,
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `${process.env.HUBPLANNER_APIKEY}`,
            'Ueser-Agent': 'Create Test Project (matthew.speiser@twentyfoursevensound.com)',
        },
        body: data,
        qs: query
    }).then(res => {
        return new Promise(function(resolve){
            resolve(JSON.parse(res));
        });
    }).catch(err => {
        console.log('Error caught from PUT request to ',+path);
    });
}

exports.del = (path, data, query) => {
    return rp({
        method: "DELETE",
        url: `${process.env.HUBPLANNER_ROOT}${path}`,
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `${process.env.HUBPLANNER_APIKEY}`,
            'Ueser-Agent': 'Create Test Project (matthew.speiser@twentyfoursevensound.com)',
        },
        body: data,
        qs: query
    }).then(res => {
        return new Promise(function(resolve){
            resolve(JSON.parse(res));
        });
    }).catch(err => {
        console.log('Error caught from DELETE request to ',+path);
    });
}