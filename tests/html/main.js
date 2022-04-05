(function(){

    //if you are looking for the webhook json from zapier look in junkfiles
    //if you are looking for the incoming webhook json from Pipefy, look in junkfiles
    
    // Init of data
    let response = [];
    fetch(`http://localhost:4000/allcache`)
    .then(d => d.json())
    .then(json => response = {...json})
    .catch(err => console.log(err));

    // closure of option tags to run
    let fn = () => {
        return (data) => {
            return data.map(v => `<option value="${v._id}">${v.lastName}</option>`)
        }
    }
    let allOptions = fn();

    // Handle form submit
    let handleSubmit = (e) => {
        e.preventDefault();
        // All Standard Inputs
        let inputs = document.getElementsByTagName('input');
        
        let title = inputs[0].value;
        let contentLength = inputs[1].value;
        let numberOfLanguages = inputs[2].value;

        if(title.length === 0 || contentLength.length === 0 || numberOfLanguages.length === 0){
            if(document.getElementById('error')){
                return
            }
            let form = document.getElementById('form1');
            form.insertAdjacentHTML('afterbegin', `<p id="error" style="color:red">Title, Content Length, and Number of languages must be greater than 0</p>`);
            return;
        }
        let projectStart = inputs[3].value
        //INPUT 4 is the checkbox SKIP INPUT 4
        let numIngest  = inputs[5].value
        let numMixers = inputs[6].value
        let numMixtechs = inputs[7].value
        let numQcs = inputs[8].value
        let numConsolidation = inputs[9].value;
        let numFinalmix = inputs[10].value  
        let numDeliverables = inputs[11].value
        
        // All manual resource selection inputs
        let selected = document.getElementsByTagName('select')
        let arr = [].slice.call(selected);
        let ids = arr.map(v => v.value);

        let newData = {
            title,
            contentLength,
            numberOfLanguages,
            projectStart,
            numIngest,
            numMixers,
            numMixtechs,
            numQcs,
            numConsolidation,
            numFinalmix,
            numDeliverables,
            ids
        }

        let newJson = JSON.stringify(newData);
        console.log(newJson);
        if(document.getElementById('error')){
            document.getElementById('error').remove();
        }
        // Post request to server
        fetch(`http://localhost:4000/projectionsForm`, {
            method: 'POST',
            mode: 'cors',
            headers: {
                "Content-Type": "application/json; charset=utf-8"
            },
            body: JSON.stringify(newJson)
        })
        .then(res => {
            console.log('response is: ');
            console.log(res);
        })
        .catch(err => {
            console.log('error with request');
            console.log(err);
        })
    }

    // add the select and option elements on click
    let addSelection = (e) => {
        e.preventDefault();
        e.stopPropagation();
        let buttonChecked = document.getElementById('specify').checked;
        
        //check to see if button is checked
        if(!buttonChecked){
            return
        }
        let val = e.target.value;
        let target = e.target.nextElementSibling;        
        
        while(target.firstChild){
            target.removeChild(target.firstChild);
        }
        let options = allOptions(response.resources.ALL_RESOURCES);

        for(var i=0; i<val; i++){
            target.insertAdjacentHTML('beforeend', 
                `<select id="${i}" style="display:block">
                    ${options}
                </select>`)
        }
    }

    let handleCheckbox = () => {
        let buttonChecked = document.getElementById('specify').checked;
        let numberInputsALO = document.querySelectorAll("[type=number]");
        let numberInputs = [].slice.call(numberInputsALO);
        let siblings = numberInputs.map(ni => ni.nextElementSibling);
        if(buttonChecked){
            console.log('button checked');            
            siblings.forEach((s, i) => {
                let num = numberInputs[i].value;
                let options = allOptions(response.resources.ALL_RESOURCES);
                for(var j=0; j<num; j++){
                    s.insertAdjacentHTML('beforeend', 
                    `<select id="${j}" style="display:block">
                        ${options}
                    </select>`)
                }
            });
        } else {
            console.log('button unchecked');
            siblings.forEach(s => {
                while(s.firstChild){
                    s.removeChild(s.firstChild);
                }
            });
        }
    }
    ////////////////////////////////////////////
    ////////////////////MAIN////////////////////
    ////////////////////////////////////////////

    console.log('loaded js file');
    let numberInputs = document.querySelectorAll("[type=number]");
    numberInputs.forEach(input => input.addEventListener('click', addSelection));
    
    let specifyCheckbox = document.getElementById('specify');
    specifyCheckbox.addEventListener('click', handleCheckbox);
    
    let form = document.getElementById('form1');
    form.addEventListener('submit', handleSubmit);
    
    
    // console.log(numberInputs);
    // console.log(form);


})()