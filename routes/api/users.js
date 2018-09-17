// packages imports
const express = require('express');
const router = express.Router();
const passport = require('passport');
const request = require('request');

var getProjectsData = require('./requestData');

let User;

// @route   GET /users
// @desc    oauth gitlab
// @access  public
router.get('/', passport.authenticate('gitlab', {
  scope: ['api']
}));

// @route   GET auth/gitlab/callback
// @desc    oauth gitlab response callback
// @access  private
router.get('/auth/gitlab/callback',
  passport.authenticate('gitlab', {
    failureRedirect: '/',
    session: false
  }),
  function(req, res) {
    User = req.user;
    res.redirect('/welcome');
  });

// @route   GET /welcome
// @desc    on successful login
// @access  private
router.get('/welcome', (req, res) => {
  console.log('User: ', User);
  getProjectsData(0,User, function(gitlabResponseData, usersListResponseData){
    res.json(gitlabResponseData);
  });
});

// @route   GET /users
// @desc    all users list
// @access  private
router.get('/users', (req, res) => {
  console.log(User.is_admin);
  if(User.is_admin) {
    const usersListURL = 'https://gitlab.lucid.berlin/api/v4/users?access_token='+(User.accessToken);
    request(usersListURL, function (err, response, body) {
      if(err) {
        res.status(400).json({err:'unknown error!'});
      }
      if(response && response.statusCode === 200) {
        res.status(200).json(JSON.parse(body.toString()));
      }
    });
  } else {
    res.status(400).json({'response':'you can\'t access all users data'});
  }
});

module.exports = router;