import * as dotenv from 'dotenv';
import * as path from 'path';

/**
 * Carga determinista de env (independiente del cwd y del orden de imports).
 * Debe ser el PRIMER import de main.ts, data-source.ts y seed.ts.
 * dotenv no sobrescribe variables ya exportadas: el shell siempre gana.
 */
const candidates = [
  path.resolve(__dirname, '../../.env'), // back/.env — overrides locales
  path.resolve(__dirname, '../../../.env'), // .env de la raíz del repo
];

for (const file of candidates) {
  dotenv.config({ path: file });
}
