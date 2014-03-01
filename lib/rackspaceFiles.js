/**
 * This API(all the exports.fn's) could be expanded to add listing of available files and what not, so right now the scope is just limited to the use case of [USER_ID]:[TIMESTAMP].json
 */

// DONT FORGET TO PUT YOUR CREDENTIALS IN HERE BEFORE STARTING SERVER
var PROVIDER = 'rackspace'; // see docs for full list of providers
var USERNAME = 'YOUR_RACKSPACE_USERNAME';
var API_KEY  = 'YOUR_RACKSPACE_API_KEY'; 
var REGION   = 'YOUR_REGION';


var pkgcloud = require('pkgcloud');
// utilities to help with the naming convention and downloading/uploading streams
var utils = require('./rackspaceUtils.js');

// maintain a list of all your containers - the value must match the name of your container on rackspace
var CONTAINERS = {
  customerConfig: 'demo-customer-config'
  // this is a convenient way to keep production and test data separate. You need to implement IS_PRODUCTION and create two containers if you want to implement this.
  // customerConfig: IS_PRODUCTION ? 'demo-customer-config' : 'TEST-demo-customer-config'
};

var rackspaceFiles = pkgcloud.storage.createClient({
  provider: PROVIDER,
  username: USERNAME,
  apiKey: API_KEY,
  region: REGION
});

// make sure the caller is using a valid container - controlled via CONTAINERS
var isValidContainer = function(container){
  for(var c in CONTAINERS){
    if(CONTAINERS[c] === container){
      return true;
    }
  }
  return false;
};

// export containers so callers of this module have a reference to available containers - plus it keeps the values all in one spot - saves you some time if you decide to rename a container later.
exports.CONTAINERS = CONTAINERS;

// Remember the results come back as a String, so if you're expecting JSON you should JSON.parse(results); see exports.getFileByCustomerId()
var getFileFromRackspaceByCustId = function(container, custId, next){
  if(!custId){
    throw new Error('Customer id invalid:' + custId);
  }
  if(!container || !isValidContainer(container)){
    throw new Error('Container is required or container provided is invalid: ' + container);
  }
  //get a list of all the files
  rackspaceFiles.getFiles(container, function(err, files){
    if(err){
      return next(err, null);
    }
    //find the latest fileName for THIS customer
    utils.getLatestConfigFileName(custId, files, function(err, fileName){
      if(err){
        return next(err, null);
      }

      console.log('[INFO] Attempting to retrieve file from rackspace:', fileName, container, custId);

      //finally, get the actual config FILE
      rackspaceFiles.download({
        container: container, 
        remote: fileName
      })
      // pkgcloud's api does uploading/downloading with streams
      .pipe(utils.createMemoryStream(function(err, resultsAsString){
        next(err, resultsAsString);
      }));
    });
  });
};

var saveFileToRackspaceById = function(container, custId, dataToSave, next){
  if(!custId){
    throw new Error('Customer id invalid:' + custId);
  }
  if(!dataToSave){
    throw new Error('Config data requried');
  }
  if(!container || !isValidContainer(container)){
    throw new Error('Container is required or container provided is invalid: ' + container);
  }

  // get the proper name
  var fileName = utils.createConfigFileName( custId );

  console.log('[INFO] Attempting to save file to rackspace:', fileName, container, custId);

  // pkgcloud's api does uploading/downloading with streams
  utils.createReadStream(dataToSave)
    .pipe(
      rackspaceFiles.upload({
        container: container,
        remote: fileName
      }, function(err, result){
        next(err, result);
      })
    );
};

exports.getFileByCustomerId = function(container, customerId, next) {
  getFileFromRackspaceByCustId(container, customerId, function(err, fileAsString){
    // Since the content of the file is treated as a string we have to JSONify it - if you are not storing JSON you will want to remove this JSON.parse();    
    next(err, JSON.parse(fileAsString));
  });
};

// note we always create a new file - with our requirements it isn't really necessary to update files
exports.saveFile = function(container, customerId, data, next) {
  saveFileToRackspaceById(container, customerId, data, next);
};

