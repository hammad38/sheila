const mongoose = require('mongoose');
const Schema = mongoose.Schema;

// create schema
const UserSchema = new Schema({
  gitlab_id: {
    type: String,
    required: true,
    unique: true
  },
  is_admin: {
    type: Boolean,
    required: true,
    default: false
  },
  access_token: {
    type: String,
    required: true
  },
  date: {
    type: Date,
    default: Date.now
  }
});

module.exports = User = mongoose.model('users', UserSchema);
