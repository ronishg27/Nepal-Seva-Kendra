import { useState } from "react";
import { toast } from "react-hot-toast";
import authService from "../services/authService";
import { useNavigate } from "react-router-dom";
import supabase from "../libs/supabaseConfig";

const CitizenLogin = () => {
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [isOTPSent, setIsOTPSent] = useState(false);
  const navigate = useNavigate();
  const handleCitizenLogin = async (e) => {
    e.preventDefault();
    if (!isOTPSent) {
      if (!email) {
        toast.error("Please enter your email");
        return;
      }
      try {
        const resp = await toast.promise(
          (async () => {
            const r = await authService.signInCitizenWithOTP({ email });
            if (r.error)
              throw new Error(r.error?.message || "Error sending OTP");
            return r;
          })(),
          {
            loading: "Sending OTP...",
            success: "OTP sent to your email",
            error: (e) => e.message || "Failed to send OTP",
          }
        );
        if (!resp.error) setIsOTPSent(true);
      } catch (err) {
        // toast shown by toast.promise
      }
    } else {
      if (!otp) {
        toast.error("Please enter the OTP sent to your email");
        return;
      }
      try {
        const resp = await toast.promise(
          (async () => {
            const r = await authService.verifyCitizenOTP({ email, token: otp });
            if (r.error)
              throw new Error(r.error?.message || "OTP verification failed");
            
            // Get user role from profile or user_metadata
            const userId = r.data?.user?.id;
            let userRole = r.data?.user?.user_metadata?.role;
            
            // Try to fetch from profiles table if not in metadata
            if (!userRole && userId) {
              const { data: profile } = await supabase
                .from("profiles")
                .select("role")
                .eq("id", userId)
                .single();
              userRole = profile?.role;
            }
            
            // Fallback to user_metadata if profile doesn't have it
            if (!userRole) {
              userRole = r.data?.user?.user_metadata?.role;
            }
            
            return { ...r, userRole };
          })(),
          {
            loading: "Verifying OTP...",
            success: "OTP verified. You are now logged in",
            error: (e) => e.message || "OTP verification failed",
          }
        );
        if (!resp.error) {
          // Redirect based on role
          const role = resp.userRole || resp.data?.user?.user_metadata?.role;
          if (role === "service_provider") {
            navigate("/admin", { replace: true });
          } else {
            navigate("/dashboard", { replace: true });
          }
        }
      } catch (err) {
        // toast shown by toast.promise
      }
    }
  };
  return (
    <form onSubmit={handleCitizenLogin} className="space-y-4">
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
