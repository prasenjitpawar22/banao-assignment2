const jwt = require("jsonwebtoken");
const log = console.log;
const config = process.env;

const verifyToken = (req, res, next) => {
  const authHeader =
    req.body.token || req.query.token || req.headers["authorization"];
  if (!authHeader) {
    console.log("err");
    return res
      .status(403)
      .send("A token is required for authentication, please login!");
  }
  try {
    const token = authHeader.split(" ")[1];
    const decoded = jwt.verify(token, config.JWT_TOKEN_KEY);
    req.user = decoded;
    log(decoded);
  } catch (err) {
    log(err);
    return res.status(201).send("Invalid Token");
  }
  return next();
};

module.exports = verifyToken;
