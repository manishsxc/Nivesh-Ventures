import mongoose from "mongoose";

const MONGODB_URI = process.env.MONGODB_URI as string;

if (!MONGODB_URI) {
  // Thrown at request time, not build time, so build doesn't fail without env set yet.
  console.warn("MONGODB_URI is not set. Add it to your .env file.");
}

type MongooseCache = {
  conn: typeof mongoose | null;
  promise: Promise<typeof mongoose> | null;
};

// eslint-disable-next-line no-var
declare global {
  // eslint-disable-next-line no-var
  var _mongooseCache: MongooseCache | undefined;
}

const cached: MongooseCache = global._mongooseCache || { conn: null, promise: null };
global._mongooseCache = cached;

export class DatabaseConnectionError extends Error {
  constructor(message: string, readonly cause?: unknown) {
    super(message);
    this.name = "DatabaseConnectionError";
  }
}

function toDatabaseError(error: unknown) {
  if (error instanceof DatabaseConnectionError) {
    return error;
  }

  const message =
    typeof error === "object" && error !== null && "message" in error && typeof (error as { message?: unknown }).message === "string"
      ? (error as { message: string }).message
      : "Unknown database error";

  return new DatabaseConnectionError(
    `MongoDB connection failed. Check your MONGODB_URI and ensure your current IP is whitelisted in Atlas. ${message}`,
    error,
  );
}

export async function connectDB() {
  if (cached.conn) return cached.conn;

  if (!MONGODB_URI) {
    throw new DatabaseConnectionError("MONGODB_URI missing. Set it in your .env file before using the database.");
  }

  if (!cached.promise) {
    cached.promise = mongoose
      .connect(MONGODB_URI, {
        bufferCommands: false,
        serverSelectionTimeoutMS: 8000,
        connectTimeoutMS: 8000,
      })
      .catch((error) => {
        cached.promise = null;
        throw toDatabaseError(error);
      });
  }

  try {
    cached.conn = await cached.promise;
    return cached.conn;
  } catch (error) {
    cached.promise = null;
    throw toDatabaseError(error);
  }
}
