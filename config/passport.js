// packages imports
const GitlabStrategy = require('passport-gitlab2').Strategy;
const keys = require('./keys');

module.exports = function(passport) {
  passport.use(new GitlabStrategy({
      clientID: keys.clientID,
      clientSecret: keys.clientSecret,
      callbackURL: keys.callbackURL,
      baseURL: keys.baseURL
    },
    function(accessToken, refreshToken, profile, cb) {
      const {is_admin, id} = profile._json;
      const token = {
        id,
        accessToken,
        is_admin
      }
      return cb(null, token);
    }
  ));
}