const express = require('express'); // Express app
const router = express.Router();    // Router logic
const jwt = require('jsonwebtoken'); // Enable JSON Web Tokens

// This is where we import the controllers we will route
const tripsController = require('../controllers/trips');
const authController = require('../controllers/authentication');

// Method to authenticate our JWT.
//
// Pulls the Authorization header off the request, parses the bearer token,
// and verifies it. On success the decoded payload is attached to req.auth and
// the request continues. On any failure the request is rejected with a 401 and
// never reaches the controller.
//
// DEVIATIONS FROM GUIDE (pages 197-198), all three are defect fixes:
//
// 1. Control flow. The guide passes a callback to jwt.verify and then calls
//    next() on the line after it. A "return" inside that callback returns from
//    the callback, not from authenticateJWT, so next() runs regardless of
//    whether verification succeeded. The only thing stopping a bad token from
//    reaching the controller is that the guide's error line,
//    res.sendStatus(401).json(...), throws because sendStatus has already sent
//    the response. Delete that stray .json() as an obvious tidy-up and the
//    middleware silently stops rejecting invalid tokens.
//
//    This version uses the synchronous form of jwt.verify inside a try/catch,
//    so next() is only reachable when verification actually succeeded.
//
// 2. The guide's header check is "if (headers.length < 1)". Splitting a
//    non-empty string always yields at least one element, so that branch can
//    never run. A header of "Bearer" with no token would fall through to
//    token === undefined. Corrected to < 2.
//
// 3. That same branch returned 501 (Not Implemented), which describes a server
//    that lacks the feature, not a malformed client request. Returns 401.
function authenticateJWT(req, res, next) {
    const authHeader = req.headers['authorization'];

    if (authHeader == null) {
        console.log('Auth Header Required but NOT PRESENT!');
        return res.sendStatus(401);
    }

    const headers = authHeader.split(' ');
    if (headers.length < 2) {
        console.log('Malformed Auth Header, expected "Bearer <token>": ' + authHeader);
        return res.sendStatus(401);
    }

    const token = headers[1];
    if (token == null || token === '') {
        console.log('Null Bearer Token');
        return res.sendStatus(401);
    }

    try {
        // Synchronous form. Throws on a bad signature, malformed token, or
        // expiry, which the catch below turns into a 401.
        req.auth = jwt.verify(token, process.env.JWT_SECRET);
    } catch (err) {
        console.log('Token Validation Error: ' + err.name + ' - ' + err.message);
        return res
            .status(401)
            .json({ "message": "Token Validation Error: " + err.name });
    }

    next(); // Only reached when the token verified successfully
}

// define route for login endpoint
router
    .route('/login')
    .post(authController.login);

// define route for registration endpoint
router
    .route('/register')
    .post(authController.register);

// define route for our trips endpoint
router
    .route('/trips')
    .get(tripsController.tripsList)                          // GET Method routes tripList
    .post(authenticateJWT, tripsController.tripsAddTrip);    // POST Method Adds a Trip

// GET Method routes tripsFindByCode - requires parameter
// PUT Method routes tripsUpdateTrip - requires parameter
// DELETE Method routes tripsDeleteTrip - requires parameter
//
// DEVIATION FROM GUIDE: the guide protects only POST and PUT, because it never
// implemented DELETE (it existed solely as a string in the CORS Allow-Methods
// header). DELETE removes data from the database, so it is an administrative
// endpoint by the same reasoning that protects the other two.
router
    .route('/trips/:tripCode')
    .get(tripsController.tripsFindByCode)
    .put(authenticateJWT, tripsController.tripsUpdateTrip)
    .delete(authenticateJWT, tripsController.tripsDeleteTrip);

module.exports = router;