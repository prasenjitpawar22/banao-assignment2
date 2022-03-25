var app = require("./app.js");
var PORT = process.env.PORT;
var port = process.env.PORT || PORT;
app.listen(port, function () {
  console.log("".concat(port));
});
