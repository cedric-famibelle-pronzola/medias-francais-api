#!/usr/bin/env -S deno run --env-file --allow-env --allow-net --allow-write --allow-read

// deno-lint-ignore-file no-console

import Papa from 'papaparse';

const source = Deno.env.get('GITHUB_SOURCE');

const mainFiles = [
  'personnes.tsv',
  'medias.tsv',
  'organisations.tsv'
];

const detailedFiles = [
  'personne-media.tsv',
  'personne-organisation.tsv',
  'organisation-organisation.tsv',
  'organisation-media.tsv'
];

async function ensureDir(path: string) {
  try {
    await Deno.mkdir(path, { recursive: true });
  } catch (error) {
    if (!(error instanceof Deno.errors.AlreadyExists)) {
      throw error;
    }
  }
}

async function fetchAndParse(filename: string): Promise<unknown[]> {
  const response = await fetch(`${source}/${filename}`);

  if (!response.ok) {
    throw new Error(`Failed to fetch ${filename}: ${response.statusText}`);
  }

  const text = await response.text();
  const result = Papa.parse(text, { header: true });

  return result.data;
}

interface ProcessStats {
  files: number;
  entries: number;
}

async function processFiles(
  files: string[],
  outputDir: string
): Promise<ProcessStats> {
  await ensureDir(outputDir);

  let totalEntries = 0;

  for (const file of files) {
    const jsonFilename = file.replace('.tsv', '.json');
    const outputPath = `${outputDir}/${jsonFilename}`;

    console.log(
      `%c Processing %c ${file}`,
      'color: white; background-color: blue; font-weight: bold',
      'color: cyan'
    );

    const data = await fetchAndParse(file);
    await Deno.writeTextFile(outputPath, JSON.stringify(data, null, 2));

    totalEntries += data.length;

    console.log(
      `  %c→ %c${outputPath} %c(${data.length} entries)`,
      'color: green; font-weight: bold',
      'color: gray',
      'color: yellow'
    );
  }

  return { files: files.length, entries: totalEntries };
}

async function build() {
  console.log(
    `%c 🔨 Building JSON files from TSV sources... `,
    'color: white; background-color: blue; font-weight: bold'
  );

  // Process main files
  console.log(
    `%c === Main files ===`,
    'color: white; background-color: green; font-weight: bold'
  );
  const mainStats = await processFiles(mainFiles, 'dist/main');

  // Process detailed files
  console.log(
    `%c === Detailed files ===`,
    'color: white; background-color: green; font-weight: bold'
  );
  const detailedStats = await processFiles(detailedFiles, 'dist/detailed');

  const totalFiles = mainStats.files + detailedStats.files;
  const totalEntries = mainStats.entries + detailedStats.entries;

  console.log(
    `\n%c ✅ Build complete `,
    'color: white; background-color: green; font-weight: bold'
  );

  console.log(
    `%c    Files: %c${totalFiles} %c| %cEntries: %c${totalEntries}`,
    'color: magenta; font-weight: bold',
    'color: cyan; font-weight: bold',
    'color: gray',
    'color: magenta; font-weight: bold',
    'color: green; font-weight: bold'
  );

  console.log(
    `%c    Main: %c${mainStats.files} files %c| %c${mainStats.entries} entries`,
    'color: magenta; font-weight: bold',
    'color: cyan; font-weight: bold',
    'color: gray',
    'color: green; font-weight: bold'
  );

  console.log(
    `%c    Detailed: %c${detailedStats.files} files %c| %c${detailedStats.entries} entries`,
    'color: magenta; font-weight: bold',
    'color: cyan; font-weight: bold',
    'color: gray',
    'color: green; font-weight: bold'
  );
}

try {
  await build();
} catch (error) {
  console.error(error);
  Deno.exit(1);
}
