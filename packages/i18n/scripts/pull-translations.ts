import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PROJECTS = {
  common: {
    apiKey: process.env.SIMPLELOCALIZE_COMMON_API_KEY || '',
    localesPath: path.resolve(__dirname, '../src/locales/common'),
  },
  portal: {
    apiKey: process.env.SIMPLELOCALIZE_PORTAL_API_KEY || '',
    localesPath: path.resolve(__dirname, '../src/locales/portal'),
  },
  'idp-client': {
    apiKey: process.env.SIMPLELOCALIZE_IDP_CLIENT_API_KEY || '',
    localesPath: path.resolve(__dirname, '../src/locales/idp-client'),
  },
} as const;

type ProjectKey = keyof typeof PROJECTS;

async function fetchTranslations(
  apiKey: string
): Promise<Record<string, Record<string, string>>> {
  const response = await fetch(
    'https://api.simplelocalize.io/api/v4/export?downloadFormat=multi-language-json',
    {
      method: 'GET',
      headers: {
        'x-simplelocalize-token': apiKey,
      },
    }
  );

  if (!response.ok) {
    throw new Error(
      `Failed to fetch translations: ${response.status} ${response.statusText}`
    );
  }

  const result = await response.json();
  const downloadUrl = result.data.files[0].url;

  const downloadResponse = await fetch(downloadUrl);
  if (!downloadResponse.ok) {
    throw new Error(
      `Failed to download translations: ${downloadResponse.status} ${downloadResponse.statusText}`
    );
  }

  return downloadResponse.json();
}

function saveTranslations(
  translations: Record<string, Record<string, string>>,
  basePath: string
): void {
  if (!fs.existsSync(basePath)) {
    fs.mkdirSync(basePath, { recursive: true });
  }

  for (const [lang, langTranslations] of Object.entries(translations)) {
    const langPath = path.join(basePath, lang);
    if (!fs.existsSync(langPath)) {
      fs.mkdirSync(langPath, { recursive: true });
    }

    const indexPath = path.join(langPath, 'index.json');
    fs.writeFileSync(indexPath, JSON.stringify(langTranslations, null, 2));
    process.stdout.write(`Saved ${lang} translations to ${indexPath}\n`);
  }
}

async function pullProject(projectKey: ProjectKey): Promise<void> {
  const config = PROJECTS[projectKey];

  if (!config.apiKey) {
    throw new Error(
      `Missing API key for ${projectKey}. Set SIMPLELOCALIZE_${projectKey.toUpperCase().replace(/-/g, '_')}_API_KEY environment variable.`
    );
  }

  process.stdout.write(`Fetching translations for ${projectKey}...\n`);
  const translations = await fetchTranslations(config.apiKey);
  saveTranslations(translations, config.localesPath);
  process.stdout.write(`Done fetching ${projectKey}!\n`);
}

async function main(): Promise<void> {
  const projectArg = process.argv[2];

  if (!projectArg) {
    process.stderr.write(
      'Usage: tsx pull-translations.ts <common|portal|idp-client|all>\n'
    );
    process.stderr.write(
      'Available projects: common, portal, idp-client, all\n'
    );
    process.exit(1);
  }

  try {
    if (projectArg === 'all') {
      process.stdout.write('Fetching translations for all projects...\n');
      for (const projectKey of Object.keys(PROJECTS) as ProjectKey[]) {
        await pullProject(projectKey);
      }
      process.stdout.write('Done fetching all projects!\n');
    } else if (PROJECTS[projectArg as ProjectKey]) {
      await pullProject(projectArg as ProjectKey);
    } else {
      process.stderr.write(`Unknown project: ${projectArg}\n`);
      process.stderr.write(
        'Available projects: common, portal, idp-client, all\n'
      );
      process.exit(1);
    }
  } catch (error) {
    process.stderr.write(`Error: ${error}\n`);
    process.exit(1);
  }
}

main();
