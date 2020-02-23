const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");

const app = express();
app.use(bodyParser.json());

mongoose.connect(process.env.MONGODB_URI || "mongodb://localhost/awesomeApp", {
  useNewUrlParser: true,
  useUnifiedTopology: true
});

const routes = require("./routes");
app.use(routes);

app.listen(process.env.PORT || 3000, function() {
  console.log("Server started");
});
