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
├── client/                 React frontend (same UI as the design project)
│   └── src/lib/api.js      All HTTP calls to the backend
└── server/
    ├── .env                Settings: Mongo URI, JWT secret, admin login
    └── src/
        ├── index.js        Express app and server start-up
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
| PATCH  | `/api/credentials/:credentialId/revoke`| Admin | Revoke one of your institution's credentials |
| POST   | `/api/verify`                          | –     | Verify by `credentialId` or by `fileHash`   |

## How verification works

When a credential is issued, the server builds the certificate PDF bytes and stores their SHA-256 hash in MongoDB. The browser uses the same PDF generator. When someone uploads a downloaded certificate on the Verify page, the browser hashes the file and the API looks for that hash. If the PDF was edited, the hash changes and verification fails.

Blockchain transactions (`txHash`) are still simulated. MongoDB acts as the credential registry.
