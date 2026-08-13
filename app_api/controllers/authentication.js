const passport = require('passport');
const User = require('../models/user');

// Register a new user and return a JWT so the caller is logged in immediately.
//
// DEVIATIONS FROM GUIDE (page 190), all three are defect fixes:
//
// 1. try/catch around user.save(). Express 4.16.4 does not catch rejected
//    promises from async handlers, and Node 22 throws on unhandled rejections.
//    Since email is unique, registering a duplicate would otherwise terminate
//    the server process. 11000 is Mongo's duplicate-key code.
//
// 2. The guide's "no data returned" branch does .json(err), but err is never
//    declared in that scope. Referencing it throws a ReferenceError. Replaced
//    with an actual message.
//
// 3. The guide returns .json(token) here but .json({token}) from login. The
//    Angular AuthenticationService reads response.token for both, so a bare
//    string would store undefined. Both endpoints now return { token }.
const register = async (req, res) => {
    // Validate message to insure that all parameters are present
    if (!req.body.name || !req.body.email || !req.body.password) {
        return res
            .status(400)
            .json({ "message": "All fields required" });
    }

    const user = new User({
        name: req.body.name,
        email: req.body.email
    });

    user.setPassword(req.body.password);  // Sets salt and hash

    try {
        const q = await user.save();

        if (!q) {
            // Database returned no data
            return res
                .status(400)
                .json({ "message": "User could not be saved" });
        }

        const token = q.generateJWT();
        return res
            .status(200)
            .json({ token });
    } catch (err) {
        if (err && err.code === 11000) {
            return res
                .status(409)
                .json({ "message": "A user with that email address already exists" });
        }

        return res
            .status(500)
            .json({ "message": "Registration failed", "error": err.message });
    }
};

// Authenticate an existing user. Verbatim from the guide, page 193. The
// delegation to passport and the three-way branch on the result are sound.
const login = (req, res) => {
    // Validate message to ensure that email and password are present.
    if (!req.body.email || !req.body.password) {
        return res
            .status(400)
            .json({ "message": "All fields required" });
    }

    // Delegate authentication to passport module
    passport.authenticate('local', (err, user, info) => {
        if (err) {
            // Error in Authentication Process
            return res
                .status(404)
                .json(err);
        }

        if (user) { // Auth succeeded - generate JWT and return to caller
            const token = user.generateJWT();
            res
                .status(200)
                .json({ token });
        } else { // Auth failed return error
            res
                .status(401)
                .json(info);
        }
    })(req, res);
};

// Export methods that drive endpoints.
module.exports = {
    register,
    login
};