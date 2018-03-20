var Promise = require('promise');
var Ships = require('shipmodule');


var mongoose = require('mongoose');

var edgeSchema = mongoose.Schema({
  edgeId: Number,
  source: String,
  target: String,
  any: Object // Catch all
});
var Edge = mongoose.model('edges', edgeSchema);

// Connect to Mongo Database 'ABoat'
var connectedToDatabase = false;
mongoose.connect('mongodb://localhost/ABoat', { useMongoClient: true });
var database = mongoose.connection;

database.on('error', console.error.bind(console, 'Error when connecting to database.'));
database.once('open', function () {
  connectedToDatabase = true;
});

function getAllEdges () { // Returns promise
  return getEdges({}, {});
}

// Filter must be in the format of MongoQuerying syntax. returns promise if successful. a limit of 0 is equivalent to no limit
function getEdges (filter, sortObject) {
  // console.log(sortObject);
  // console.log('FILTER:' + JSON.stringify(filter));
  if (connectedToDatabase) {
    return Edge.find(filter).sort(sortObject).lean().exec(); // Returns ship promise. .lean() returns a JS object not a full document, so it can be modified without changing the database
  } else {
    console.log('Error. Not connected to database');
    throw new Error('The server is not connected to a database');
  }
}

// Get edges with pictures
function getEdgesWithPictures (filter, sortObject) {
  return new Promise((resolve, reject) => {
    var edgePromise = getEdges(filter, sortObject);
    edgePromise.then((edges) => {
      console.log(edges[0].source)
      var orArray = []
      filter = {$or: orArray};
      for (var edgeCounter = 0; edgeCounter < edges.length; edgeCounter++) {
        orArray.push({scrapeURL: edges[edgeCounter].source});
        orArray.push({scrapeURL: edges[edgeCounter].target});
      }

      var shipsPromise = Ships.getShips(filter, {}, 0);
      shipsPromise.then((ships) => {
        // Add pictures from shipobjects to edges
        for (var edgeCounter = 0; edgeCounter < edges.length; edgeCounter += 2) {
          var edge = edges[edgeCounter];
          var sourceShip = ships[edgeCounter]
          var targetShip = ships[edgeCounter + 1];
          edge.sourceImage = sourceShip.pictures[0];
          edge.targetImage = targetShip.pictures[0];
          // console.log(edge);
        }
        resolve(edges);
      });
    });
  });
}

module.exports = {
  getEdges: getEdges,
  getAllEdges: getAllEdges,
  getEdgesWithPictures: getEdgesWithPictures
};