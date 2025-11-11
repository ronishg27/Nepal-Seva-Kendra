import { useState } from "react";
import { toast } from "react-hot-toast";
import { useAuth } from "../context/useAuth";
import { useNavigate } from "react-router-dom";

const ServiceProviderLogin = () => {
    const { login } = useAuth();
    const navigate = useNavigate();
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
            const result = await toast.promise(
                (async () => {
                    const resp = await login(usernameOrEmail, password);
                    if (!resp.success) {
                        throw new Error(
                            resp.error?.message || "Invalid credentials",
                        );
                    }
                    if (resp.profile?.role !== "service_provider") {
                        throw new Error(
                            "Access denied. Service provider account required.",
                        );
                    }
                    return resp;
                })(),
                {
                    loading: "Signing in...",
                    success: "Logged in successfully",
                    error: (e) => e.message || "Login failed",
                },
            );
            if (result?.success) {
                navigate("/admin", { replace: true });
            }
            // }
            //  catch () {
            //       // error toast already shown by toast.promise
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
