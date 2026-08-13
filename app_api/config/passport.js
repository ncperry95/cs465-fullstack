const passport = require('passport');
const LocalStrategy = require('passport-local').Strategy;
const User = require('../models/user');

// DEVIATION FROM GUIDE (page 190): the guide requires mongoose here and then
// does mongoose.model("users") to fetch the model a second time. Since
// models/user.js now exports the model directly, both lines are redundant.
//
// DEVIATION FROM GUIDE: the verify callback is wrapped in try/catch.
// passport-local 1.0.0 does not catch rejections from an async verify
// function, so a dropped Mongo connection during login would surface as an
// unhandled rejection and terminate the process under Node 22.

passport.use(
    new LocalStrategy(
        {
            usernameField: 'email'
        },
        async (username, password, done) => {
            try {
                const q = await User.findOne({ email: username }).exec();

                if (!q) {
                    return done(null, false, {
                        message: 'Incorrect username.'
                    });
                }

                if (!q.validPassword(password)) {
                    return done(null, false, {
                        message: 'Incorrect password.'
                    });
                }

                return done(null, q);
            } catch (err) {
                return done(err);
            }
        }
    )
);