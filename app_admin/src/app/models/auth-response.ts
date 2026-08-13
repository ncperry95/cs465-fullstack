// Shape of what the authentication endpoints return. Kept as its own class
// rather than passing a raw string around, so that swapping JWTs for some
// other credential later is a change to this file instead of a change
// everywhere a token is handled.
export class AuthResponse {
    token: string;

    constructor() {
        this.token = '';
    }
}