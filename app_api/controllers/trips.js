const mongoose = require('mongoose');
const Trip = require('../models/travlr'); // Register model
const Model = mongoose.model('trips');

// GET: /trips - lists all the trips
// Regardless of outcome, response must include HTML status code
// and JSON message to the requesting client
const tripsList = async(req, res) => {
    const q = await Model
        .find({}) // No filter, return all records
        .exec();

    // Uncomment the following line to show results of query
    // on the console
    // console.log(q);

    if (!q) { // Database returned no data
        return res
            .status(404)
            .json({ message: 'No trips found' });
    } else { // Return resulting trip list
        return res
            .status(200)
            .json(q);
    }
};

// GET: /trips/:tripCode - lists a single trip
// Regardless of outcome, response must include HTML status code
// and JSON message to the requesting client
const tripsFindByCode = async(req, res) => {
    const q = await Model
        .find({ 'code': req.params.tripCode }) // Return single record
        .exec();

    // Uncomment the following line to show results of query
    // on the console
    // console.log(q);

    if (!q || q.length === 0) { // Database returned no data
        return res
            .status(404)
            .json({ message: 'Trip not found: ' + req.params.tripCode });
    } else { // Return resulting trip
        return res
            .status(200)
            .json(q);
    }
};

// POST: /trips - Adds a new Trip
// Regardless of outcome, response must include HTML status code
// and JSON message to the requesting client
const tripsAddTrip = async(req, res) => {
    const newTrip = new Trip({
        code: req.body.code,
        name: req.body.name,
        length: req.body.length,
        start: req.body.start,
        resort: req.body.resort,
        perPerson: req.body.perPerson,
        image: req.body.image,
        description: req.body.description
    });

    // NOTE: deviation from the guide. Mongoose throws on a failed save
    // rather than returning a falsy value, so the guide's 'if (!q)'
    // branch is unreachable while a real validation error goes
    // unhandled and leaves the request without a response.
    try {
        const q = await newTrip.save();

        // Uncomment the following line to show results of operation
        // on the console
        // console.log(q);

        return res
            .status(201)
            .json(q);
    } catch (err) {
        return res
            .status(400)
            .json({ message: err.message });
    }
};

// PUT: /trips/:tripCode - Updates an existing Trip
// Regardless of outcome, response must include HTML status code
// and JSON message to the requesting client
const tripsUpdateTrip = async(req, res) => {

    // Uncomment these two lines to log the incoming request while
    // debugging the endpoint
    // console.log(req.params);
    // console.log(req.body);

    // NOTE: deviations from the guide, see the Phase 6A script header.
    //   { returnDocument }   returns the UPDATED document, not the old one
    //   { runValidators }    applies the schema rules PUT would skip by default
    //   200 not 201          an update is not a creation
    //   404 not 400          a code that does not exist is Not Found
    try {
        const q = await Model
            .findOneAndUpdate(
                { 'code' : req.params.tripCode },
                {
                    code: req.body.code,
                    name: req.body.name,
                    length: req.body.length,
                    start: req.body.start,
                    resort: req.body.resort,
                    perPerson: req.body.perPerson,
                    image: req.body.image,
                    description: req.body.description
                },
                { returnDocument: 'after', runValidators: true }
            )
            .exec();

        if (!q) { // No trip matched that code
            return res
                .status(404)
                .json({ message: 'Trip not found: ' + req.params.tripCode });
        }

        // Uncomment the following line to show results of operation
        // on the console
        // console.log(q);

        return res
            .status(200)
            .json(q);
    } catch (err) {
        return res
            .status(400)
            .json({ message: err.message });
    }
};

// DELETE: /trips/:tripCode - Removes an existing Trip
// Regardless of outcome, response must include HTML status code
// and JSON message to the requesting client
//
// NOTE: this method has NO equivalent in the CS 465 Full Stack Guide.
// The rubric requires DELETE but the guide only ever mentions the verb
// inside a CORS header string. Written to match the patterns already
// used by tripsFindByCode, tripsAddTrip and tripsUpdateTrip.
//
// findOneAndDelete is used because Mongoose 8 removed remove(). It
// returns the deleted document, which lets a real deletion be told
// apart from a code that never existed.
const tripsDeleteTrip = async(req, res) => {
    try {
        const q = await Model
            .findOneAndDelete({ 'code' : req.params.tripCode })
            .exec();

        if (!q) { // No trip matched that code
            return res
                .status(404)
                .json({ message: 'Trip not found: ' + req.params.tripCode });
        }

        // Uncomment the following line to show results of operation
        // on the console
        // console.log(q);

        return res
            .status(200)
            .json(q);
    } catch (err) {
        return res
            .status(400)
            .json({ message: err.message });
    }
};

module.exports = {
    tripsList,
    tripsFindByCode,
    tripsAddTrip,
    tripsUpdateTrip,
    tripsDeleteTrip
};