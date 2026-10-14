import mongoose from 'mongoose';

mongoose.connection.on('connected', () => console.log(`MongoDB connected: ${mongoose.connection.name}`));
mongoose.connection.on('error', (err) => console.error('MongoDB error:', err.message));

// Cached across requests: on Vercel each serverless instance reuses one
// connection instead of reconnecting for every API call.
let connecting = null;

export async function connectDB() {
  if (mongoose.connection.readyState === 1) return;
  const uri = process.env.MONGODB_URI;
  if (!uri) throw new Error('MONGODB_URI is not set — copy .env.example to .env');
  connecting ??= mongoose.connect(uri).catch((err) => {
    connecting = null; // allow a retry on the next request
    throw err;
  });
  await connecting;
}
