import "dotenv/config";

import app from "./app";
import connectDB from "./config/db";
import { seedAllDefaults } from "./scripts/seedTamilBooks";

const PORT = process.env.PORT || 5000;

const startServer = async (): Promise<void> => {
  await connectDB();
  await seedAllDefaults();

  app.listen(PORT, () => {
    console.log(`🚀 Server is running on http://localhost:${PORT}`);
  });
};

startServer();