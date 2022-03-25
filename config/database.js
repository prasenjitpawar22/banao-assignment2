const mongooes = require("mongoose");

const { MONGO_URI } = process.env;

exports.connect = () => {
  const connectWithRetry = function () {
    mongooes
      .connect(MONGO_URI, {
        useNewUrlParser: true,
        // useFindAndModify: false,
        useUnifiedTopology: true,
      })
      .then(() => {
        console.log("Successfully connected to database");
      })
      .catch((error) => {
        console.log("database connection failed. exiting now...");
        console.error(error);
        setTimeout(connectWithRetry, 5000);
        // process.exit(1);
      });
  };
  connectWithRetry();
};
