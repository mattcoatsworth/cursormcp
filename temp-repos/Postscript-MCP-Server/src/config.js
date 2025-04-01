import dotenv from 'dotenv';
    import { z } from 'zod';

    dotenv.config();

    const configSchema = z.object({
      POSTSCRIPT_API_KEY: z.string().min(1, "Postscript API key is required"),
    });

    try {
      const config = configSchema.parse(process.env);
      export default config;
    } catch (error) {
      console.error("Configuration error:", error.errors);
      process.exit(1);
    }
