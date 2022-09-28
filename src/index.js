const express = require("express");
const bodyParser = require("body-parser");
const route = require("./routes/route.js");
const mongoose = require("mongoose");
const multer = require("multer")
const app = express();

app.use(bodyParser.json());
app.use(multer().any());
app.use(bodyParser.urlencoded({ extended: true }));

mongoose.connect("mongodb+srv://Rajnigandha-2402:LG1AyAT8nJB77pPC@cluster0.t7g9trm.mongodb.net/Project-3",{
      useNewUrlParser: true, 
    })

  .then(() => console.log("MongoDb is connected"))
  .catch((err) => console.log(err));


app.use("/", route);

app.listen(process.env.PORT || 3000, function () {
  console.log("Express app running on port " + (process.env.PORT || 3000));
});
