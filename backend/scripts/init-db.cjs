const { MongoClient } = require('mongodb');

// Load environment variables from .env

// This script initializes the MongoDB database with required collections and indexes
// Run this script once when setting up the project: `npm run init-db`

const uri = process.env.MONGODB_URI;

// Check if MongoDB URI is defined
if (!uri) {
  console.error('Please define the MONGODB_URI environment variable in .env');
  process.exit(1);
}

async function initializeDatabase() {
  console.log('Initializing database...');
  
  const client = new MongoClient(uri);
  
  try {
    // Connect to MongoDB
    await client.connect();
    console.log('Connected to MongoDB');
    
    const db = client.db('globaledutech');
    const collectionName = 'globaledutech-enquiry';
    
    // Drop the collection if it exists to recreate with validation
    try {
      await db.collection(collectionName).drop();
      console.log(`Dropped existing ${collectionName} collection`);
    } catch (err) {
      // Collection might not exist yet, which is fine
      console.log('No existing collection to drop or error dropping:', err.message);
    }
    
    // Create collection with schema validation
    await db.createCollection(collectionName, {
      validator: {
        $jsonSchema: {
          bsonType: 'object',
          required: ['name', 'email', 'phone', 'message', 'program', 'formType'],
          properties: {
            name: {
              bsonType: 'string',
              description: 'Name is required and must be a string'
            },
            email: {
              bsonType: 'string',
              description: 'Email is required and must be a string',
              pattern: '^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}$'
            },
            phone: {
              bsonType: 'string',
              description: 'Phone number is required and must be a string'
            },
            message: {
              bsonType: 'string',
              description: 'Message is required and must be a string'
            },
            program: {
              bsonType: 'string',
              description: 'Program is required and must be a string'
            },
            studentAge: {
              bsonType: 'string',
              description: 'Student age is optional and must be a string'
            },
            preferredTime: {
              bsonType: 'string',
              description: 'Preferred time is optional and must be a string'
            },
            formType: {
              bsonType: 'string',
              description: 'Form type is required and must be a string',
              enum: ['General Enquiry', 'Program Enquiry']
            },
            createdAt: {
              bsonType: 'date',
              description: 'Created date is automatically set'
            }
          }
        }
      }
    });
    console.log(`Created ${collectionName} collection with validation`);
    
    // Create indexes
    const collection = db.collection(collectionName);
    await collection.createIndex({ createdAt: -1 });
    await collection.createIndex({ email: 1 });
    await collection.createIndex({ formType: 1 });
    await collection.createIndex({ program: 1 });
    
    console.log('Indexes created successfully');
    
    // Create a sample submission for testing (optional)
    const sampleSubmission = {
      name: 'Test User',
      email: 'test@example.com',
      phone: '1234567890',
      message: 'This is a test submission',
      program: 'General Enquiry',
      studentAge: '18-24',
      preferredTime: 'Morning',
      formType: 'General Enquiry',
      createdAt: new Date(),
      status: 'new'
    };
    
    await collection.insertOne(sampleSubmission);
    console.log('Sample submission created');
    
    console.log('Database initialization complete!');
  } catch (error) {
    console.error('Error initializing database:', error);
  } finally {
    await client.close();
  }
}

initializeDatabase().catch(console.error);
