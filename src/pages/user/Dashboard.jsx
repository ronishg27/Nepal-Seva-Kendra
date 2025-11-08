import { useEffect, useState } from "react";
import { toast } from "react-hot-toast";
import applicationService from "../../services/applicationService";
import { BSToAD, ADToBS } from "adbsmagic";
import { useAuth } from "../../context/AuthContext";

const servicesOffered = [
    { value: "nid", label: "NID Application" },
    { value: "dl", label: "Driving License" },
    { value: "voter", label: "Voter ID" },
    { value: "passport", label: "Passport" },
];

const Dashboard = () => {
    const [selectedService, setSelectedService] = useState(
        servicesOffered[0].value,
    );

    const { logout } = useAuth(); // to ensure user is authenticated
    const [form, setForm] = useState({
        fullName: "",
        fullNameNp: "",
        dateOfBirth: "", // AD (YYYY-MM-DD)
        dateOfBirthBs: "", // BS (YYYY-MM-DD)
        citizenshipNumber: "",
        address: "",
        phone: "",
        email: "",
        fatherName: "",
        fatherNameNp: "",
        motherName: "",
        motherNameNp: "",
        grandfatherName: "",
        grandfatherNameNp: "",
    });
    const [frontImage, setFrontImage] = useState(null);
    const [backImage, setBackImage] = useState(null);
    const [submitting, setSubmitting] = useState(false);
    const [appsLoading, setAppsLoading] = useState(true);
    const [recentApps, setRecentApps] = useState([]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setForm((prev) => ({ ...prev, [name]: value }));
    };

    // --- AD/BS conversion helpers using adbsmagic ---
    const convertAdToBs = (adDateStr) => {
        try {
            // Expecting UI format yyyy/mm/dd, convert to dashed for lib
            const dashed = adDateStr.replaceAll("/", "-");
            const res = ADToBS(dashed);
            // res expected as 'YYYY-MM-DD'
            return typeof res === "string" ? res.replaceAll("-", "/") : null;
        } catch {
            return null;
        }
    };

    const convertBsToAd = (bsDateStr) => {
        try {
            const dashed = bsDateStr.replaceAll("/", "-");
            const res = BSToAD(dashed);
            return typeof res === "string" ? res.replaceAll("-", "/") : null;
        } catch {
            return null;
        }
    };

    const isFullYYYYMMDD = (v) => /^\d{4}\/\d{2}\/\d{2}$/.test(v);

    const onAdDateChange = (e) => {
        const value = e.target.value;
        setForm((p) => ({ ...p, dateOfBirth: value }));
        if (value === "") {
            setForm((p) => ({ ...p, dateOfBirthBs: "" }));
            return;
        }
        if (isFullYYYYMMDD(value)) {
            const bs = convertAdToBs(value);
            if (bs) setForm((p) => ({ ...p, dateOfBirthBs: bs }));
        }
    };

    const onBsDateChange = (e) => {
        const value = e.target.value;
        setForm((p) => ({ ...p, dateOfBirthBs: value }));
        if (value === "") {
            setForm((p) => ({ ...p, dateOfBirth: "" }));
            return;
        }
        if (isFullYYYYMMDD(value)) {
            const ad = convertBsToAd(value);
            if (ad) setForm((p) => ({ ...p, dateOfBirth: ad }));
        }
    };

    const validate = () => {
        if (!selectedService) return "Please select a service";
        if (!form.fullName) return "Full name is required";
        if (!form.dateOfBirth && !form.dateOfBirthBs)
            return "Date of birth (AD or BS) is required";
        if (form.dateOfBirth && !isFullYYYYMMDD(form.dateOfBirth))
            return "AD date must be YYYY/MM/DD";
        if (form.dateOfBirthBs && !isFullYYYYMMDD(form.dateOfBirthBs))
            return "BS date must be YYYY/MM/DD";
        if (!form.citizenshipNumber) return "Citizenship number is required";
        if (!form.address) return "Address is required";
        if (!form.phone) return "Phone is required";
        if (!form.email) return "Email is required";
        if (!frontImage) return "Please upload citizenship front image";
        if (!backImage) return "Please upload citizenship back image";
        return null;
    };

    const uploadImage = async (file, pathPrefix) => {
        return applicationService.uploadCitizenshipImage(file, pathPrefix);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        const validationError = validate();
        if (validationError) {
            toast.error(validationError);
            return;
        }

        setSubmitting(true);
        try {
            // const result =
            await toast.promise(
                (async () => {
                    const userId = await applicationService.getCurrentUserId();
                    // Upload images
                    let frontUpload = null;
                    let backUpload = null;
                    try {
                        frontUpload = await uploadImage(
                            frontImage,
                            `${form.citizenshipNumber}-front`,
                        );
                        backUpload = await uploadImage(
                            backImage,
                            `${form.citizenshipNumber}-back`,
                        );
                    } catch (err) {
                        // If storage bucket missing or upload fails, continue without blocking DB insert
                        console.warn(
                            "Image upload failed:",
                            err?.message || err,
                        );
                    }

                    // Insert application metadata
                    const data =
                        await applicationService.submitCitizenApplication({
                            user_id: userId,
                            service: selectedService,
                            full_name: form.fullName,
                            full_name_np: form.fullNameNp || null,
                            // For DB: AD date as YYYY-MM-DD for Postgres date column
                            date_of_birth: form.dateOfBirth
                                ? form.dateOfBirth.replaceAll("/", "-")
                                : null,
                            // BS stored as text, keep UI format with slashes
                            date_of_birth_bs: form.dateOfBirthBs || null,
                            citizenship_number: form.citizenshipNumber,
                            address: form.address,
                            phone: form.phone,
                            email: form.email,
                            father_name: form.fatherName || null,
                            father_name_np: form.fatherNameNp || null,
                            mother_name: form.motherName || null,
                            mother_name_np: form.motherNameNp || null,
                            grandfather_name: form.grandfatherName || null,
                            grandfather_name_np: form.grandfatherNameNp || null,
                            citizenship_front_url:
                                frontUpload?.publicUrl || null,
                            citizenship_back_url: backUpload?.publicUrl || null,
                            status: "submitted",
                        });
                    return data;
                })(),
                {
                    loading: "Submitting application...",
                    success: "Application submitted successfully",
                    error: (err) =>
                        err?.message || "Failed to submit application",
                },
            );

            // Reset form after success
            setForm({
                fullName: "",
                fullNameNp: "",
                dateOfBirth: "",
                dateOfBirthBs: "",
                citizenshipNumber: "",
                address: "",
                phone: "",
                email: "",
                fatherName: "",
                fatherNameNp: "",
                motherName: "",
                motherNameNp: "",
                grandfatherName: "",
                grandfatherNameNp: "",
            });
            setFrontImage(null);
            setBackImage(null);
            setSelectedService(servicesOffered[0].value);
            // Refresh recent applications
            await fetchRecentApplications();
        } finally {
            setSubmitting(false);
        }
    };

    const fetchRecentApplications = async () => {
        setAppsLoading(true);
        try {
            const userId = await applicationService.getCurrentUserId();
            const data = await applicationService.listCitizenApplications({
                userId,
                limit: 5,
            });
            setRecentApps(data || []);
        } catch (err) {
            console.warn(
                "Failed to load recent applications:",
                err?.message || err,
            );
        } finally {
            setAppsLoading(false);
        }
    };

    useEffect(() => {
        fetchRecentApplications();
    }, []);

    return (
        <div className="min-h-screen bg-gray-50">
            <div className="container mx-auto px-4 py-8">
                <h1 className="text-3xl font-bold text-nepal-darkBlue mb-6">
                    Citizen Dashboard
                </h1>

                <div className="bg-white rounded-lg shadow-md p-6">
                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Service
                            </label>
                            <select
                                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-nepal-blue"
                                value={selectedService}
                                onChange={(e) =>
                                    setSelectedService(e.target.value)
                                }
                            >
                                {servicesOffered.map((s) => (
                                    <option key={s.value} value={s.value}>
                                        {s.label}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Full Name
                                </label>
                                <input
                                    type="text"
                                    name="fullName"
                                    value={form.fullName}
                                    onChange={handleChange}
                                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-nepal-blue"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Full Name (Devanagari)
                                </label>
                                <input
                                    type="text"
                                    name="fullNameNp"
                                    placeholder="देवनागरीमा नाम"
                                    value={form.fullNameNp}
                                    onChange={handleChange}
                                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-nepal-blue"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Date of Birth (AD)
                                </label>
                                <input
                                    type="text"
                                    name="dateOfBirth"
                                    placeholder="YYYY/MM/DD"
                                    value={form.dateOfBirth}
                                    onChange={onAdDateChange}
                                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-nepal-blue"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Date of Birth (BS)
                                </label>
                                <input
                                    type="text"
                                    inputMode="numeric"
                                    placeholder="YYYY/MM/DD"
                                    name="dateOfBirthBs"
                                    value={form.dateOfBirthBs}
                                    onChange={onBsDateChange}
                                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-nepal-blue"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Citizenship Number
                                </label>
                                <input
                                    type="text"
                                    name="citizenshipNumber"
                                    value={form.citizenshipNumber}
                                    onChange={handleChange}
                                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-nepal-blue"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Address
                                </label>
                                <input
                                    type="text"
                                    name="address"
                                    value={form.address}
                                    onChange={handleChange}
                                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-nepal-blue"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Phone
                                </label>
                                <input
                                    type="tel"
                                    name="phone"
                                    value={form.phone}
                                    onChange={handleChange}
                                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-nepal-blue"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Email
                                </label>
                                <input
                                    type="email"
                                    name="email"
                                    value={form.email}
                                    onChange={handleChange}
                                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-nepal-blue"
                                />
                            </div>
                            <div className="md:col-span-2 border-t pt-4">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            Father's Name
                                        </label>
                                        <input
                                            type="text"
                                            name="fatherName"
                                            value={form.fatherName}
                                            onChange={handleChange}
                                            className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-nepal-blue"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            Father's Name (Devanagari)
                                        </label>
                                        <input
                                            type="text"
                                            name="fatherNameNp"
                                            placeholder="देवनागरीमा बुवाको नाम"
                                            value={form.fatherNameNp}
                                            onChange={handleChange}
                                            className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-nepal-blue"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            Mother's Name
                                        </label>
                                        <input
                                            type="text"
                                            name="motherName"
                                            value={form.motherName}
                                            onChange={handleChange}
                                            className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-nepal-blue"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            Mother's Name (Devanagari)
                                        </label>
                                        <input
                                            type="text"
                                            name="motherNameNp"
                                            placeholder="देवनागरीमा आमाको नाम"
                                            value={form.motherNameNp}
                                            onChange={handleChange}
                                            className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-nepal-blue"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            Grandfather's Name
                                        </label>
                                        <input
                                            type="text"
                                            name="grandfatherName"
                                            value={form.grandfatherName}
                                            onChange={handleChange}
                                            className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-nepal-blue"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            Grandfather's Name (Devanagari)
                                        </label>
                                        <input
                                            type="text"
                                            name="grandfatherNameNp"
                                            placeholder="देवनागरीमा हजुरबुबाको नाम"
                                            value={form.grandfatherNameNp}
                                            onChange={handleChange}
                                            className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-nepal-blue"
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Citizenship Front Image
                                </label>
                                <input
                                    type="file"
                                    accept="image/*"
                                    onChange={(e) =>
                                        setFrontImage(
                                            e.target.files?.[0] || null,
                                        )
                                    }
                                    className="w-full"
                                />
                                {frontImage && (
                                    <img
                                        alt="Front preview"
                                        src={URL.createObjectURL(frontImage)}
                                        className="mt-2 h-28 object-cover rounded border"
                                    />
                                )}
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Citizenship Back Image
                                </label>
                                <input
                                    type="file"
                                    accept="image/*"
                                    onChange={(e) =>
                                        setBackImage(
                                            e.target.files?.[0] || null,
                                        )
                                    }
                                    className="w-full"
                                />
                                {backImage && (
                                    <img
                                        alt="Back preview"
                                        src={URL.createObjectURL(backImage)}
                                        className="mt-2 h-28 object-cover rounded border"
                                    />
                                )}
                            </div>
                        </div>

                        <button
                            type="submit"
                            disabled={submitting}
                            className="w-full md:w-auto bg-nepal-blue text-white font-medium py-2.5 px-6 rounded-lg hover:bg-blue-700 transition disabled:opacity-60"
                        >
                            {submitting
                                ? "Submitting..."
                                : "Submit Application"}
                        </button>
                    </form>
                </div>

                <div className="bg-white rounded-lg shadow-md p-6 mt-6">
                    <div className="flex items-center justify-between mb-4">
                        <h2 className="text-xl font-semibold text-nepal-darkBlue">
                            Recent Applications
                        </h2>
                        <span className="text-sm text-gray-500">Latest 5</span>
                    </div>
                    {appsLoading ? (
                        <div className="text-gray-600">Loading...</div>
                    ) : recentApps.length === 0 ? (
                        <div className="text-gray-600">
                            No applications yet.
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-gray-200">
                                <thead>
                                    <tr>
                                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Service
                                        </th>
                                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Submitted
                                        </th>
                                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Status
                                        </th>
                                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Images
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-200">
                                    {recentApps.map((app) => (
                                        <tr key={app.id}>
                                            <td className="px-4 py-2 text-sm text-gray-800">
                                                {servicesOffered.find(
                                                    (s) =>
                                                        s.value === app.service,
                                                )?.label || app.service}
                                            </td>
                                            <td className="px-4 py-2 text-sm text-gray-600">
                                                {app.created_at
                                                    ? new Date(
                                                          app.created_at,
                                                      ).toLocaleString()
                                                    : "—"}
                                            </td>
                                            <td className="px-4 py-2 text-sm">
                                                <span className="inline-flex items-center px-2.5 py-0.5 rounded text-xs font-medium bg-blue-50 text-blue-700 border border-blue-200">
                                                    {app.status}
                                                </span>
                                            </td>
                                            <td className="px-4 py-2 text-sm text-nepal-blue space-x-3">
                                                {app.citizenship_front_url ? (
                                                    <a
                                                        href={
                                                            app.citizenship_front_url
                                                        }
                                                        target="_blank"
                                                        rel="noreferrer"
                                                        className="underline"
                                                    >
                                                        Front
                                                    </a>
                                                ) : (
                                                    <span className="text-gray-400">
                                                        Front
                                                    </span>
                                                )}
                                                {app.citizenship_back_url ? (
                                                    <a
                                                        href={
                                                            app.citizenship_back_url
                                                        }
                                                        target="_blank"
                                                        rel="noreferrer"
                                                        className="underline"
                                                    >
                                                        Back
                                                    </a>
                                                ) : (
                                                    <span className="text-gray-400">
                                                        Back
                                                    </span>
                                                )}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default Dashboard;
