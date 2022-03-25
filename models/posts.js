const mongooes = require("mongoose");

const postSchema = new mongooes.Schema(
  {
    user: {
      type: mongooes.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    description: { type: String, max: 500 },
    image: { type: String },
    likes: { type: Number, default: 0 },
    comments: { type: Array, default: [] },
  },
  { timestamps: true }
);

const Post = mongooes.model("Post", postSchema);

module.exports = Post;
