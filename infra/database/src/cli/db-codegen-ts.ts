import { runTsCodegen } from '../codegen/ts/db-codegen-ts';

async function main() {
  try {
    await runTsCodegen();
  } catch (e) {
    console.error('TS codegen failed:', e);
    process.exitCode = 1;
  }
}

void main();
