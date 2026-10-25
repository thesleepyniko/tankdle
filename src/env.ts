import { defineEnvVars } from '@sveltejs/kit/env';

export const variables = defineEnvVars({
	DATABASE_URL: { description: 'The database connection string.' },
	ENCRYPTION_KEY: { description: 'Encryption key used for password hashes, make sure this is long!' }
});
