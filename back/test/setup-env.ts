import * as dotenv from 'dotenv';
import * as path from 'path';

// setupFiles de jest: corre ANTES de importar cualquier módulo de test,
// así TypeOrmModule.forRoot() ya ve las variables correctas.
dotenv.config({ path: path.resolve(__dirname, '../.env.test') });
dotenv.config({ path: path.resolve(__dirname, '../../.env') });
