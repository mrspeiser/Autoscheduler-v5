Hubplanner Api Integration
=======

## Overview and Structure:

The general flow of data in the application is as follows:

index.js --> parseReq.js --> router.js --> queue.js --> handler.js --> (specified handler corresponds to function);

TO RUN THE APPLICATION: 
> node index.js

######Determining Constants for Each Job:

The constants that determine the jobLength have been changed a few times. These constants are vital to determining how many hours are allocated to each resource in each phase of the pipeline.

view the /util/data/variableData.js file to get a better understanding of how jobLength is calculated. Check out the function:

exports.getJobLength for the most general function that was used

The first thing is to translate the number of minutes into a floating point number or integer.
If the number of minutes is less than 30 minutes. The content length = .5
if the number of minutes is 31 minutes to 60 minutes. The content length ratio = 1
if the number of minutes = 61 minutes to 90 minutes. The content length ratio = 1.5
if the number of minutes is 90 minutes to 120 minutes. The content length ratio = 2
if the number of minutes is 121 minutes or greater. The content length ratio = 2.5

Once the ratio is determined, different positions have different ways to calculate the length of the job.

These numbers have changed a few times but what we have now is:

Ingest jobLength = contentLengthRatio * numberOfLanguages
Initial jobLength = 4 * contentLengthRatio/numWorkers (the 4 represents 4 hours)
Mixtech jobLength = 2 * numLanguages/numWorkers (the 2 represents 2 hours)
QC jobLength = 2 * numLanguages/numWorkers (the 2 represents 2 hours)
Consolidation jobLength = 1 (this is a constant 1 hour);
FinalMix jobLength = 4 * contentLengthRatio/numWorkers
Deliverables jobLength 3 * contentLengthRatio/numWorkers

######Folders:
1. api: exports all functions relating to get, post, update, and delete requests.
2. core: exports and handles all functionality relating to core functionality of the application. The cache, the automated task checker, creating bookings, and updating bookings
3. config: has .env file and all auth keys needed for API and https
4. routes: contains the process queue as post requests come in, action handler, and router for paths.
5. tests: contains the html form and the client side js to handle the submitting of the form
6. util: contains folders with all utility functions specifically for dates, data, bookings, and other general functions. There is duplication among certain files.

######Routes:
1. '/' (POST) - this is the route that the webhook from pipefy will post too.
2. '/projectionsForm' (POST) - this is the route the form posts the data too.
3. '/allcache' (GET) - this route will return a json response of everything stored in the cache
4. '/form' (GET) - This will display the form on localhost
5. '/hourlyUpdate' (POST) - This will cause a ripple to update all bookings in the cache
6. '/deleteAll99943' (POST) - Delete all projects from Hubplanner

** ALL Other routes were for serving static files or general test purposes. The most important routes are listed above.

How the routes work is by passing the name of the function that is needed to run along with the data from the incoming request.

######Queue:
The queue was created to make sure when new requests come in from pipefy that it does not execute until all other processes of updating/creating/modifying/deleting finishes, so that data integrity and conflicts to not occur. The functionality is pretty straight forward.

######Cache:
Being able to quickly access any of the Hubplanner data was important so I created a cache to mirror hubplanner while also linking bookings in a way that Hubplanner was not doing.

Once the app is launced, the data is first all downloaded from Hubplanner. Once the json data is downloaded the cache will sort the data by:
1. sorting all resources by their position, then adding a property which is their next resource Booking ID.
2. sorting all project bookings and linking each project booking to their next project booking Id.

Each booking will have a reference to their next Project booking and their next Resource booking.

######Hander.js:
The handler.js file will point you to the functions that are being used to start the process of creating bookings either automatically or via the form. The most important functions are:
1. newContent
2. newprocess

######Utilities:
The utilities folder contains all of the necessary parsing for dates, access to the cache, and other helper functions in order to create bookings. 
There are 4 main folders inside:

1. bookings:
    - This is where the actual creation of the bookings happen. The bookings get returned via an array of objects
2. data:
    - This folder contains functions that use the cache, return data according to preset variables such as jobLength
3. dates:
    - Contains functins that handle returning dateTime strings, finding the next Morning, the end of the day, calculating date overflows, and other date related calculations/utiliies.
4. lib:
    - The lib folder contains a newest version of the program I was working on. It is being specifically used by the /core/prototype.js file.
5. 
    
######Tests:
This folder contains the html form and the main.js for the client when he goes to /form: http://localhost:4000/form

testing1.js has a really clean way of looking at the process in a very sequential way. This might be a very easy function to read through to get the best understanding of the approach I was going for originally.

######Config
Inside the config folder you will find the cert keys for the https server and the hidden .env file which loads data to the requests file

######API
the api folder has the main file requests.js which exports the REST functions:
  * get
  * post
  * put
  * del

The other folder inside the api, the graphql/ folder was used to create a webhook for pipefy. So pipefy will send requests to a cloud server I have on Digital Ocean for testing purposes. Eventually it will be moved to AWS.

