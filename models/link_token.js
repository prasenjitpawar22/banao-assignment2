const mongooes = require("mongoose");

const tokenSchema = new mongooes.Schema({
  user: {
    type: mongooes.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  token: { type: String, required: true },
});

const linkToken = mongooes.model("linkToken", tokenSchema);

module.exports = linkToken;
