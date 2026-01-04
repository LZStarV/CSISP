import { MongoClient } from 'mongodb';
import { loadRootEnv } from '../config/load-env';
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

    const existingCount = await content.estimatedDocumentCount();
    if (existingCount > 0) {
      logger.info({ dbName, existingCount }, 'Mongo content already seeded, skip');
      return;
    }

    const now = new Date();
    const docs = [
      {
        type: 'announcement',
        title: '示例公告：开学通知',
        richBody: '<p>新学期将在下周一正式开始。</p>',
        attachments: [],
        authorId: 1,
        scope: {},
        status: 'published',
        createdAt: now,
        updatedAt: now,
      },
      {
        type: 'homework',
        title: '示例作业：数据结构第一次作业',
        richBody: '<p>请完成链表实现并提交。</p>',
        attachments: [],
        authorId: 1,
        scope: { courseId: 1, classId: 1 },
        status: 'published',
        createdAt: now,
        updatedAt: now,
      },
    ];

    await content.insertMany(docs, { ordered: true });
    logger.info({ dbName }, 'Mongo content seed completed');
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
