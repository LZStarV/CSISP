import { loadRootEnv } from '@csisp/utils';
import { MongoClient } from 'mongodb';

import { getInfraDbLogger } from '../logger';

async function main() {
  loadRootEnv();
  const logger = getInfraDbLogger();

  const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017';
  const dbName = process.env.MONGODB_DB || 'csisp';

  const client = new MongoClient(uri);

  try {
    await client.connect();
    const db = client.db(dbName);
    const content = db.collection('content');

    await content.createIndex({ type: 1, createdAt: -1 });
    await content.createIndex({ 'scope.courseId': 1, createdAt: -1 });
    await content.createIndex({ 'scope.classId': 1, createdAt: -1 });

    logger.info({ dbName }, 'Mongo content indexes ensured');
  } catch (e) {
    logger.error({ err: e }, 'Mongo content seed failed');
    process.exitCode = 1;
  } finally {
    try {
      await client.close();
    } catch {}
  }
}

void main();
