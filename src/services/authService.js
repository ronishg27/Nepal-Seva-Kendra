import supabase from "../libs/supabaseConfig.js";

async function registerUser({ email, password, role, fullName }) {
    const resp = await supabase.auth.signUp({
        email,
        password,
        options: {
            data: {
                full_name: fullName,
                role: role,
            },
        },
    });

    return resp;
}

class AuthService {
    async createNewAdmin({ email, password, fullName }) {
        return await registerUser({ email, password, role: "admin", fullName });
    }

    async createNewUser({ email, password, fullName }) {
        return await registerUser({ email, password, role: "user", fullName });
    }

    async signInWithEmailPassword({ email, password }) {
        const { user, error } = await supabase.auth.signInWithPassword({
            email,
            password,
        });

        if (error) {
            return { user: null, error };
        }

        const { data: profile, error: profileError } = await supabase
            .from("profiles")
            .select("*")
            .eq("id", user.id)
            .single();
        if (profileError) {
            return { user: null, error: profileError };
        }
        return { user, profile, error: null };
    }

    async signOut() {
        const { error } = await supabase.auth.signOut();
        return { error };
    }

    async getLoggedInUser() {
        const { data, error } = await supabase.auth.getUser();
        if (error) {
            return { user: null, error };
        }

        const { data: profile, error: profileError } = await supabase
            .from("profiles")
            .select("*")
            .eq("id", data.user.id)
            .single();

        if (profileError) {
            return { user: null, error: profileError };
        }

        return { user: data.user, profile, error: null };
    }

    async signInWithOTP({ email }) {
        // To be implemented
        const resp = await supabase.auth.signInWithOtp({
            email,
            options: {
                emailRedirectTo: `${import.meta.env.VITE_APP_URL}/dashboard`,
                shouldCreateUser: true,
            },
        });
        return resp;
    }

    async verifyOTP({ email, token }) {
        // To be implemented
        const resp = await supabase.auth.verifyOtp({
            email,
            token,
            type: "magiclink",
            options: {
                redirectTo: `${import.meta.env.VITE_APP_URL}/dashboard`,
                shouldCreateUser: true,
            },
        });
        return resp;
    }
}

class AuthService_ {
    // CITIZEN AUTHENTICATION

    // CITIZEN SIGN IN WITH OTP
    async signInCitizenWithOTP(email) {
        const { data, error } = await supabase.auth.signInWithOtp({
            email,
            options: {
                emailRedirectTo: `${import.meta.env.VITE_APP_URL}/dashboard`,
                shouldCreateUser: true, // auto-register if new
                data: {
                    role: "citizen",
                },
            },
        });

        return { data, error };
    }

    // CITIZEN VERIFY OTP

    async verifyCitizenOTP(email, token) {
        const { data, error } = await supabase.auth.verifyOtp({
            email,
            token,
            type: "email", //or magiclink
        });

        // ensure role exists in metadata
        if (data?.user && !data.user.user_metadata.role) {
            await this._updateRole(data.user.id, "citizen");
        }

        return { data, error };
    }

    //  SERVICE PROVIDER AUTHENTICATION

    // SERVICE PROVIDER SIGN IN WITH OTP

    // create service provider (admin/officer)

    async createServiceProvider({ email, password, fullName }) {
        const { data, error } = await supabase.auth.signUp({
            email,
            password,
            options: {
                data: {
                    full_name: fullName,
                    role: "service_provider",
                },
            },
        });

        return { data, error };
    }

    /**
     * Sign in a service provider with email/password
     */
    async signInServiceProvider({ email, password }) {
        const { data, error } = await supabase.auth.signInWithPassword({
            email,
            password,
        });

        if (error) return { user: null, error };

        // fetch profile and verify role
        const { data: profile, error: profileError } = await supabase
            .from("profiles")
            .select("*")
            .eq("id", data.user.id)
            .single();

        if (profileError) return { user: null, error: profileError };

        if (profile.role !== "service_provider") {
            return {
                user: null,
                error: { message: "Not authorized as service provider" },
            };
        }

        return { user: data.user, profile, error: null };
    }

    // -------- 🧩 COMMON AUTH HELPERS --------
    async signOut() {
        const { error } = await supabase.auth.signOut();
        return { error };
    }

    async getLoggedInUser() {
        const { data, error } = await supabase.auth.getUser();
        if (error) return { user: null, error };

        const { data: profile, error: profileError } = await supabase
            .from("profiles")
            .select("*")
            .eq("id", data.user.id)
            .single();

        if (profileError) return { user: null, error: profileError };

        return { user: data.user, profile, error: null };
    }

    // -----------------------------------------
    // INTERNAL HELPERS
    async _updateRole(userId, role) {
        // Ensures 'profiles' table and user metadata are aligned
        await supabase.from("profiles").upsert({ id: userId, role });
        await supabase.auth.updateUser({ data: { role } });
    }
}

export default new AuthService();
export { AuthService };
