// console.log("Seeding service provider...");
import authService from "../services/authService.js";

async function seedServiceProvider() {
    const exists = await authService.checkIfServiceProviderExists();
    if (exists) {
        // console.log("Service provider already exists.");
        return;
    }

    // const { data, error } =
    await authService.createServiceProvider({
        email: import.meta.env.VITE_SERVICE_PROVIDER_EMAIL || "",
        fullName: import.meta.env.VITE_SERVICE_PROVIDER_NAME || "",
        password: import.meta.env.VITE_SERVICE_PROVIDER_PASSWORD || "",
    });
}

export default seedServiceProvider;
