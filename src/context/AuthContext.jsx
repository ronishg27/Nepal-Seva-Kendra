import { createContext, useContext, useEffect, useState } from "react";
import authService from "../services/authService";
import supabase from "../libs/supabaseConfig";

const AuthContext = createContext(null);

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

            console.log("loggedInUser:", loggedInUser);
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

    const value = {
        user,
        profile,
        loading,
        login,
        logout,
        isAuthenticated: !!user,
        isAdmin: profile?.role === "admin",
        isCitizen: profile?.role === "citizen",
    };

    return (
        <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
    );
};

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error("useAuth must be used within an AuthProvider");
    }
    return context;
};
