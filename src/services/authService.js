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
}

export default new AuthService();
