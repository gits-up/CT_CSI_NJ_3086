const express = require("express");
const mongoose = require("mongoose");
const bodyParser = require("body-parser");
const userRoutes = require("./routes/userRoutes");

const app = express();
const PORT = process.env.PORT || 3000;

app.use(bodyParser.json());

mongoose
  .connect("mongodb://localhost:27017/crudmongo", {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => {
    console.log("Connected to MongoDB");
  })
  .catch((err) => {
    console.error("MongoDB connection error:", err);
  });

app.use("/api/users", userRoutes);

app.get('/', (req, res) => {
  res.send('Welcome to the MongoDB CRUD API!');
});


app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
