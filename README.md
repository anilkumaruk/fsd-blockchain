# Chain of Record — Full Stack (MERN) Version

Verifiable academic credential system. The UI is the same as the design prototype. In this version, credential data is stored in **MongoDB** and served by an **Express** API.

| Layer    | Tech                                              |
| -------- | ------------------------------------------------- |
| Frontend | React 19, Vite, Tailwind CSS, React Router        |
| Backend  | Node.js, Express                                  |
| Database | MongoDB with Mongoose                             |
| Auth     | JWT, with registrar passwords hashed using bcrypt |

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
        ├── seed.js         Loads demo data and creates the admin user
        ├── certificate.js  SHA-256 of the certificate PDF
        ├── models/         Credential, Admin (Mongoose schemas)
        ├── routes/         auth.js, credentials.js
        └── middleware/     auth.js (checks the JWT)
```

## Run it

You need Node 20+ and a running MongoDB. A local install works: `brew services start mongodb-community`. So does an Atlas URI.

```bash
npm run install:all     # install root, server and client packages
cp server/.env.example server/.env   # skip if .env already exists
npm run seed            # load 8 demo credentials and the admin account
npm run dev             # API on :4000, web app on :5173
```

Open http://localhost:5173. Registrar login: **admin / admin123**. You can change it in `server/.env`, then run `npm run seed` again.

To use **MongoDB Atlas**, set `MONGODB_URI=mongodb+srv://<user>:<pass>@<cluster>/chain_of_record` in `server/.env`.

## API

| Method | Endpoint                               | Auth  | Purpose                                     |
| ------ | -------------------------------------- | ----- | ------------------------------------------- |
| GET    | `/api/health`                          | –     | Server and database status                  |
| POST   | `/api/auth/login`                      | –     | Registrar login, returns a JWT              |
| GET    | `/api/credentials?studentId=`          | –     | List all credentials, or one student's      |
| GET    | `/api/credentials/:credentialId`       | –     | Get one credential                          |
| POST   | `/api/credentials`                     | Admin | Issue a credential (server computes the hash) |
| PATCH  | `/api/credentials/:credentialId/revoke`| Admin | Revoke a credential, with a reason          |
| POST   | `/api/verify`                          | –     | Verify by `credentialId` or by `fileHash`   |

## How verification works

When a credential is issued, the server builds the certificate PDF bytes and stores their SHA-256 hash in MongoDB. The browser uses the same PDF generator. When someone uploads a downloaded certificate on the Verify page, the browser hashes the file and the API looks for that hash. If the PDF was edited, the hash changes and verification fails.

Blockchain transactions (`txHash`) are still simulated. MongoDB acts as the credential registry.
