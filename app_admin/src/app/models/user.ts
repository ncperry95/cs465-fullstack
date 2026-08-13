// Client-side representation of a user. Deliberately narrower than the
// Mongoose schema: the browser has no business holding the password hash or
// the salt, and the JWT payload does not carry them either.
export class User {
    email: string;
    name: string;

    constructor() {
        this.email = '';
        this.name = '';
    }
}