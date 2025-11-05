import { createContext, useContext, useEffect, useState } from 'react';
import authService from '../services/authService';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [profile, setProfile] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // Check if user is already logged in
        checkUser();
    }, []);

    const checkUser = async () => {
        try {
            const { user: currentUser, profile: userProfile, error } = await authService.getLoggedInUser();
            if (error) {
                setUser(null);
                setProfile(null);
            } else {
                setUser(currentUser);
                setProfile(userProfile);
            }
        } catch (error) {
            console.error('Error checking user:', error);
            setUser(null);
            setProfile(null);
        } finally {
            setLoading(false);
        }
    };

    const login = async (email, password) => {
        setLoading(true);
        try {
            const { user: loggedInUser, profile: userProfile, error } = await authService.signInWithEmailPassword({
                email,
                password,
            });

            if (error) {
                throw error;
            }

            setUser(loggedInUser);
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
        isAdmin: profile?.role === 'admin',
        isCitizen: profile?.role === 'user',
    };

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};

