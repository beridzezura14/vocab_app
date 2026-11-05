import { MongoClient } from "mongodb";

let client: MongoClient | undefined;

export function database() {
  const uri = process.env.MONGODB_URI;
  if (!uri) throw new Error("MongoDB is not configured");
  client ??= new MongoClient(uri, { serverSelectionTimeoutMS: 5000 });
  return client.db("language_app");
}
