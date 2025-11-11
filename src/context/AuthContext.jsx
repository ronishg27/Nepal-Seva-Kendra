import { useEffect, useState } from "react";
import authService from "../services/authService";
import supabase from "../libs/supabaseConfig";
import { AuthContext } from "./AuthContextCore";

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [profile, setProfile] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // Check if user is already logged in
        checkUser();
        // Listen for auth state changes and refresh user/profile
        const { data: subscription } = supabase.auth.onAuthStateChange(() => {
            checkUser();
        });

        return () => {
            subscription?.subscription?.unsubscribe?.();
        };
    }, []);

    const checkUser = async () => {
        try {
            const {
                user: currentUser,
                profile: userProfile,
                error,
            } = await authService.getLoggedInUser();
            if (error) {
                setUser(null);
                setProfile(null);
            } else {
                setUser(currentUser);
                setProfile(userProfile);
            }
        } catch (error) {
            console.error("Error checking user:", error);
            setUser(null);
            setProfile(null);
        } finally {
            setLoading(false);
        }
    };

    const login = async (email, password) => {
        setLoading(true);
        try {
            const {
                user: loggedInUser,
                profile: userProfile,
                error,
            } = await authService.signInServiceProvider({
                email,
                password,
            });

            if (error) {
                throw error;
            }

            setUser(loggedInUser);

            // debug log removed
            setProfile(userProfile);
            return { success: true, user: loggedInUser, profile: userProfile };
        } catch (error) {
            return { success: false, error };
        } finally {
            setLoading(false);
        }
    };

    const logout = async () => {
        setLoading(true);
        try {
            const { error } = await authService.signOut();
            if (error) throw error;
            setUser(null);
            setProfile(null);
            return { success: true };
        } catch (error) {
            return { success: false, error };
        } finally {
            setLoading(false);
        }
    };

    // Helper to get role from profile or user_metadata
    const getUserRole = () => {
        return profile?.role || user?.user_metadata?.role;
    };

    const value = {
        user,
        profile,
        loading,
        login,
        logout,
        isAuthenticated: !!user,
        isAdmin:
            getUserRole() === "admin" || getUserRole() === "service_provider",
        isServiceProvider: getUserRole() === "service_provider",
        isCitizen: getUserRole() === "citizen",
        getUserRole,
    };

    return (
        <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
    );
};

// useAuth has been moved to src/context/useAuth.jsx to preserve Fast Refresh
