import { loadEnvironment } from "../config/env";
import { connectToDatabase, disconnectFromDatabase } from "../database/mongo";
import { hashPassword } from "../common/password";
import { UserService } from "../modules/users/user.service";
import { InstitutionService } from "../modules/institutions/institution.service";

async function seed() {
  const environment = loadEnvironment();
  await connectToDatabase(environment);
  const users = new UserService(); const institutions = new InstitutionService();
  if (!await users.findByEmail("admin@example.com")) await users.create({ email: "admin@example.com", fullName: "System Admin", role: "ADMIN", passwordHash: await hashPassword("Admin@123") });
  try { await institutions.create({ name: "Demo University", code: "DEMO" }); } catch { /* already created */ }
  console.log("Seed complete. Admin login: admin@example.com / Admin@123");
  await disconnectFromDatabase();
}
seed().catch(async (error) => { console.error(error); await disconnectFromDatabase(); process.exit(1); });
