// packages imports
const express = require('express');
const router = express.Router();
const passport = require('passport');
const request = require('request');
const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');

// variables imports
const jwtKey = require('../../config/keys').secretOrKey;
const getProjectsData = require('./requestData');
const User = require('../../models/User');

// @route   GET /
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
    const {gitlab_id, is_admin, access_token} = req.user;
    const payload = {
      gitlab_id,
      is_admin,
      access_token
    }

    jwt.sign(
      payload,
      jwtKey,
      { expiresIn: 3600 },
      (err, token) => {
        const tokenObj = {
          success: true,
          token: 'Bearer ' + token
        }
        return res.status(200).json(tokenObj);
      }
    );
 }
);

// @route   GET /welcome
// @desc    all projects list with lucid group
// @access  private
router.get('/welcome', passport.authenticate('jwt', {session: false}), (req, res) => {
  getProjectsData(0,req.user, function(gitlabResponseData, usersListResponseData){
    res.json(gitlabResponseData);
  });
});

// @route   GET /users
// @desc    all users list, for users with admin role
// @access  private
router.get('/users', passport.authenticate('jwt', {session: false}), (req, res) => {
  if(req.user.is_admin) {
    const usersListURL = 'https://gitlab.lucid.berlin/api/v4/users?access_token='+(req.user.access_token);
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