import fs from 'fs';
import path from 'path';
import { getInfraDbLogger } from '../../logger';

export async function runTsCodegen() {
  const logger = getInfraDbLogger();
  const schemaPath = path.resolve(__dirname, '../../schema/db-schema.json');

  if (!fs.existsSync(schemaPath)) {
    logger.info('No schema/db-schema.json found, skip TS codegen.');
    return;
  }

  const raw = fs.readFileSync(schemaPath, 'utf8');
  try {
    const schema = JSON.parse(raw);
    logger.info({ keys: Object.keys(schema) }, 'TS codegen placeholder');
  } catch (e) {
    logger.error({ err: e }, 'Failed to parse db-schema.json');
  }
}
