import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { MongoClient } from 'mongodb';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '../../..');

const envPath = path.resolve(rootDir, '.env');
if (fs.existsSync(envPath)) {
  const content = fs.readFileSync(envPath, 'utf8');
  for (const line of content.split('\n')) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eq = trimmed.indexOf('=');
    if (eq === -1) continue;
    const key = trimmed.slice(0, eq).trim();
    const value = trimmed.slice(eq + 1).trim();
    if (!(key in process.env)) {
      process.env[key] = value;
    }
  }
}

async function main() {
  const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017';
  const dbName = process.env.MONGODB_DB || 'csisp';
  const client = new MongoClient(uri);
  await client.connect();
  const db = client.db(dbName);

  const content = db.collection('content');
  await content.createIndex({ type: 1, createdAt: -1 });
  await content.createIndex({ 'scope.courseId': 1, createdAt: -1 });
  await content.createIndex({ 'scope.classId': 1, createdAt: -1 });

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
  await client.close();
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
