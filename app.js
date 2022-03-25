require("dotenv").config();
require("./config/database").connect(); // connect mongoBD
const auth = require("./middleware/auth");

const log = console.log;
const bcrypt = require("bcrypt"); // password hash
const crypto = require("crypto"); // crypto hash
const jwt = require("jsonwebtoken");
const bodyParser = require("body-parser");
const express = require("express");

const app = express();
app.use(bodyParser.json());

// all models
const User = require("./models/user");
const Token = require("./models/link_token");
const Post = require("./models/posts");

// all logic

//  register a user
app.post("/api/register", async (req, res) => {
  const { username, email, password } = req.body;

  try {
    //  if email exist
    const userRes = await User.findOne({ email: email });
    if (userRes !== null) {
      res.send("user already exist");
    } else {
      //  check username is taken
      const userRes = await User.find({ username });
      if (userRes.length !== 0) {
        res.send("username already taken");
      } else {
        //  finally create user
        //  hash password
        encryptedPassword = await bcrypt.hash(password, 10);

        const userRes = await User.create({
          username,
          email,
          password: encryptedPassword,
        });
        // jwt add here
        const token = jwt.sign(
          { user_id: userRes._id, username },
          process.env.JWT_TOKEN_KEY,
          {
            expiresIn: "2h",
          }
        );
        //  save user token and send to client
        userRes.token = token;
        await userRes.save();
        res.send({
          token: userRes.token,
          message: "user successfully registered",
        });
      }
    }
  } catch (e) {
    return res.send("An error occured");
  }
});

//  login a user
app.post("/api/login", async (req, res) => {
  const { username, password } = req.body;

  try {
    // check for input fields
    //  log(username, password);
    if (!username && !password) {
      return res.send("all fields are required");
    } else {
      // check user exist
      const userRes = await User.findOne({ username });
      if (userRes === null) {
        return res.send("user not found"); // not found
      } else {
        //  compare password
        const same = await bcrypt.compare(password, userRes.password);
        if (!same) {
          return res.send("password does not match");
        } else {
          //  create and send token
          const token = jwt.sign(
            { user_id: userRes._id, username },
            process.env.JWT_TOKEN_KEY,
            {
              expiresIn: "2h",
            }
          );
          //  save user token and send to client
          userRes.token = token;
          await userRes.save();
          // login user
          res.send({ token: userRes.token, message: "login successfully" });
        }
      }
    }
  } catch (error) {
    return res.send("An error occured");
  }
});

// forgot password link generate
app.post("/api/forgot-password", async (req, res) => {
  const { email } = req.body;

  try {
    // check for email field
    if (!email) {
      return res.send("email field required");
    } else {
      const userRes = await User.findOne({ email });
      //  if user not found
      if (userRes === null) {
        return res.send("user not found");
      } else {
        //  create token for password update link
        const tokenRes = await Token.findOne({ user: userRes });
        let link;
        if (tokenRes === null) {
          const tokenRes = await Token.create({
            user: userRes,
            token: crypto.randomBytes(32).toString("hex"),
          });
          link = `${process.env.BASE_URL}/link/${userRes._id}/${tokenRes.token}`;
          return res.send(link);
        } // if token already exist send link
        else {
          link = `${process.env.BASE_URL}/link/${userRes._id}/${tokenRes.token}`;
          return res.send(link);
        }
      }
    }
  } catch (e) {
    return res.send("An error occured");
  }
});

// forgot password access the link and change password
app.post("/link/:userId/:token", async (req, res) => {
  const { userId, token } = req.params;
  //  log(userId, token);
  try {
    const userRes = await User.findOne({ _id: userId });
    const tokenRes = await Token.findOne({ token });

    if (userRes === null || tokenRes === null) {
      return res.send("invalid link or expired");
    } else {
      // set the new hashed password
      password = await bcrypt.hash(req.body.password, 10);
      userRes.password = password;

      await userRes.save();
      await tokenRes.delete();
      res.send("password reset sucessfully.");
    }
  } catch (error) {
    return res.send("An error occured");
  }
});

// create a social post
app.post("/api/create-post", auth, async (req, res) => {
  const { description, image } = req.body;
  //  log("this is data", req.user);
  try {
    const userRes = await User.findOne({ username: req.user.username });
    const postRes = await Post.create({ user: userRes, description, image });

    res.send({ message: "post create successfully" });
  } catch (e) {
    log(e);
    res.send("An error occured");
  }
});

// get all posts (feeds)
app.get("/api/all-post", async (req, res) => {
  try {
    const postRes = await Post.find();
    return res.send({ postRes });
  } catch (e) {
    //  log(e);
    return res.send("An error occured");
  }
});

// update a post
app.post("/api/post-update/:id", auth, async (req, res) => {
  //  log(req.user);
  try {
    // get the post by id
    const postRes = await Post.findById(req.params.id);
    // if no post found return error
    if (!postRes) {
      return res.send("no post found");
    } else {
      // get the user by header auth
      const userRes = await User.findById(req.user.user_id);

      // check if user id matches the post user id
      if (userRes._id.equals(postRes.user)) {
        // if matches update post
        postRes.description = req.body?.description;
        postRes.image = req.body?.image;
        await postRes.save();
        return res.send({ postRes, message: "post updated successfully" });
      } else {
        return res.send({ message: "you can only update your post" });
      }
    }
  } catch (error) {
    //  log(error);
    //  return res.send({ error });
    return res.send("An error occured");
  }
});

// delete post
app.post("/api/post-delete/:id", auth, async (req, res) => {
  // log(req.user);
  try {
    // get the post by id
    const postRes = await Post.findById(req.params.id);
    // if no post found return error
    if (!postRes) {
      return res.send("no post found");
    } else {
      // get the user by header auth
      const userRes = await User.findById(req.user.user_id);

      // check if user id matches the post user id (Valid user or not)
      if (userRes._id.equals(postRes.user)) {
        // if matches post delete
        await postRes.delete();
        return res.send({ postRes, message: "post deleted successfully" });
      } else {
        return res.send({ message: "you can only update your post" });
      }
    }
  } catch (error) {
    //  log(error);
    //  return res.send({ error });
    return res.send("An error occured");
  }
});

//  post like and comment
app.post("/api/post-like/:id", async (req, res) => {
  try {
    // get the post details
    const postRes = await Post.findById(req.params.id);
    if (!postRes) {
      return res.send("no post found");
    } else {
      const like = parseInt(req.body.like);
      //  log(typeof parseInt(postRes.likes.toString()));
      // add a like to post
      postRes.likes = parseInt(postRes.likes.toString()) + like;
      await postRes.save();
      return res.send({ postRes });
    }
  } catch (err) {
    return res.send("An error occured");
  }
});
app.post("/api/post-comment/:id", async (req, res) => {
  try {
    // get the post details
    const postRes = await Post.findById(req.params.id);
    if (!postRes) {
      return res.send("no post found");
    } else {
      postRes.comments.push(req.body.comment);
      await postRes.save();
      return res.send({ postRes });
    }
  } catch (err) {
    return res.send("An error occured");
  }
});
module.exports = app;
