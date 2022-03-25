const mongooes = require("mongoose");

const userSchema = new mongooes.Schema({
  username: { type: String, unique: true, required: true },
  email: { type: String, unique: true, required: true },
  password: { type: String, required: true },
  token: { type: String },
});

// userSchema.static.getUser = function (username) {
//   return this.find({ username: username });
// };

const User = mongooes.model("User", userSchema);

module.exports = User;
