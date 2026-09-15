import {readFile, writeFile} from 'node:fs/promises';

interface BlockArgument {
  type: string;
  defaultValue?: boolean | number | string;
  menu?: string;
}

interface BlockDefinition {
  opcode: string;
  blockType: string;
  text: string;
  feature?: string;
  arguments: Record<string, BlockArgument>;
}

interface BlockDescription {
  en: string;
  ja: string;
}

interface BlockDescriptions {
  formatVersion: number;
  blocks: Record<string, BlockDescription>;
}

interface BlockDefinitions {
  extensionName: string;
  blocks: BlockDefinition[];
}

const START = '<!-- BEGIN GENERATED BLOCKS -->';
const END = '<!-- END GENERATED BLOCKS -->';

const definitions = JSON.parse(
  await readFile(new URL('../src/block-definitions.json', import.meta.url), 'utf8')
) as BlockDefinitions;

/**
 * Prose lives outside the definitions the extension imports.
 *
 * `src/block-definitions.json` is bundled, so every sentence in it is shipped to every project that
 * loads this extension. Descriptions are read by the documentation and by nothing at runtime, and
 * this package is chosen partly for its size.
 */
const descriptions = JSON.parse(
  await readFile(new URL('../docs/block-descriptions.json', import.meta.url), 'utf8')
) as BlockDescriptions;

function describe(block: BlockDefinition): BlockDescription {
  const entry = descriptions.blocks[block.opcode];
  if (!entry?.en?.trim() || !entry.ja?.trim()) {
    throw new Error(`docs/block-descriptions.json is missing en/ja for ${block.opcode}`);
  }
  return entry;
}

/**
 * Both READMEs are generated from the same definitions.
 *
 * The Japanese list used to be maintained by hand, and drifted: it kept describing a `MIRRORED`
 * argument that no longer existed and listed none of the twelve calibration blocks. A description
 * missing in either language now fails the build rather than going unnoticed.
 */
await write('../README.md', definitions.blocks.map(renderBlock).join('\n\n'));
await write('../README.ja.md', renderJapaneseList(definitions.blocks));

async function write(relative: string, generated: string): Promise<void> {
  const url = new URL(relative, import.meta.url);
  const contents = await readFile(url, 'utf8');
  if (!contents.includes(START) || !contents.includes(END)) {
    throw new Error(`${relative} does not contain the generated block markers.`);
  }
  await writeFile(
    url,
    contents.replace(
      new RegExp(`${escapeRegExp(START)}[\\s\\S]*?${escapeRegExp(END)}`),
      `${START}\n\n${generated}\n\n${END}`
    )
  );
}

/**
 * The Japanese list, grouped by the flag that gates each block.
 *
 * Gated blocks are absent from the palette unless their flag is on, so listing them beside the rest
 * without saying which is which would describe a palette nobody sees.
 */
function renderJapaneseList(blocks: readonly BlockDefinition[]): string {
  const always = blocks.filter((block) => block.feature === undefined);
  const features = [...new Set(blocks.flatMap((block) => (block.feature ? [block.feature] : [])))];
  const sections = [always.map(renderJapaneseEntry).join('\n')];
  for (const feature of features) {
    const gated = blocks.filter((block) => block.feature === feature);
    sections.push(
      `次の${gated.length}ブロックは\`${feature}\`フラグがONのときだけパレットに出ます（既定OFF）。`,
      gated.map(renderJapaneseEntry).join('\n')
    );
  }
  return sections.join('\n\n');
}

function renderJapaneseEntry(block: BlockDefinition): string {
  return `- \`${block.text}\`: ${describe(block).ja}`;
}

function renderBlock(block: BlockDefinition): string {
  const rows = [
    ['Type', titleCase(block.blockType)],
    ['Opcode', `\`${block.opcode}\``]
  ];
  for (const [name, argument] of Object.entries(block.arguments ?? {})) {
    rows.push([
      `\`${name}\``,
      `${titleCase(argument.type)}, default: \`${formatDefault(argument.defaultValue)}\``
    ]);
  }
  return [
    `### \`${block.text}\``,
    '',
    describe(block).en,
    '',
    '| Property | Value |',
    '|---|---|',
    ...rows.map(([name, value]) => `| ${name} | ${value} |`)
  ].join('\n');
}

function titleCase(value: string): string {
  return value.charAt(0) + value.slice(1).toLowerCase();
}

function formatDefault(value: BlockArgument['defaultValue']): string {
  return String(value).replaceAll('\\', '\\\\').replaceAll('\n', '\\n').replaceAll('`', '\\`');
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}
