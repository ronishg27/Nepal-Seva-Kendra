import { useState } from "react";
import { toast } from "react-hot-toast";
import authService from "../services/authService";

const CitizenLogin = () => {
    const [email, setEmail] = useState("");
    const [otp, setOtp] = useState("");
    const [isOTPSent, setIsOTPSent] = useState(false);
    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!isOTPSent) {
            if (!email) {
                toast.error("Please enter your email");
                return;
            }
            const resp = await authService.signInWithOTP({ email });
            if (resp.error) {
                toast.error(resp.error?.message || "Error sending OTP");
            } else {
                toast.success("OTP sent to your email");
                setIsOTPSent(true);
            }
        } else {
            if (!otp) {
                toast.error("Please enter the OTP sent to your email");
                return;
            }
            const resp = await authService.verifyOTP({ email, token: otp });
            if (resp.error) {
                toast.error(resp.error?.message || "OTP verification failed");
            } else {
                toast.success("OTP verified. You are now logged in");
            }
        }
    };
    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                    Email
                </label>
                <input
                    type="email"
                    placeholder="you@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-nepal-blue"
                    autoComplete="email"
                />
            </div>
            {isOTPSent && (
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                        One-Time Password (OTP)
                    </label>
                    <input
                        type="text"
                        placeholder="Enter the OTP"
                        value={otp}
                        onChange={(e) => setOtp(e.target.value)}
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-nepal-blue tracking-widest"
                        inputMode="numeric"
                    />
                </div>
            )}
            <button
                type="submit"
                className="w-full bg-nepal-blue text-white font-medium py-2.5 rounded-lg hover:bg-blue-700 transition"
            >
                {isOTPSent ? "Verify OTP" : "Send OTP"}
            </button>
        </form>
    );
};

export default CitizenLogin;
