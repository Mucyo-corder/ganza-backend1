/**
 * NLU diagnostics — prints intent, candidates and concept hits for utterances.
 * Usage: npx tsx scripts/diag-nlu.ts "Fungura camera" "fata ifoto"
 */
import { understand } from '../src/agent/nlu/understand.js';
import { normalizeUtterance } from '../src/agent/nlu/normalizer.js';
import { detectLanguage } from '../src/agent/nlu/language.js';

const inputs = process.argv.slice(2);
const cases = inputs.length > 0 ? inputs : ['fata ifoto'];

for (const input of cases) {
  const result = understand(input, { ephemeral: true });
  const norm = normalizeUtterance(input);
  console.log(`\n══ ${input}`);
  console.log(`   tokens=[${norm.tokens.join('|')}] stems=[${norm.stems.join('|')}] repairs=${norm.repairs.map(r => `${r.from}→${r.to}(${r.reason})`).join(',') || '-'}`);
  console.log(`   lang=${detectLanguage(input).language}/${detectLanguage(input).dominant} intent=${result.intent.intent} conf=${result.confidence} clarify=${result.needsClarification}`);
  console.log(`   candidates: ${result.intent.candidates.slice(0, 4).map(c => `${c.intent}:${c.score}/${c.confidence}`).join('  ')}`);
  const hits = result.intent.hits.map(h => `${h.concept}←${h.surface}(${h.entry},${h.match})`);
  console.log(`   hits: ${hits.join(' ')}`);
  console.log(`   entities: ${result.entities.map(e => `${e.type}=${JSON.stringify(e.value)}`).join(' ')}`);
}
