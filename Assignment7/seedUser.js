const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const User = require("./models/user");

mongoose.connect("mongodb://localhost:27017/jwtAuthDemo", {
  useNewUrlParser: true,
  useUnifiedTopology: true
}).then(async () => {
  const hashed = await bcrypt.hash("admin123", 10);
  const user = new User({ username: "admin", password: hashed });
  await user.save();
  console.log("User created!");
  mongoose.disconnect();
}).catch(err => {
  console.error("MongoDB Error:", err);
});
