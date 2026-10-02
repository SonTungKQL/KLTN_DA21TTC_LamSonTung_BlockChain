import { createApp } from "./app";
import { loadEnvironment } from "./config/env";
import { connectToDatabase } from "./database/mongo";

async function bootstrap() {
  const environment = loadEnvironment();
  await connectToDatabase(environment);
  const app = createApp(environment);
  app.listen(environment.PORT, () =>
    console.log(
      `API listening at http://localhost:${environment.PORT} (Swagger: /api/docs)`,
    ),
  );
}

bootstrap().catch((error: unknown) => {
  console.error("Unable to start API", error);
  process.exit(1);
});
