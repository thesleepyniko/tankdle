// Creates .env from .env.example and fills in generated secrets.
// Safe to re-run: only empty values are filled, existing ones are kept.
import { randomBytes } from 'node:crypto';
import { existsSync, readFileSync, writeFileSync } from 'node:fs';

const hex = (bytes: number) => randomBytes(bytes).toString('hex');

let env = readFileSync(existsSync('.env') ? '.env' : '.env.example', 'utf8');

const get = (key: string) => env.match(new RegExp(`^${key}="?([^"\\n]*)"?`, 'm'))?.[1] ?? '';
const fill = (key: string, value: string) => {
	if (get(key)) return;
	const line = new RegExp(`^${key}=.*$`, 'm');
	env = line.test(env)
		? env.replace(line, `${key}="${value}"`)
		: `${env.trimEnd()}\n${key}="${value}"\n`;
	console.log(`generated ${key}`);
};

fill('POSTGRES_PASSWORD', hex(24));
fill('ENCRYPTION_KEY', hex(32));
fill(
	'DATABASE_URL',
	`postgres://${get('POSTGRES_USER')}:${get('POSTGRES_PASSWORD')}@localhost:${get('DB_PORT') || 5432}/${get('POSTGRES_DB')}`
);

writeFileSync('.env', env);
