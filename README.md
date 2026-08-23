# Travlr Getaways

A full stack travel booking application built across CS 465 at SNHU. A customer facing site rendered by Express and Handlebars, a REST API backed by MongoDB, and a separate Angular admin single page application behind JWT authentication.

**Stack:** Node 22.14.0, Express 4.16.4, Angular 17.3.12, MongoDB with Mongoose 9.9.1, Bootstrap 5.3.2, dotenv 17.4.2.

```
app.js                 Express entry point
app_server/            Customer site: controllers, routes, Handlebars views
app_api/               REST API: controllers, models, routes
app_admin/             Angular admin SPA
data/trips.json        Seed data
```

## Running it

`.env` is gitignored, so a fresh clone needs one created in the project root:

```
JWT_SECRET=<any sufficiently long random string>
```

Without it `jwt.sign` throws "secretOrPrivateKey must have a value" on the first login. The value does not belong in any tracked file.

Install dependencies from the root and again inside `app_admin`. Do not run `npm audit fix` in either, for the reason under Dependencies. Start MongoDB, seed with `app_api/models/seed.js`, then start Express on port 3000. Run `ng serve` in `app_admin` for the admin site on 4200. Seeded trips use codes GLR100, DAW200, and CLR300 with 2026 dates rather than the guide's examples.

## Demo account

```
email:    snhu@email.com
password: 123456
```

A course grading credential, not a password policy anyone should ship. The storage side is handled properly regardless: passwords are never stored, only a 16 byte random salt and a PBKDF2-SHA512 hash at 1000 iterations, with a fresh salt per user.

## Endpoints

| Method | Route | Auth |
|---|---|---|
| POST | `/api/register` | open |
| POST | `/api/login` | open |
| GET | `/api/trips` | open |
| GET | `/api/trips/:tripCode` | open |
| POST | `/api/trips` | Bearer token |
| PUT | `/api/trips/:tripCode` | Bearer token |
| DELETE | `/api/trips/:tripCode` | Bearer token |

---

# Portfolio Reflection

## Architecture

**The three kinds of front end here are not interchangeable, and the differences are the point.**

Static HTML came first. Every page its own file with trip content typed into the markup. Changing a price meant editing the same block in several places.

Express with Handlebars fixed that. Layout, header, and footer moved into partials, and page content became data passed into a template. The server assembles the finished HTML, so every navigation is a full round trip and a full reload. The page arrives complete, which is good for search engines and means nothing depends on the client running JavaScript. The cost is that the server does all the rendering and the user watches a reload on every click.

The Angular admin app is the opposite trade. The browser loads one `index.html` and a bundle once, then the router swaps components without touching the server. Data arrives as JSON from the API. Navigation is instant, and components are reusable in a way partials are not, since a component carries its own logic and state rather than just markup. The cost is bundle size, a real build step, and a search engine seeing an empty shell.

Running both against one API means maintaining two front ends and two mental models of the same data. For production I would pick one. For a course project the contrast is worth it.

**Why MongoDB.** A trip is naturally one self contained document: code, name, length, start date, resort, price, image, description. None of it needs joining to render a trip card. Relationally I would split that across tables and reassemble it on every read for no benefit. In MongoDB a trip comes back matching the shape the API returns and the Angular `Trip` model consumes, with no translation layer. The flexible schema also mattered mid course, since fields changed between modules and adding one to a document store is just adding it.

Pushing back on my own choice: if this grew real bookings, users, and payments, relational integrity would start to matter more than document convenience and I would want transactions and joins. For a read heavy catalog, documents win.

## Functionality

**JSON is not JavaScript.** JavaScript is a language. JSON is a text format for data and nothing else. The syntax resembles an object literal because it was derived from one, but keys must be double quoted, and there are no functions, comments, `undefined`, trailing commas, or dates. An object can hold behavior. JSON can only hold data.

That limitation is what makes it work as the contract between halves. A Mongoose document comes out of MongoDB, `res.json()` serializes it, it crosses as an HTTP body, and Angular's `HttpClient` parses it into a typed `Trip`. Neither side knows anything about the other's runtime.

The failure mode is when both ends agree on the format and disagree on the shape. The guide's `register` returned a bare token string while `login` returned `{token}`. Both valid JSON. The Angular service reads `.token` from both, so register would have stored `undefined` and every later request would carry a garbage header. Nothing throws.

**Refactoring.** Trip data went from hardcoded HTML to `data/trips.json` to MongoDB behind the API, each step removing a place the same information lived twice. `routes/` and `views/` moved into `app_server/` once the API arrived, because otherwise there is no clean answer to where an API route belongs versus a page route.

On the Angular side, components were building their own request URLs early on. Moving every call into `trip-data.service.ts` meant components ask the service and never touch HTTP, which paid off immediately when auth arrived: token handling landed in one service and one interceptor instead of every component that makes a request.

The refactor I would point to first is `login()` returning an Observable. The guide's version returns void and subscribes internally, leaving the component unable to tell success from failure, and works around it by checking for a token, waiting three seconds on a `setTimeout`, and checking again. A wrong password produces no feedback at all. Returning the Observable lets the component navigate when the token actually arrives. Swallowing an async result inside a service throws away the only signal the caller has.

**Reusable components** mean one place to fix a bug and no chance of copies drifting. `trip-card` renders in the listing and is not duplicated. The cost is that inputs have to be designed well or you get something taking a dozen flags that is harder to read than the duplication was. I extracted on the second use, not the first.

## Testing

**Methods** are the verb half of an endpoint. GET reads and never changes state, so it is safe to retry or cache. POST creates and is not idempotent. PUT replaces and is. DELETE removes. Not cosmetic, because clients and proxies act on what the verb implies.

**An endpoint** is the method and route together. `GET /api/trips` and `POST /api/trips` share a path but differ in auth requirements and response shape. Each row in the table above is a contract.

Status codes are part of that contract. The guide returned 501 for a malformed Authorization header, which means the server does not implement the feature and tells the client to stop trying. The real situation is a bad request, which is 401 and tells them to fix the header and retry. A duplicate registration crashed the process instead of returning 409, so the client got a dropped connection rather than a reason.

**Security adds a second dimension to testing.** Before JWT every request just worked. Now each protected endpoint has three cases: valid token succeeds, missing token returns 401, tampered or expired token returns 401 rather than leaking a stack trace or falling through. In Postman that means capturing the token from login into a collection variable and referencing it as `{{jwt}}`, which only works if login is saved into a named collection first.

**The failure mode worth testing for is the one that produces no error.** Three guide defects fail silently. `authenticateJWT` calls `next()` regardless of whether verification succeeded, and only an unrelated crash on the error line stops a bad token reaching the controller. The interceptor's URL check compares `startsWith('login')` against an absolute URL, so it is always false. A bare `provideHttpClient()` does not read `HTTP_INTERCEPTORS` from DI, so the interceptor registers and never runs.

None of these announce themselves. Confirming a protected endpoint returns 200 with a valid token proves nothing, because it returns 200 without one too. The test that matters is the negative one.

## Reflection

I came in with a cybersecurity background from the Air Force, so defense in depth and never trusting client input were not new. What was new was building the thing being defended. Implementing the salting and hashing, the token signing, the middleware ahead of the handler, and the client interceptor changed how I read security guidance, because I know where the seams are now.

The most useful thing this course gave me is not on the syllabus. The guide has real defects: broken control flow in the auth middleware, an undeclared variable, a missing try/catch that terminates the process on a two click reproduction, an unreachable conditional, a wrong status code, mismatched response shapes, an interceptor condition that is always false, and an endpoint documented as protected that existed only as a string in a CORS header.

The `authenticateJWT` one is worth dwelling on. The guide's error line calls `res.sendStatus(401).json(...)`, which throws because the response was already sent, and that crash is the only thing keeping an invalid token out of the controller. Cleaning up the stray `.json()`, which any reasonable developer would do on sight, silently turns authentication off. Working code and correct code are not the same thing, and the gap is invisible unless you go looking. So I got in the habit of reading before running and documenting each deviation with the reasoning. That transfers to every codebase I inherit, and inheriting somebody else's questionable code is most of the job.

The concrete skills are the MEAN stack end to end: designing a REST API and defending the method and status code choices, modeling data in Mongoose and explaining when a document store fits, building Angular components, services, and interceptors, and implementing token based auth without copying a tutorial. Plus process discipline: a branch per module, commit messages describing the diff, scripted builds with preflight checks and rollback.

The gap I would close first is testing. Everything here was verified manually in Postman, which does not scale and does not catch regressions. Given that three of the defects above fail silently, automated integration tests are exactly what this project is missing.

On marketability, the combination is what matters. Plenty of candidates can build a CRUD app and plenty can talk about security posture. Being able to build it and then walk through the attack surface I created, what I did about it, and where enforcement actually lives is worth more than either half alone.

---

## Dependencies

`npm audit` reports 13 findings. These are the accepted state for course dependency compatibility. Running `npm audit fix` upgrades pinned packages and breaks the build, so it is deliberately not run.

The `crypto` package listed in the course guide is not installed. That npm package is a deprecated stub and Node resolves its own built-in `crypto` module first regardless, so installing it adds a dependency for no benefit.

## Deviations from the course guide

Most of these are defect fixes rather than preferences.

**`authenticateJWT` control flow.** The guide passes a callback to `jwt.verify` and calls `next()` on the following line. A `return` inside that callback returns from the callback, not from the middleware, so `next()` runs whether or not verification succeeded. The only thing stopping a bad token from reaching the controller is that the guide's error line, `res.sendStatus(401).json(...)`, throws because `sendStatus` has already sent the response. Removing that stray `.json()` as an obvious tidy-up would silently turn off authentication. This version uses the synchronous form of `jwt.verify` inside a try/catch so `next()` is only reachable on success.

**Registration crash.** The guide's `register` controller awaits `user.save()` with no try/catch. Because `email` is a unique index, registering a duplicate throws E11000, and Express 4 does not catch rejected promises from async handlers, so under Node 22 the process terminates. Registering the same address twice is a two click reproduction. The controller now returns 409.

**Undefined variable.** The guide's "database returned no data" branch calls `.json(err)` where `err` was never declared.

**Response shape.** The guide's `register` returns a bare token string while `login` returns `{token}`. The Angular service reads `.token` from both, so register would have stored `undefined`. Both now return `{token}`.

**Header parsing.** The guide checks `if (headers.length < 1)` after splitting the Authorization header. Splitting a non-empty string always yields at least one element, so that branch is unreachable and a header of `Bearer` with no token falls through. It also returned 501, which describes a missing server feature rather than a bad client request. Corrected to `< 2` returning 401.

**Interceptor URL test.** The guide checks `request.url.startsWith('login')`, but `request.url` is the absolute `http://localhost:3000/api/login`, so the test is always false and the auth-endpoint exclusion never fires. Changed to match the end of the path.

**DELETE is protected.** The guide secures only POST and PUT because it never implemented DELETE, which existed solely as a string in the CORS `Allow-Methods` header. DELETE removes data, so it is an administrative method by the same reasoning that protects the other two.

**Password comparison.** The guide compares hashes with `===`. String equality short-circuits on the first differing character, so comparison time leaks how many leading characters matched. `crypto.timingSafeEqual` compares the full buffer every time. The practical leak here is small because PBKDF2 dominates the timing, but a hash comparison is exactly where the correct primitive costs nothing.

**Login returns an Observable.** The guide's `login()` returns void and subscribes internally, leaving the component unable to tell success from failure, and works around it by checking, waiting three seconds on a `setTimeout`, and checking again. A wrong password produces no feedback at all under that design. Returning the Observable lets the component navigate when the token actually arrives and show a real message when it does not.

**Bootstrap 5 attributes.** The guide's navbar uses `data-toggle` and `data-target`, which are Bootstrap 4 names. This project loads Bootstrap 5.3.2, where the collapse plugin reads `data-bs-toggle` and `data-bs-target`.

**`app.config.ts`.** The guide uses `importProvidersFrom(HttpClientModule)` and notes it shows as deprecated. `provideHttpClient(withInterceptorsFromDi())` does the same job with current API. Worth knowing: a bare `provideHttpClient()` does not read `HTTP_INTERCEPTORS` from DI, so the interceptor would register and silently never run, with no error and no warning.

**Mongoose 9.x.** Mongoose 9.9.1 is well past what the guide assumes. Callbacks were removed in Mongoose 7, so `connection.close()` uses async/await. `Trip.init()` must be awaited before seeding or the index build races the insert. `{ new: true }` is replaced by `returnDocument: 'after'`.

## A note on the button visibility

Hiding Add, Edit, and Delete when logged out is presentation only. It stops an honest user from clicking something that would fail. It stops nobody from calling the API directly, which is easy to demonstrate in Postman. The `authenticateJWT` middleware is the actual enforcement.
