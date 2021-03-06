'use strict';

var should = require('should'),
    request = require('supertest'),
    path = require('path'),
    mongoose = require('mongoose'),
    User = mongoose.model('User'),
    Contact = mongoose.model('Contact'),
    express = require(path.resolve('./config/lib/express'));

/**
 * Globals
 */
var app, agent, credentials,
    user1, user2, user3,
    user1Id, user2Id, user3Id,
    contact1, contact2, contact3,
    contact1Id, contact2Id, contact3Id;

/**
 * Contact routes tests
 */
describe('Contact CRUD tests', function() {

  before(function(done) {
    // Get application
    app = express.init(mongoose);
    agent = request.agent(app);

    done();
  });

  beforeEach(function(done) {
    // Create userFrom credentials
    credentials = {
      username: 'loremipsum',
      password: 'Password123!'
    };

    // Create a new user
    user1 = new User({
      firstName: 'Full',
      lastName: 'Name',
      displayName: 'Full Name',
      email: 'test1@test.com',
      username: credentials.username,
      password: credentials.password,
      provider: 'local',
      public: true
    });

    // Create a new user
    user2 = new User({
      firstName: 'Full',
      lastName: 'Name',
      displayName: 'Full Name',
      email: 'test2@test.com',
      username: credentials.username + '2',
      password: credentials.password,
      provider: 'local',
      public: true
    });

    // Create a new user
    user3 = new User({
      firstName: 'Full',
      lastName: 'Name',
      displayName: 'Full Name',
      email: 'test3@test.com',
      username: credentials.username + '3',
      password: credentials.password,
      provider: 'local',
      public: true
    });

    // Set dates to the past to make sure contacts are storted in right order for tests
    var yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);

    var daybefore = new Date();
    daybefore.setDate(daybefore.getDate() - 2);

    // Contacts saved to DB
    contact1 = new Contact({
      users: [],
      created: new Date(),
      confirmed: false
    });
    contact2 = new Contact({
      users: [],
      created: yesterday,
      confirmed: true
    });
    contact3 = new Contact({
      users: [],
      created: daybefore,
      confirmed: true
    });

    // Save user to the test db
    user1.save(function(err, user1SaveRes) {
      user1Id = user1SaveRes._id;
      user2.save(function(err, user2SaveRes) {
        user2Id = user2SaveRes._id;
        user3.save(function(err, user3SaveRes) {
          user3Id = user3SaveRes._id;
          contact1.users = [user1Id, user2Id]; // Connection A: Users 1+2, un-confirmed
          contact2.users = [user2Id, user3Id]; // Connection B: Users 2+3, confirmed
          contact3.users = [user1Id, user3Id]; // Connection C: Users 1+3, confirmed
          contact1.save(function(err, contact1SaveRes) {
            contact1Id = contact1SaveRes._id;
            contact2.save(function(err, contact2SaveRes) {
              contact2Id = contact2SaveRes._id;
              contact3.save(function(err, contact3SaveRes) {
                contact3Id = contact3SaveRes._id;
                return done();
              });
            });
          });
        });
      });
    });
  });

  it('should not be able to read contact list if not logged in', function(done) {
    agent.get('/api/contacts/' + user2Id)
      .expect(403)
      .end(function(contactsReadErr, contactsReadRes) {

        contactsReadRes.body.message.should.equal('Forbidden.');

        // Call the assertion callback
        return done(contactsReadErr);
      });
  });

  it('should not be able to read contact list if not logged in', function(done) {
    agent.get('/api/contacts/' + user2Id)
      .expect(403)
      .end(function(contactSaveErr, contactSaveRes) {

        contactSaveRes.body.message.should.equal('Forbidden.');

        // Call the assertion callback
        return done(contactSaveErr);
      });
  });

  it('should be able to read contact list of other users when logged in', function(done) {
    agent.post('/api/auth/signin')
      .send(credentials) // = user 1
      .expect(200)
      .end(function(signinErr, signinRes) {
        // Handle signin error
        if (signinErr) done(signinErr);

          // Get contacts from the other user
          agent.get('/api/contacts/' + user3Id)
            .expect(200)
            .end(function(contactsGetErr, contactsGetRes) {
              // Handle contact get error
              if (contactsGetErr) done(contactsGetErr);

              // Set assertions
              contactsGetRes.body.length.should.equal(2);

              // Connection B: Users 2+3, confirmed
              contactsGetRes.body[0].confirmed.should.equal(true);
              contactsGetRes.body[0].created.should.not.be.empty();
              contactsGetRes.body[0].users[0].username.should.equal(user2.username);
              contactsGetRes.body[0].users[1].username.should.equal(user3.username);

              // Connection C: Users 1+3, confirmed
              contactsGetRes.body[1].confirmed.should.equal(true);
              contactsGetRes.body[1].created.should.not.be.empty();
              contactsGetRes.body[1].users[0].username.should.equal(user1.username);
              contactsGetRes.body[1].users[1].username.should.equal(user3.username);

              // Call the assertion callback
              return done();
            });
      });
  });

  it('should be able to read own contact list when logged in and see unconfirmed contacts', function(done) {
    agent.post('/api/auth/signin')
      .send(credentials) // = user 1
      .expect(200)
      .end(function(signinErr, signinRes) {
        // Handle signin error
        if (signinErr) done(signinErr);

          // Get contacts from the other user
          agent.get('/api/contacts/' + user1Id)
            .expect(200)
            .end(function(contactsGetErr, contactsGetRes) {
              // Handle contact get error
              if (contactsGetErr) done(contactsGetErr);

              // Set assertions
              contactsGetRes.body.length.should.equal(2);

              // Connection A: Users 1+2, un-confirmed
              contactsGetRes.body[0].confirmed.should.equal(false);
              contactsGetRes.body[0].created.should.not.be.empty();
              contactsGetRes.body[0].users[0].username.should.equal(user1.username);
              contactsGetRes.body[0].users[1].username.should.equal(user2.username);

              // Connection C: Users 1+3, confirmed
              contactsGetRes.body[1].confirmed.should.equal(true);
              contactsGetRes.body[1].created.should.not.be.empty();
              contactsGetRes.body[1].users[0].username.should.equal(user1.username);
              contactsGetRes.body[1].users[1].username.should.equal(user3.username);

              // Call the assertion callback
              return done();
            });
      });
  });

/*
  it('should not be able to delete contact if not logged in', function(done) {
    console.log('del: '+contact1Id);
    agent.delete('/api/contact/' + contact1Id)
      //.expect(403)
      .end(function(contactDelErr, contactDelRes) {

        console.log(contactDelErr);
        console.log(contactDelRes);

        //ContactDelRes.body.message.should.equal('Forbidden.');

        // Call the assertion callback
        return done(contactDelErr);
      });
  });
*/

  afterEach(function(done) {
    // Uggggly pyramid revenge!
    User.remove().exec(function() {
      Contact.remove().exec(done);
    });
  });
});
