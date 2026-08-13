const mongoose = require('mongoose');
const crypto = require('crypto');
const jwt = require('jsonwebtoken');

// The four datapoints the guide calls for. The password itself is never
// stored; only the salt and the derived hash are persisted.
const userSchema = new mongoose.Schema({
    email: {
        type: String,
        unique: true,
        required: true
    },
    name: {
        type: String,
        required: true
    },
    hash: String,
    salt: String
});

// Generate a fresh 16-byte salt and derive the hash from it. A new salt on
// every call means two users with the same password still get different
// hashes, so a stolen database cannot be attacked with a single rainbow table.
userSchema.methods.setPassword = function (password) {
    this.salt = crypto.randomBytes(16).toString('hex');
    this.hash = crypto.pbkdf2Sync(password, this.salt, 1000, 64, 'sha512')
        .toString('hex');
};

// Compare a submitted password against the stored hash.
//
// DEVIATION FROM GUIDE (page 188): the guide compares with
// "return this.hash === hash". String equality short-circuits on the first
// differing character, so how long the comparison takes leaks how many leading
// characters were correct. crypto.timingSafeEqual always compares the full
// buffer. The practical leak here is small because pbkdf2 dominates the
// timing, but a hash comparison is exactly where the correct primitive is cheap.
//
// Also fails closed when a record has no salt or hash, rather than letting
// pbkdf2Sync throw on an undefined salt.
userSchema.methods.validPassword = function (password) {
    if (!this.salt || !this.hash) {
        return false;
    }

    const candidate = crypto.pbkdf2Sync(password, this.salt, 1000, 64, 'sha512')
        .toString('hex');

    const storedBuffer = Buffer.from(this.hash, 'hex');
    const candidateBuffer = Buffer.from(candidate, 'hex');

    // timingSafeEqual throws on length mismatch, so guard it first.
    if (storedBuffer.length !== candidateBuffer.length) {
        return false;
    }

    return crypto.timingSafeEqual(storedBuffer, candidateBuffer);
};

// Build a signed JWT for this user. The payload deliberately carries only
// identifying fields. Anyone can base64-decode a JWT payload, so the hash and
// salt must never appear here.
userSchema.methods.generateJWT = function () {
    return jwt.sign(
        {
            _id: this._id,
            email: this.email,
            name: this.name
        },
        process.env.JWT_SECRET,  // SECRET stored in .env file
        { expiresIn: '1h' }      // Token expires an hour from creation
    );
};

const User = mongoose.model('users', userSchema);
module.exports = User;