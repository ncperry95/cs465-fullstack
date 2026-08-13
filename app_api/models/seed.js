// Bring in the DB connection and the schemas
const Mongoose = require('./db');
const Trip = require('./travlr');
const User = require('./user');

// Read seed data from json file
var fs = require('fs');
var trips = JSON.parse(fs.readFileSync('./data/trips.json', 'utf8'));

// Demo account documented in the README. Seeded here so that a fresh clone of
// the project has a working login without anyone having to hit /api/register
// in Postman first. setPassword generates the salt and the hash, so the plain
// text password below never reaches the database.
const demoUser = {
    name: 'SNHU Grader',
    email: 'snhu@email.com',
    password: '123456'
};

// delete any existing records, then insert seed data
const seedDB = async () => {
    // Wait for the schema indexes to finish building before continuing.
    // Without this, process.exit() below can terminate an in-progress
    // index build and leave the collection missing declared indexes.
    await Trip.init();
    await Trip.deleteMany({});
    await Trip.insertMany(trips);

    // User has a unique index on email, so it needs the same init() treatment
    // as Trip. Reseeding removes the old account first, which keeps this
    // script rerunnable without throwing a duplicate key error.
    await User.init();
    await User.deleteMany({ email: demoUser.email });

    const user = new User({
        name: demoUser.name,
        email: demoUser.email
    });
    user.setPassword(demoUser.password);
    await user.save();
};

// Close the MongoDB connection and exit
seedDB().then(async () => {
    await Mongoose.connection.close();
    process.exit(0);
});