// packages imports
const GitlabStrategy = require('passport-gitlab2').Strategy;
const passportJWT = require("passport-jwt");
const ExtractJwt = passportJWT.ExtractJwt;
const JwtStrategy = passportJWT.Strategy;
const mongoose = require('mongoose');

// variables imports
const keys = require('./keys');
const jwtKey = require('../config/keys').secretOrKey;
const User = require('../models/User');

const opts = {};
opts.jwtFromRequest = ExtractJwt.fromAuthHeaderAsBearerToken();
opts.secretOrKey = jwtKey;


module.exports = function(passport) {
  passport.use(new GitlabStrategy({
      clientID: keys.clientID,
      clientSecret: keys.clientSecret,
      callbackURL: keys.callbackURL,
      baseURL: keys.baseURL
    },
    function(accessToken, refreshToken, profile, cb) {
      const {is_admin, id} = profile._json;
      const payload = {
        gitlab_id: id,
        is_admin: is_admin,
        access_token: accessToken
      }
      User.findOne({gitlab_id: payload.gitlab_id})
        .then((user) => {
          if(user) {
            User.findOneAndUpdate({gitlab_id: payload.gitlab_id}, {$set: payload}, {new: true})
              .then(user => {
                return cb(null, user);
              })
          } else {
            const newUser = new User(payload);
            newUser.save()
              .then(user => {
                return cb(null, payload);
              });
          }
        })
        .catch(err => {
          console.log('unknown error!!!', err);
        });
    }
  ));

  passport.use(
    new JwtStrategy(opts, (jwt_payload, done) => {
      User.findOne({gitlab_id: jwt_payload.gitlab_id})
        .then(user => {
          if(user) {
            return done(null, user);
          }
          return done(null, false);
        })
        .catch(err => console.log('unknown error!'));
    })
  );
}