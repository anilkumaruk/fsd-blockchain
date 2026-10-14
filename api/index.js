// Vercel serverless function: every /api/* request is rewritten here
// (see vercel.json) and handled by the same Express app used locally.
import app from '../server/src/app.js';

export default app;
