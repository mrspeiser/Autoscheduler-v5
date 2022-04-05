let webookjson = { 
    "finished_at": "", 
    "Field \"Content Title\"": "LARGE MOVIE", 
    "actor": {
        "username": "rachel-bassett", 
        "email": "rachel.bassett@twentyfoursevensound.com", 
        "name": "Rachel Bassett", 
        "id": "223575" 
    }, 
    "Field \"Due Date\"": "01/09/2018 16:52", 
    "started_at": "2018-08-09T16:52:22.234-07:00", 
    "id": "9550099", 
    "Field \"TRT\" - Unformatted": "45", 
    "Field \"TRT\"": "90", 
    "title": "AHSOKA S01E02", 
    "assignee_emails": "[]", 
    "current_phase": {"id": "3363739", "name": "INCOMING"}, 
    "created_by": {"username": "rachel-bassett", 
    "email": "rachel.bassett@twentyfoursevensound.com", 
    "name": "Rachel Bassett", 
    "id": "223575"}, 
    "Field \"Due Date\" - Unformatted": "2018-09-01 23:52:00 UTC", 
    "expiration_time": "", 
    "Field \"Languages (If Not Standard)\"": "[u'German', u'Japanese']", 
    "due_date": "2018-09-01T16:52:00.000-07:00", 
    "Field \"Content Title\" - Unformatted": "AHSOKA S01E01", 
    "Field \"Languages (If Not Standard)\" - Unformatted": "[u'German', u'Japanese', u'Italian', u'Spanish', u'Spanish', u'Spanish', u'Spanish', u'Spanish', u'Spanish', u'Spanish', u'German', u'Japanese', u'Italian', u'Spanish', u'Spanish', u'Spanish', u'Spanish', u'Spanish', u'Spanish', u'Spanish', u'four', u'four', u'four', u'four']", 
    "last_moved_at": "2018-08-09T23:52:22.539Z", 
    "lateness_time": "", 
    "assignee_names": "[]", 
    "assignee_usernames": "[]", 
    "assignee_ids": "[]", 
    "Field \"Languages\" - Unformatted": 
    "Not Standard", 
    "action": "card.create", 
    "Field \"Languages\"": "Not Standard"
}



let jsonHook = {
    data: {
        action: 'card.move',
        from: { 
            id: 3878442, 
            name: 'INCOMING' 
        },
        to: { 
            id: 3331373, 
            name: 'INSPECTION' 
        },
        moved_by: { 
            id: 252785,
            name: 'Matthew Speiser',
            username: 'mattrspeiser',
            email: 'mattrspeiser@gmail.com',
            avatar_url: 'https://gravatar.com/avatar/7913b48faed4c8702a733f691750dcda.png?s=128&d=https://d39k3r5odlh0df.cloudfront.net/images/user-avatar-default.png' 
        },
        card: { 
            id: 11603279,
            title: 'IGNORE - MATTHEW TEST',
            pipe_id: '-7yw9ZvE' }
    } 
}


        // console.log(`${title} ${cl} ${nl}`);
        // webookjson["Field \"Content Title\""] = title;
        // webookjson["Field \"TRT\""] = cl;
        // webookjson["Field \"Languages (If Not Standard)\" - Unformatted"] = nl;