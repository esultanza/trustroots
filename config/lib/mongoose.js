'use strict';

/**
 * Module dependencies.
 */
var config = require('../config'),
    chalk = require('chalk'),
    path = require('path'),
    mongoose = require('mongoose');

// Load the mongoose models
module.exports.loadModels = function() {
  // Globbing model files
  config.files.server.models.forEach(function(modelPath) {
    require(path.resolve(modelPath));
  });
};

// Initialize Mongoose
module.exports.connect = function(cb) {
  var _this = this;

  var db = mongoose.connect(config.db.uri, function (err) {
    // Log Error
    if (err) {
      console.error(chalk.red('Could not connect to MongoDB!'));
      console.log(err);
    } else {
      // Enabling mongoose debug mode if required
      mongoose.set('debug', config.db.debug);

      // Load modules
      _this.loadModels();

      // Call callback FN
      if (cb) cb(db);
    }
  });
};

module.exports.disconnect = function(cb) {
  mongoose.disconnect(function(err) {
    console.info(chalk.yellow('Disconnected from MongoDB.'));
    cb(err);
  });
};
