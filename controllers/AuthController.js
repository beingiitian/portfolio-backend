const User = require("../models/User");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
require("dotenv").config();

const login = async (req, res, next) => {
  const { email, password } = req.body;
  if (email !== process.env.USER_EMAIL || !password)
    res.status(401).send("Unauthorized Client");
  try {
    const user = await User.findOne({ email: email });
    if (!user) {
      if (password !== process.env.USER_PASSWORD)
        res.status(401).send("Unauthorized Client");
      const hashedPassword = await bcrypt.hash(password, 10);
      const newUser = new User({
        name: process.env.USER_NAME,
        email: email,
        password: hashedPassword,
        phone: process.env.USER_PHONE,
      });
      try {
        await newUser.save();
        const token = jwt.sign({ name: newUser.name }, process.env.SECRET, {
          expiresIn: "24h",
        });
        res.status(200).json({
          message: "logged in successfully!",
          token,
          user,
        });
      } catch (err) {
        res.status(500).send("Internal Server error!");
      }
    }
    const isPasswordMatch = await bcrypt.compare(password, user.password);
    console.log(isPasswordMatch);
    if (!isPasswordMatch) res.status(401).send("Unauthorized Client");
    const token = jwt.sign({ email: user.email }, process.env.SECRET, {
      expiresIn: "24h",
    });
    res.status(200).json({
      message: "logged in successfully!",
      token,
      user,
    });
  } catch (err) {
    res.status(500).send("Internal Server error!");
  }
};

const user = async (req, res, next) => {
  const token =
    (req.body && req.body.access_token) ||
    (req.query && req.query.access_token) ||
    req.headers["x-auth-token"];
  if (!token) res.status(401).send("Unauthorized Client");
  const decodedPayload = jwt.verify(token, process.env.SECRET);
  const { email } = decodedPayload;
  if (!email) res.status(401).send("Unauthorized Client");
  try {
    const user = await User.findOne({ email: email });
    if (!user) res.status(401).send("Unauthorized Client");
    res.status(200).send({ user });
  } catch (err) {
    res.status(500).send("Internal Server error!");
  }
};

module.exports = {
  login,
  user,
};
