import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/useAuth";
import CitizenLogin from "../components/CitizenLogin";
import ServiceProviderLogin from "../components/ServiceProviderLogin";
import govLogo from "../assets/govlogo.png";

const Landing = () => {
    const [loginType, setLoginType] = useState("citizen"); // 'citizen' or 'serviceProvider'
    const navigate = useNavigate();
    const { isAuthenticated, profile, user, loading } = useAuth();

    // Redirect authenticated users to their appropriate dashboard
    useEffect(() => {
        if (!loading && isAuthenticated) {
            // Get role from profile.role or user.user_metadata.role
            const role = profile?.role || user?.user_metadata?.role;
            if (role === "service_provider") {
                navigate("/admin", { replace: true });
            } else {
                navigate("/dashboard", { replace: true });
            }
        }
    }, [isAuthenticated, profile, user, loading, navigate]);

    const servicesOffered = [
        "NID Application",
        "Driving License",
        "Voter ID",
        "Passport",
    ];

    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-red-50">
            {/* Hero Section */}
            <section className="container mx-auto px-4 py-12">
                <div className="text-center mb-12">
                    <img
                        src={govLogo}
                        alt="Government of Nepal Emblem"
                        className="w-20 h-20 md:w-24 md:h-24 mx-auto mb-4"
                    />
                    <h2 className="text-4xl md:text-5xl font-bold text-nepal-darkBlue mb-4">
                        Welcome to Nepal Seva Kendra
                    </h2>
                    <p className="text-xl text-gray-700 mb-2">
                        नेपाल सेवा केन्द्रमा स्वागत छ
                    </p>
                    <p className="text-lg text-gray-600 max-w-2xl mx-auto">
                        Your one-stop portal for government services including
                        NID, Driving License, Voter ID, and Passport
                        applications.
                    </p>
                </div>

                {/* Services Preview */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-12">
                    {servicesOffered.map((service, idx) => (
                        <div
                            key={idx}
                            className="bg-white p-4 rounded-lg shadow-md border border-gray-200 text-center hover:shadow-lg transition-shadow"
                        >
                            <div className="w-12 h-12 bg-nepal-blue rounded-full mx-auto mb-2 flex items-center justify-center">
                                <span className="text-white font-bold">
                                    {idx + 1}
                                </span>
                            </div>
                            <p className="text-sm font-medium text-gray-700">
                                {service}
                            </p>
                        </div>
                    ))}
                </div>

                {/* Login Sections */}
                <div className="max-w-2xl mx-auto bg-white rounded-xl shadow-md border border-gray-200">
                    {/* Tabs */}
                    <div className="flex">
                        <button
                            type="button"
                            className={`flex-1 py-3 text-sm md:text-base font-medium border-b-2 ${
                                loginType === "citizen"
                                    ? "border-nepal-blue text-nepal-blue"
                                    : "border-transparent text-gray-500 hover:text-gray-700"
                            }`}
                            onClick={() => setLoginType("citizen")}
                        >
                            Citizen Login
                        </button>
                        <button
                            type="button"
                            className={`flex-1 py-3 text-sm md:text-base font-medium border-b-2 ${
                                loginType === "serviceProvider"
                                    ? "border-nepal-blue text-nepal-blue"
                                    : "border-transparent text-gray-500 hover:text-gray-700"
                            }`}
                            onClick={() => setLoginType("serviceProvider")}
                        >
                            Service Provider Login
                        </button>
                    </div>

                    {/* Panels */}
                    <div className="p-6">
                        {loginType === "citizen" ? (
                            <CitizenLogin />
                        ) : (
                            <ServiceProviderLogin />
                        )}
                    </div>
                </div>
            </section>
        </div>
    );
};

export default Landing;
