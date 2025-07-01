const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const userRoutes = require("./routes/users");

const app = express();
const PORT = 3000;

mongoose.connect("mongodb://localhost:27017/jwtAuthDemo", {
  useNewUrlParser: true,
  useUnifiedTopology: true
}).then(() => console.log("Connected to MongoDB"))
  .catch(err => console.error("MongoDB error:", err));

app.use(bodyParser.json());
app.use("/api/users", userRoutes);

app.get("/", (req, res) => {
  res.send("Welcome to the User API!");
});

app.listen(PORT, () => {
  console.log(`🚀 Server running at http://localhost:${PORT}`);
});
