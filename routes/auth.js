const express = require("express");
const router = express.Router();
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const config = require("config");
const auth = require("../middleware/auth");
const { check, validationResult } = require("express-validator");

const User = require("../models/User");

// @route   GET api/auth
// @desc    Get logged in user
// @access  Private
router.get("/", auth, async (req, res) => {
  // res.send("Get logged in user");
  try {
    const user = await User.findById(req.user.id).select("-password"); //-password = do not return password even though it's encrypted
    res.json(user);
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Server error");
  }
});

// @route   POST api/auth
// @desc    Auth user & get token
// @access  Public
router.post(
  "/",
  [
    check("email", "Please include a valid email").isEmail(),
    check("password", "Password is required").exists(),
  ],
  async (req, res) => {
    // res.send("Log in user");
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    const { email, password } = req.body;

    try {
      //find user exists
      let user = await User.findOne({ email });

      //if user does not exist
      if (!user) {
        return res.status(400).json({ msg: "Invalid Credentials" });
      }

      //if user does exist, check the password
      const isMatch = await bcrypt.compare(password, user.password);

      //if password does not match
      if (!isMatch) {
        return res.status(400).json({ msg: "Invalid Credentials " });
      }

      const payload = {
        user: {
          id: user.id, //get specific data from user id
        },
      };

      //pass payload into jwt.sign
      jwt.sign(
        payload,
        config.get("jwtSecret"),
        {
          expiresIn: 360000,
        },
        (err, token) => {
          if (err) throw err;
          res.json({ token });
        }
      );
    } catch (err) {
      console.error(err.message);
      res.status(500).send("Server Error");
    }
  }
);

module.exports = router;

//Notes:
//user.password = hash password
//add auth as a second parameter
