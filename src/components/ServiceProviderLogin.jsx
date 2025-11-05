import { useState } from "react";
import { toast } from "react-hot-toast";
import { useAuth } from "../context/AuthContext";

const ServiceProviderLogin = () => {
    const { login } = useAuth();
    const [usernameOrEmail, setUsernameOrEmail] = useState("");
    const [password, setPassword] = useState("");
    const [submitting, setSubmitting] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!usernameOrEmail || !password) {
            toast.error("Please enter both username and password");
            return;
        }
        try {
            setSubmitting(true);
            const result = await login(usernameOrEmail, password);
            if (!result.success) {
                toast.error(result.error?.message || "Invalid credentials");
                return;
            }
            if (result.profile?.role !== "admin") {
                // Treat service providers as admin role for now
                toast.error("Access denied. Service provider account required.");
                return;
            }
            toast.success("Logged in successfully");
        } catch (err) {
            toast.error("Login failed. Please try again");
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                    Username or Email
                </label>
                <input
                    type="text"
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-nepal-blue"
                    placeholder="example@provider.com"
                    value={usernameOrEmail}
                    onChange={(e) => setUsernameOrEmail(e.target.value)}
                    autoComplete="username"
                />
            </div>
            <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                    Password
                </label>
                <input
                    type="password"
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-nepal-blue"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    autoComplete="current-password"
                />
            </div>
            <button
                type="submit"
                disabled={submitting}
                className="w-full bg-nepal-blue text-white font-medium py-2.5 rounded-lg hover:bg-blue-700 transition disabled:opacity-60"
            >
                {submitting ? "Signing in..." : "Sign in"}
            </button>
        </form>
    );
};

export default ServiceProviderLogin;


