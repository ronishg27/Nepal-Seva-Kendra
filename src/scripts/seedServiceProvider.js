console.log("Seeding service provider...");
import authService from "../services/authService.js";

async function seedServiceProvider() {
    const { data, error } = await authService.createServiceProvider({
        email: "admin@example.com",
        fullName: "Admin User",
        password: "securepassword",
    });

    console.log("Seed Service Provider Result:", { data, error });
}

export default seedServiceProvider;
