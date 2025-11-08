import supabase from "../libs/supabaseConfig";

const BUCKET = "citizenship-images";
const TABLE = "citizen_applications";

async function getCurrentUserId() {
    const { data } = await supabase.auth.getUser();
    return data?.user?.id || null;
}

async function uploadCitizenshipImage(file, pathPrefix) {
    if (!file) throw new Error("No file provided");
    const fileExt = file.name.split(".").pop();
    const fileName = `${pathPrefix}-${Date.now()}.${fileExt}`;
    const filePath = `${fileName}`;
    const { error } = await supabase.storage
        .from(BUCKET)
        .upload(filePath, file, {
            cacheControl: "3600",
            upsert: false,
        });
    if (error) throw error;
    const { data: publicUrlData } = supabase.storage
        .from(BUCKET)
        .getPublicUrl(filePath);
    return { filePath, publicUrl: publicUrlData.publicUrl };
}

async function submitCitizenApplication(payload) {
    const { data, error } = await supabase
        .from(TABLE)
        .insert(payload)
        .select()
        .single();
    if (error) throw error;
    return data;
}

async function listCitizenApplications({ userId, limit = 5 }) {
    let query = supabase
        .from(TABLE)
        .select(
            "id, service, status, created_at, citizenship_front_url, citizenship_back_url",
        )
        .order("created_at", { ascending: false })
        .limit(limit);

    if (userId) query = query.eq("user_id", userId);

    const { data, error } = await query;
    if (error) throw error;
    return data || [];
}

// Service Provider functions
async function listAllApplications({
    status,
    service,
    limit = 50,
    offset = 0,
}) {
    let query = supabase
        .from(TABLE)
        .select("*")
        .order("created_at", { ascending: false })
        .range(offset, offset + limit - 1);

    if (status) query = query.eq("status", status);
    if (service) query = query.eq("service", service);

    const res = await query;
    console.log(res);
    const { data, error } = res;
    if (error) throw error;
    return data || [];
}

async function getApplicationById(applicationId) {
    const { data, error } = await supabase
        .from(TABLE)
        .select("*")
        .eq("id", applicationId)
        .single();
    if (error) throw error;
    return data;
}

async function updateApplicationStatus(applicationId, status, notes = null) {
    const updateData = { status };
    if (notes !== null) updateData.notes = notes;
    if (status === "approved" || status === "rejected") {
        updateData.processed_at = new Date().toISOString();
    }

    const { data, error } = await supabase
        .from(TABLE)
        .update(updateData)
        .eq("id", applicationId)
        .select()
        .single();
    if (error) throw error;
    return data;
}

export default {
    getCurrentUserId,
    uploadCitizenshipImage,
    submitCitizenApplication,
    listCitizenApplications,
    listAllApplications,
    getApplicationById,
    updateApplicationStatus,
};
