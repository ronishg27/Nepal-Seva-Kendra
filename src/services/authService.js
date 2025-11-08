import supabase from "../libs/supabaseConfig.js";

class AuthService {
    // CITIZEN AUTHENTICATION

    // CITIZEN SIGN IN WITH OTP
    async signInCitizenWithOTP({ email }) {
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

    async verifyCitizenOTP({ email, token }) {
        const { data, error } = await supabase.auth.verifyOtp({
            email,
            token,
            type: "email", //or magiclink
        });

        console.log({ data, error }); //debug log

        // ensure role exists in metadata
        if (data?.user && !data.user.user_metadata.role) {
            await this._updateRole(data.user.id, "citizen");
        }
        console.log({ data, error }); //debug log

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

        // // fetch profile and verify role
        // const resp = await supabase.from("profiles").select("*");
        // // .eq("id", data.user.id)
        // // .single();

        // console.log(resp.error);
        // const { data: profile, error: profileError } = resp;

        // if (profileError) {
        //     return { user: null, profile: null, error: profileError };
        // }
        console.log(data.user);
        if (data.user.user_metadata.role !== "service_provider") {
            return {
                user: null,
                error: { message: "Not authorized as service provider" },
            };
        }

        console.log("first");
        return {
            user: data.user,
            profile: data.user.user_metadata,
            error: null,
        };
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

        // If profile row doesn't exist yet, don't treat it as an auth failure
        if (profileError) {
            return { user: data.user, profile: null, error: null };
        }

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
