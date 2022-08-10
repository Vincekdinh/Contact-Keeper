const jwt = require("jsonwebtoken");
const config = require("config"); //access to the secret

//This is a middleware function
//next() means move on the next middleware
module.exports = function (req, res, next) {
  // Check to see token in the header - if so, get token from header; 
  //"x-auth-token" is the key to the token inside the header
  const token = req.header("x-auth-token");

  //Check if not token...
  //401 = unauthorized 
  if (!token) {
    return res.status(401).json({ msg: "No token, authorization denied" });
  }
  //If there's a token...
  try {
    //verification
    //decoded = entire token payload
    //once verified, payload gets put into decoded
    const decoded = jwt.verify(token, config.get("jwtSecret"));
    //access to user inside the route
    req.user = decoded.user;
    next();
  } catch (err) {
    //if doesn't verified...
    res.status(401).json({ msg: "Token is not valid" });
  }
};

//Note:
//Purpose: We need a middleware to validate the token and extract the user id then add to req object
//Summary: This function is only pertains to the routes we want to protect
