import dotenv from 'dotenv';
    import { fileURLToPath } from 'url';
    import { dirname, join } from 'path';
    import fs from 'fs';

    // Get the directory name of the current module
    const __dirname = dirname(fileURLToPath(import.meta.url));

    // Load environment variables from .env file if it exists
    const envPath = join(__dirname, '..', '.env');
    if (fs.existsSync(envPath)) {
      dotenv.config({ path: envPath });
    } else {
      dotenv.config();
    }

    export const config = {
      apiKey: process.env.TRIPLE_WHALE_API_KEY,
      shopId: process.env.TRIPLE_WHALE_SHOP_ID,
      baseUrl: 'https://api.triplewhale.com/api/v2'
    };

    export function validateConfig() {
      if (!config.apiKey) {
        console.error('Error: TRIPLE_WHALE_API_KEY is not set in environment variables');
        return false;
      }
      if (!config.shopId) {
        console.error('Error: TRIPLE_WHALE_SHOP_ID is not set in environment variables');
        return false;
      }
      return true;
    }
