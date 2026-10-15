# Chain of Record — Full Stack (MERN) Version

Verifiable academic credential system. The UI is the same as the design prototype. In this version, credential data is stored in **MongoDB** and served by an **Express** API.

Any college or university can **register as an institution**. Each institution has one admin account. Its admin issues and revokes only that institution's credentials. Anyone can verify a credential from any institution. Alliance University is created by the seed script as the first registered institution.

**Students** have one account across every college they study at, and their **email is the unique login**. Each college still gives the student its own roll number (Student ID). When a college issues a credential, it enters both the roll number and the student's email. Every credential issued to that email, from any college, appears in the student's one account. A student can sign up with name, email and password at any time, before or after their credentials are issued.

| Identifier | Unique per | Used for |
| --- | --- | --- |
| Email | Student (global) | Student login; links credentials from every college |
| Student ID (roll number) | One college | Printed on that college's certificate |
| Credential ID | One certificate | Verifying a single credential |
| Profile ID | Student (global) | Public share link `/profile/:profileId`, which never shows the email |

| Layer    | Tech                                              |
| -------- | ------------------------------------------------- |
| Frontend | React 19, Vite, Tailwind CSS, React Router        |
| Backend  | Node.js, Express                                  |
| Database | MongoDB with Mongoose                             |
| Auth     | JWT with roles (institution, student); passwords hashed using bcrypt |

## Folder structure

```
blockchain-fsd/
├── api/index.js            Vercel serverless entry (wraps the Express app)
├── vercel.json             Vercel build and routing config
├── client/                 React frontend (same UI as the design project)
│   └── src/lib/api.js      All HTTP calls to the backend
└── server/
    ├── .env                Settings: Mongo URI, JWT secret, admin login
    └── src/
        ├── app.js          Express app (routes, middleware)
        ├── index.js        Local server start-up (app.listen)
        ├── db.js           MongoDB connection
        ├── seed.js         Creates Alliance University and its demo credentials
        ├── certificate.js  SHA-256 of the certificate PDF
        ├── models/         Institution, Student, Credential (Mongoose schemas)
        ├── routes/         auth.js, student.js, credentials.js
        └── middleware/     auth.js (checks the JWT and role)
```

## Run it

You need Node 20+ and a running MongoDB. A local install works: `brew services start mongodb-community`. So does an Atlas URI.

```bash
npm run install:all     # install root, server and client packages
cp server/.env.example server/.env   # skip if .env already exists
npm run seed            # create Alliance University, 8 demo credentials, 1 demo student
npm run dev             # API on :4000, web app on :5173
```

Open http://localhost:5173/admin. Alliance University login: **admin / admin123**. You can change it in `server/.env`, then run `npm run seed` again. To add another college, click **Register your institution** on the sign-in card.

Student Portal at http://localhost:5173/student. Demo student login: **ananya.sharma@example.com / student123**.

> `npm run seed` deletes every registered institution, student and credential, then recreates only the demo data.

To use **MongoDB Atlas**, set `MONGODB_URI=mongodb+srv://<user>:<pass>@<cluster>/chain_of_record` in `server/.env`.

## Deploy to Vercel

The React app is served as static files. The Express API runs as one serverless function, `api/index.js`, which reuses `server/src/app.js`. `vercel.json` sets up the build and routing.

1. **Create a MongoDB Atlas database.** Atlas has a free M0 cluster.
   - Create a database user.
   - Under **Network Access**, allow `0.0.0.0/0`. Vercel's IP addresses change, so you can't allow a single address.
   - Copy the connection string and add the database name: `mongodb+srv://USER:PASS@CLUSTER.mongodb.net/chain_of_record`.
2. **Load data into Atlas** from your computer: `cd server && MONGODB_URI="<atlas uri>" node --env-file=.env src/seed.js`. The `MONGODB_URI` you pass here overrides the one in `.env`.
3. **Import the repo in Vercel.** Set **Application Preset** to **Other** and leave **Root Directory** as `./`.
4. **Add these Environment Variables** in Vercel:
   - `MONGODB_URI`: the Atlas connection string
   - `JWT_SECRET`: a long random string, different from your local one
5. **Deploy.** Check `https://<your-app>.vercel.app/api/health`. It should return `"db":"connected"`.

## API

| Method | Endpoint                               | Auth  | Purpose                                     |
| ------ | -------------------------------------- | ----- | ------------------------------------------- |
| GET    | `/api/health`                          | –     | Server and database status                  |
| POST   | `/api/auth/register`                   | –     | Register a college with its admin login (password is bcrypt-hashed) |
| POST   | `/api/auth/login`                      | –     | Institution admin login, returns a JWT      |
| GET    | `/api/auth/institutions`               | –     | List registered institutions                |
| GET    | `/api/my/credentials`                  | Admin | Credentials issued by your institution      |
| POST   | `/api/student/register`                | –     | Student sign-up (name, email, password)     |
| POST   | `/api/student/login`                   | –     | Student login, returns a JWT                |
| GET    | `/api/student/me/credentials`          | Student | The student's credentials from every college |
| GET    | `/api/student/profile/:profileId`      | –     | Public Academic Passport (no email shown)  |
| GET    | `/api/credentials?studentId=`          | –     | List all credentials, or one student's      |
| GET    | `/api/credentials/:credentialId`       | –     | Get one credential                          |
| POST   | `/api/credentials`                     | Admin | Issue a credential as your institution (server computes the hash) |
| PATCH  | `/api/credentials/:credentialId/status`| Admin | Set `valid`, `revoked` or `invalid` (revoked/invalid need `category` + `reason`); history kept |
| PATCH  | `/api/credentials/:credentialId/revoke`| Admin | Shorthand for status `revoked` |
| POST   | `/api/verify`                          | –     | Verify by `credentialId` or by `fileHash`   |

## How verification works

When a credential is issued, the server builds the certificate PDF bytes and stores their SHA-256 hash in MongoDB. The browser uses the same PDF generator. When someone uploads a downloaded certificate on the Verify page, the browser hashes the file and the API looks for that hash. If the PDF was edited, the hash changes and verification fails.

Blockchain transactions (`txHash`) are still simulated. MongoDB acts as the credential registry.
