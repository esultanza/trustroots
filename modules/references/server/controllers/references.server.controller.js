'use strict';

/**
 * Module dependencies.
 */
var path = require('path'),
    errorHandler = require(path.resolve('./modules/core/server/controllers/errors.server.controller')),
    async = require('async'),
    mongoose = require('mongoose'),
    User = mongoose.model('User'),
    Message = mongoose.model('Message'),
    Thread = mongoose.model('Thread'),
    ReferenceThread = mongoose.model('ReferenceThread');

/**
 * Create a new thread reference
 */
exports.createReferenceThread = function(req, res) {

  if(!req.user || (req.user && !req.user.public)) {
    return res.status(403).send({
      message: errorHandler.getErrorMessageByKey('forbidden')
    });
  }

  // Validate userTo ID
  if(!mongoose.Types.ObjectId.isValid(req.body.userTo)) {
    return res.status(400).send({
      message: errorHandler.getErrorMessageByKey('invalid-id')
    });
  }

  async.waterfall([

    // Make sure referenced thread exists and that UserFrom is participating in it
    // Figure out userTo-id (i.e. don't trust the client)
    function(done) {

      Thread.findOne(
        {
          $or: [
            { userFrom: req.user._id, userTo: req.body.userTo },
            { userTo: req.user._id, userFrom: req.body.userTo }
          ]
        },
        'userTo userFrom',
        function(err, thread) {

          if (err || !thread) {
            return res.status(400).send({
              message: 'Thread does not exist.'
            });
          }
          else if(thread) {
            // UserTo at the thread is currently authenticated user
            if(thread.userTo && thread.userTo.equals(req.user._id)) {
              done(null, thread._id, thread.userFrom);
            }
            // userFrom at the thread is currently authenticated user
            else if(thread.userFrom && thread.userFrom.equals(req.user._id)) {
              done(null, thread._id, thread.userTo);
            }
            // Currently authenticated user is not participating in this thread!
            else {
              return res.status(403).send({
                message: errorHandler.getErrorMessageByKey('forbidden')
              });
            }
          }
        }
      );

    },

    // Make sure targeted user has actually sent messages to user who is leaving the reference
    function(threadId, referenceUserTo, done) {

      Message.findOne(
        {
          userFrom: referenceUserTo,
          userTo: req.user._id
        },
        'userFrom userTo',
        function(err, message) {
          if(!err && message) {
            done(null, threadId, referenceUserTo);
          }
          else {
            console.log('Not allowed per message rules');
            return res.status(403).send({
              message: 'Referenced person has not sent messages to to you.'
            });
          }
        }
      );

    },

    // Save referenceThread
    function(threadId, referenceUserTo, done) {

      var referenceThread = new ReferenceThread(req.body);

      referenceThread.thread = threadId;
      referenceThread.userFrom = req.user._id;
      referenceThread.userTo = referenceUserTo;
      referenceThread.created = new Date(); // Ensure user doesn't try to set this

      referenceThread.save(function(err, savedReferenceThread) {
        if (err) {
          return res.status(400).send({
            message: errorHandler.getErrorMessage(err)
          });
        } else {
          return res.json(savedReferenceThread);
        }
      });
    }

  ], function(err) {
    if (err) {
      return res.status(400).send({
        message: errorHandler.getErrorMessage(err)
      });
    }
  });

};


/**
 * Show the current Offer
 */
exports.readReferenceThread = function(req, res) {
  res.json(req.referenceThread || {});
};


// Reference Thread reading middleware
exports.readReferenceThreadById = function(req, res, next, userToId) {

  // Check if user is authenticated
  if(!req.user) {
    return res.status(403).send({
      message: errorHandler.getErrorMessageByKey('forbidden')
    });
  }

  // Not a valid ObjectId
  if(!mongoose.Types.ObjectId.isValid(userToId)) {
    return res.status(400).send({
      message: errorHandler.getErrorMessageByKey('invalid-id')
    });
  }

  async.waterfall([

    // Check if we have refference thread stored
    function(done) {

      ReferenceThread.findOne({
          userTo: userToId,
          userFrom: req.user._id // Ensure we get only references we are allowed to read
        })
        .sort('-created') // Latest first
        .exec(function(err, referenceThread) {

          if(err) return next(err);

          // Found, move on to the next middleware
          if(referenceThread) {
            req.referenceThread = referenceThread;
            return next();
          }
          // No existing reference thread found, move on to do more checks
          else {
            done(null);
          }
        });
    },

    // Since no pre-existing reference thread found,
    // check if authenticated user would be allowed to send reference to this user at all
    function(done) {

      Message.findOne({
          userFrom: userToId,
          userTo: req.user._id
        }, function(err, message) {

          if(err) return next(err);

          // Return 404, but also let client know if we would allow creating a referenceThread
          return res.status(404).send({
            message: errorHandler.getErrorMessageByKey('not-found'),
            allowCreatingReference: (message) ? true : false
          });

        });

    }

  ], function(err) {
    if (err) {
      return next(err);
    }
  });


};
