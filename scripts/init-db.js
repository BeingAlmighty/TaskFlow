import 'dotenv/config';
import { initDatabase } from '../src/lib/init-db.js';

async function main() {
  try {
    await initDatabase();
    console.log('Database init script finished.');
    process.exit(0);
  } catch (error) {
    console.error('Error during init:', error);
    process.exit(1);
  }
}

main();
