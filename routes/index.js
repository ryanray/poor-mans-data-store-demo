var rackspaceFiles = require('../lib/rackspaceFiles.js');
/*
 * GET home page.
 */

// typically you'd get this from the request
var CUSTOMER_ID = "100";

// Always get the container from rackspaceFiles so the list is maintained in one spot.
var CONTAINER = rackspaceFiles.CONTAINERS.customerConfig;

var renderIndex = function(res, data){
  res.render('index', { title: 'Express', customer: data });
};

exports.index = function(req, res){
  //get customer data from 
  rackspaceFiles.getFileByCustomerId(CONTAINER, CUSTOMER_ID, function(err, data){
    if(err){
      throw new Error('Unable to get file for customer id: ' + CUSTOMER_ID);
    }
    renderIndex(res, data);
  });
};

exports.save = function(req, res){
  if(!req.body.firstName || !req.body.lastName || !req.body.email){
    throw new Error('Missing required fields');
  }
  // get data from POSTed form
  var customerData = {
    id: CUSTOMER_ID,
    firstName: req.body.firstName,
    lastName: req.body.lastName,
    email: req.body.email
  };

  // To save a file you have to pass in a string - so convert our json object to a string before passing it to rackspace
  var dataAsString = JSON.stringify(customerData);

  // save data to rackspace
  rackspaceFiles.saveFile(CONTAINER, CUSTOMER_ID, dataAsString, function(err, result){
    if(err){
      throw new Error('Problem saving file to rackspace!');
    }
    res.redirect('/');
  });
};