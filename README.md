# Travlr Getaways
## Module 7: Security

This branch adds authentication to both halves of the application. Users
register and log in against the Express API, which returns a JSON Web Token.
The Angular admin site stores that token and presents it on any request that
changes data.

### Running it

The `.env` file is listed in `.gitignore`, so it is not in the repository. A
fresh clone needs one created in the project root before the API will start
handling logins:

```
JWT_SECRET=S0uth3rnN3wH@mpsh1r3Un1v3rs1tyC0mput3rSc13nc3
```

Without it `jwt.sign` throws "secretOrPrivateKey must have a value" on the
first login attempt. The submitted `travlr.zip` does include `.env` so the
project runs as delivered.

### Demo account

```
email:    snhu@email.com
password: 123456
```

This is a course grading credential and is not meant to reflect a password
policy anyone should ship. The storage side is handled properly regardless:
passwords are never stored, only a 16 byte random salt and a PBKDF2-SHA512
hash at 1000 iterations, with a fresh salt generated per user.

### Endpoints

| Method | Route | Auth |
|---|---|---|
| POST | `/api/register` | open |
| POST | `/api/login` | open |
| GET | `/api/trips` | open |
| GET | `/api/trips/:tripCode` | open |
| POST | `/api/trips` | Bearer token |
| PUT | `/api/trips/:tripCode` | Bearer token |
| DELETE | `/api/trips/:tripCode` | Bearer token |

### Dependencies

`npm audit` reports 13 findings. These are the accepted state for course
dependency compatibility. Running `npm audit fix` upgrades pinned packages and
breaks the build, so it is deliberately not run.

The `crypto` package listed in the course guide is not installed. That npm
package is a deprecated stub and Node resolves its own built-in `crypto`
module first regardless, so installing it adds a dependency for no benefit.

### Deviations from the course guide

Most of these are defect fixes rather than preferences.

**`authenticateJWT` control flow.** The guide passes a callback to `jwt.verify`
and calls `next()` on the following line. A `return` inside that callback
returns from the callback, not from the middleware, so `next()` runs whether or
not verification succeeded. The only thing stopping a bad token from reaching
the controller is that the guide's error line, `res.sendStatus(401).json(...)`,
throws because `sendStatus` has already sent the response. Removing that stray
`.json()` as an obvious tidy-up would silently turn off authentication. This
version uses the synchronous form of `jwt.verify` inside a try/catch so `next()`
is only reachable on success.

**Registration crash.** The guide's `register` controller awaits `user.save()`
with no try/catch. Because `email` is a unique index, registering a duplicate
throws E11000, and Express 4 does not catch rejected promises from async
handlers, so under Node 22 the process terminates. Registering the same address
twice is a two click reproduction. The controller now returns 409.

**Undefined variable.** The guide's "database returned no data" branch calls
`.json(err)` where `err` was never declared.

**Response shape.** The guide's `register` returns a bare token string while
`login` returns `{token}`. The Angular service reads `.token` from both, so
register would have stored `undefined`. Both now return `{token}`.

**Header parsing.** The guide checks `if (headers.length < 1)` after splitting
the Authorization header. Splitting a non-empty string always yields at least
one element, so that branch is unreachable and a header of `Bearer` with no
token falls through. It also returned 501, which describes a missing server
feature rather than a bad client request. Corrected to `< 2` returning 401.

**Interceptor URL test.** The guide checks `request.url.startsWith('login')`,
but `request.url` is the absolute `http://localhost:3000/api/login`, so the
test is always false and the auth-endpoint exclusion never fires. Changed to
match the end of the path.

**DELETE is protected.** The guide secures only POST and PUT because it never
implemented DELETE, which existed solely as a string in the CORS
`Allow-Methods` header. DELETE removes data, so it is an administrative method
by the same reasoning that protects the other two.

**Password comparison.** The guide compares hashes with `===`. String equality
short-circuits on the first differing character, so comparison time leaks how
many leading characters matched. `crypto.timingSafeEqual` compares the full
buffer every time. The practical leak here is small because PBKDF2 dominates
the timing, but a hash comparison is exactly where the correct primitive costs
nothing.

**Login returns an Observable.** The guide's `login()` returns void and
subscribes internally, leaving the component unable to tell success from
failure, and works around it by checking, waiting three seconds on a
`setTimeout`, and checking again. A wrong password produces no feedback at all
under that design. Returning the Observable lets the component navigate when
the token actually arrives and show a real message when it does not.

**Bootstrap 5 attributes.** The guide's navbar uses `data-toggle` and
`data-target`, which are Bootstrap 4 names. This project loads Bootstrap 5.3.2,
where the collapse plugin reads `data-bs-toggle` and `data-bs-target`.

**`app.config.ts`.** The guide uses `importProvidersFrom(HttpClientModule)` and
notes it shows as deprecated. `provideHttpClient(withInterceptorsFromDi())`
does the same job with current API. Worth knowing: a bare `provideHttpClient()`
does not read `HTTP_INTERCEPTORS` from DI, so the interceptor would register
and silently never run, with no error and no warning.

### A note on the button visibility

Hiding Add, Edit, and Delete when logged out is presentation only. It stops an
honest user from clicking something that would fail. It stops nobody from
calling the API directly, which is easy to demonstrate in Postman. The
`authenticateJWT` middleware is the actual enforcement.