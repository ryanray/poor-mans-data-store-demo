var Stream = require('stream');
var util = require('util');
var Bffr = require('buffer');

var utils = {
  // [CUSTOMER_ID]:[TIMESTAMP].json
  createConfigFileName: function(customerId){
    return customerId + ':' + new Date().getTime() + '.json';
  },
  createReadStream: function(data){
    var Readable = Stream.Readable;

    var StringReader = function(str, opt){
      Readable.call(this, opt);
      this._data = str;
    };

    util.inherits(StringReader, Readable);

    StringReader.prototype._read = function(){

      if(!this._data){
        this.push(null);
      }
      else {
        var buf = new Buffer(this._data, 'utf-8');
        this.push(buf);
        this._data = null;
      }
    };

    return new StringReader(data);
  },
  createMemoryStream: function(onEnd){
    var stream = new Stream.Writable();
    var result = new Buffer('');
    stream._write = function(chunk, enc, next){
      var buffer = (Buffer.isBuffer(chunk)) ? chunk : new Buffer(chunk, enc);
      result = Buffer.concat([result, buffer]);
      next();
    };
    stream.on('finish', function(){
      onEnd(null, result.toString());
    });
    stream.on('error', function(){
      console.error('Problem with memoryStream:', arguments);
      onEnd(new Error('There was a problem reading the stream from rackspace.'), null);
    });
    return stream;
  },
  // remove file extension and return the id and timestamp split up in array
  splitIdFromTimestamp: function(name){
    return ( name && name.split ) ? name.replace('.json','').split(':') : [];
  },
  getLatestConfigFileName: function(id, files, next){
    // store the latest valid fileName and TS
    var latestFileName; //filename === customer id + timestamp of when the file was created
    var latestTs = 0;
    // array result after splitting the name
    var split;
    // current itr id
    var currId;
    // current itr timestamp
    var currTs;

    if(!id || !files || !next){
      return next(new Error('Id:' + id + ' or files: ' + files + ' or next: ' + next + ' missing!'));
    }

    //iterate over each file - saving the one that matches the id with the latest date
    for(var i = 0, l=files.length; i<l; i++){
      //break up the id and timestamp
      split = this.splitIdFromTimestamp(files[i].name);
      currId = split[0];
      currTs = parseInt(split[1]);

      if(id === currId && currTs > latestTs){

        latestFileName = files[i].name;
        latestTs = currTs;
      }
    }

    if(latestFileName && latestTs){
      // Huzzah! We got a match, send back the whole fileName
      next(null, latestFileName);
    }
    else {
      // no match
      next(new Error('No config file found for id: ' + id), null);
    }
  }
};

module.exports = utils;