const express = require("express");
const router = express.Router();
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const config = require("config");
const { check, validationResult } = require("express-validator");

const User = require("../models/User");

// @route   POST api/users
// @desc    Register a user
// @access  Public
router.post(
  "/",
  [
    check("name", "Please add name").not().isEmpty(), //to make sure: not empty
    check("email", "Please include a valid email").isEmail(),
    check(
      "password",
      "Please enter a password with 6 or more characters"
    ).isLength({ min: 6 }),
  ],
  async (req, res) => {
    // res.send(req.body); //tester
    // Finds the validation errors in this request and wraps them in an object with handy functions
    const errors = validationResult(req);
    //if errors are empty
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    // res.send("passed"); //tester
    const { name, email, password } = req.body;

    //async/await dealing with database + bcrypt
    try {
      //check user with the email in database already
      let user = await User.findOne({ email }); //email:email => email (es6)

      if (user) {
        return res.status(400).json({ msg: "User already exists" });
      }

      //Take User model to create a new user if not existed in database
      user = new User({
        name,
        email,
        password,
      });

      //before saving the password to the database, need to encrypt password
      const salt = await bcrypt.genSalt(10);

      user.password = await bcrypt.hash(password, salt);
      //result: hash version of the password

      //save to the database
      await user.save();

      // res.send("User saved"); //tester
      //create payload to send object in the token later
      const payload = {
        user: {
          id: user.id, //get specific data from user id; for example access all the contacts
        },
      };

      //to generate a token, must sign it
      jwt.sign(
        payload,
        config.get("jwtSecret"),
        {
          expiresIn: 360000,
        },
        //callback
        (err, token) => {
          if (err) throw err; //check error, if yes, throw error
          res.json({ token }); //return token
        }
      );

      //if there's an error:
    } catch (err) {
      console.error(err.message);
      res.status(500).send("Server Error");
    }
  }
);

module.exports = router;

//Notes:
//default.json is a file that provides a global variable to access to the entire application
//req.body = data sent to route; Need middleware in server.js to use req.body
//docs: express-validator 5.3.1; purpose limit the scope what can be sent
//getSalt() returns a promise
//For jwt.sign, do not add jwtSecret directly into 2nd parameter, instead add in default.json (config package = access globlal variable )
//expiresIn: 3600 = one hour
//findOne() is a method used with mongoose
//try...catch statement is for error handling commonly associated w/ ajax and asynchronous code
//try statement tests a block a code for errors
//catch statement handles the errors
//The JWT secret is simply a string that will be used to generate the tokens for your application
