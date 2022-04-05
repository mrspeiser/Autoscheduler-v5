let { newContent, updateProject, hourlyUpdate } = require('../core/actions');
let { newProjection } = require('../core/projections');
let { newprocess } = require('../core/prototype');
let { timeOuts, deleteAll, createAndUpdate, updateProjectState, createViaForm } = require('../tests/testing1');
let { createWebHook } = require('../api/graphql/webhook');

let handler = async (task) => {
    // console.log('handler received a task: ', task);
    switch (task.func){
        case 'create':
            return await newContent(task.data);
        case 'createProjection':
            return await newprocess(task.data);
        case 'update':
            return await updateProject(task.data);
        case 'hourlyUpdate':
            return await hourlyUpdate();
        case 'testing':
            return await timeOuts(task.data);
        case 'createAndUpdate':
            return await createAndUpdate();
        case 'deleteAll':
            return await deleteAll();
        case 'createWebHook':
            return await createWebHook();
        case 'updateAProjectState':
            return await updateProjectState();
        case 'formSubmit':
            return await createViaForm(task.data);
        default:
            console.log('no action');
            break;
    }
}

module.exports = handler;