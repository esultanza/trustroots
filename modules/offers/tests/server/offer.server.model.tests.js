'use strict';

/**
 * Module dependencies.
 */
var should = require('should'),
    mongoose = require('mongoose'),
    User = mongoose.model('User'),
    Offer = mongoose.model('Offer');

/**
 * Globals
 */
var user, offer;

/**
 * Unit tests
 */
describe('Offer Model Unit Tests:', function() {

  beforeEach(function(done) {

    user = new User({
      firstName: 'Full',
      lastName: 'Name',
      displayName: 'Full Name',
      email: 'test1@test.com',
      username: 'username1',
      password: 'password123',
      provider: 'local'
    });

    // Create users
    user.save(function() {
      offer = new Offer({
        status: 'yes',
        description: '<p>I can host! :)</p>',
        noOfferDescription: '<p>I cannot host... :(</p>',
        maxGuests: 1,
        updated: new Date(),
        location: [52.498981209298776, 13.418329954147339],
        locationFuzzy: [52.50155039101136, 13.42255019882177]
      });
      done();
    });
  });

  describe('Method Save', function() {
    it('should be able to save without problems', function(done) {

      return offer.save(function(err) {
        should.not.exist(err);
        done();
      });
    });

    it('should be able to save without problems with empty descriptions', function(done) {
      offer.description = '';
      offer.noOfferDescription = '';

      return offer.save(function(err) {
        should.not.exist(err);
        done();
      });
    });

    it('should be able to show an error when try to save without status', function(done) {
      offer.status = '';

      return offer.save(function(err) {
        should.exist(err);
        done();
      });
    });

    it('should be able to show an error when try to save without location', function(done) {
      offer.location = '';

      return offer.save(function(err) {
        should.exist(err);
        done();
      });
    });

  });

  afterEach(function(done) {
    Offer.remove().exec(function() {
      User.remove().exec(done);
    });
  });
});
