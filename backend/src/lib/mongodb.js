import { MongoClient, ServerApiVersion } from 'mongodb';

let clientPromise;

// Connect lazily so the server can boot (and report a clear error) without a DB URI.
export function getDb() {
  if (!process.env.MONGODB_URI) throw new Error('MONGODB_URI is not set');
  if (!clientPromise) {
    const client = new MongoClient(process.env.MONGODB_URI, {
      serverApi: { version: ServerApiVersion.v1, strict: true, deprecationErrors: true },
    });
    clientPromise = client.connect();
  }
  return clientPromise.then((c) => c.db('globaledutech'));
}

export const enquiries = () => getDb().then((db) => db.collection('globaledutech-enquiry'));
