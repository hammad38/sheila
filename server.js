// packages imports
const express = require('express');
const bodyParser = require('body-parser');
const passport = require('passport');
const mongoose = require('mongoose');

// variables imports
const users = require('./routes/api/users');
const dbURL = require('./config/keys').dbURL;

// choose db depending on NODE_ENV
mongoose
  .connect(dbURL)
  .then(res => console.log('db connected successfully!'))
  .catch(err => console.log('db connection error: ', err));

// initialize express app
const app = express();

// body parser middleware
app.use(bodyParser.urlencoded({extended: false}));
app.use(bodyParser.json());

// passport middleware
app.use(passport.initialize());

// passport config
require('./config/passport')(passport);

// creating routes
app.use('/', users);

const port = process.env.PORT || 3030;

// creating node server
app.listen(port, () => console.log(`Server running on port: ${port}`));