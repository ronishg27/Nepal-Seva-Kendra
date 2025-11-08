import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-hot-toast";
import { useAuth } from "../../context/AuthContext";
import applicationService from "../../services/applicationService";

const servicesOffered = [
    { value: "nid", label: "NID Application" },
    { value: "dl", label: "Driving License" },
    { value: "voter", label: "Voter ID" },
    { value: "passport", label: "Passport" },
];

const statusOptions = [
    { value: "", label: "All Statuses" },
    { value: "submitted", label: "Submitted" },
    { value: "in_review", label: "In Review" },
    { value: "approved", label: "Approved" },
    { value: "rejected", label: "Rejected" },
];

const AdminDashboard = () => {
    const navigate = useNavigate();
    const { logout } = useAuth();
    const [applications, setApplications] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedApp, setSelectedApp] = useState(null);
    const [showModal, setShowModal] = useState(false);
    const [updatingStatus, setUpdatingStatus] = useState(false);
    const [filters, setFilters] = useState({
        status: "",
        service: "",
    });

    const fetchApplications = async () => {
        setLoading(true);
        try {
            const data = await applicationService.listAllApplications({
                status: filters.status || undefined,
                service: filters.service || undefined,
            });
            setApplications(data || []);
        } catch (err) {
            toast.error("Failed to load applications");
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchApplications();
    }, [filters]);

    const handleLogout = async () => {
        try {
            const result = await logout();
            if (result.success) {
                toast.success("Logged out successfully");
                navigate("/", { replace: true });
            } else {
                toast.error(result.error?.message || "Failed to logout");
            }
        } catch (error) {
            toast.error("An error occurred during logout");
        }
    };

    const handleViewDetails = async (appId) => {
        try {
            const app = await applicationService.getApplicationById(appId);
            setSelectedApp(app);
            setShowModal(true);
        } catch (err) {
            toast.error("Failed to load application details");
        }
    };

    const handleUpdateStatus = async (newStatus) => {
        if (!selectedApp) return;
        setUpdatingStatus(true);
        try {
            await toast.promise(
                applicationService.updateApplicationStatus(selectedApp.id, newStatus),
                {
                    loading: "Updating status...",
                    success: "Status updated successfully",
                    error: (err) => err?.message || "Failed to update status",
                }
            );
            await fetchApplications();
            const updatedApp = await applicationService.getApplicationById(selectedApp.id);
            setSelectedApp(updatedApp);
        } catch (err) {
            // Error handled by toast
        } finally {
            setUpdatingStatus(false);
        }
    };

    const getStatusColor = (status) => {
        const colors = {
            submitted: "bg-blue-100 text-blue-800 border-blue-200",
            in_review: "bg-yellow-100 text-yellow-800 border-yellow-200",
            approved: "bg-green-100 text-green-800 border-green-200",
            rejected: "bg-red-100 text-red-800 border-red-200",
        };
        return colors[status] || "bg-gray-100 text-gray-800 border-gray-200";
    };

    const getServiceLabel = (serviceValue) => {
        return servicesOffered.find((s) => s.value === serviceValue)?.label || serviceValue;
    };

    return (
        <div className="min-h-screen bg-gray-50">
            <div className="container mx-auto px-4 py-8">
                <div className="flex items-center justify-between mb-6">
                    <h1 className="text-3xl font-bold text-nepal-darkBlue">
                        Service Provider Dashboard
                    </h1>
                    <button
                        onClick={handleLogout}
                        className="bg-red-600 text-white font-medium py-2 px-4 rounded-lg hover:bg-red-700 transition"
                    >
                        Logout
                    </button>
                </div>

                {/* Filters */}
                <div className="bg-white rounded-lg shadow-md p-4 mb-6">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Filter by Status
                            </label>
                            <select
                                value={filters.status}
                                onChange={(e) =>
                                    setFilters({ ...filters, status: e.target.value })
                                }
                                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-nepal-blue"
                            >
                                {statusOptions.map((opt) => (
                                    <option key={opt.value} value={opt.value}>
                                        {opt.label}
                                    </option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Filter by Service
                            </label>
                            <select
                                value={filters.service}
                                onChange={(e) =>
                                    setFilters({ ...filters, service: e.target.value })
                                }
                                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-nepal-blue"
                            >
                                <option value="">All Services</option>
                                {servicesOffered.map((s) => (
                                    <option key={s.value} value={s.value}>
                                        {s.label}
                                    </option>
                                ))}
                            </select>
                        </div>
                        <div className="flex items-end">
                            <button
                                onClick={() => setFilters({ status: "", service: "" })}
                                className="w-full bg-gray-200 text-gray-700 font-medium py-2 px-4 rounded-lg hover:bg-gray-300 transition"
                            >
                                Clear Filters
                            </button>
                        </div>
                    </div>
                </div>

                {/* Applications Table */}
                <div className="bg-white rounded-lg shadow-md overflow-hidden">
                    <div className="px-6 py-4 border-b border-gray-200">
                        <h2 className="text-xl font-semibold text-nepal-darkBlue">
                            Applications ({applications.length})
                        </h2>
                    </div>
                    {loading ? (
                        <div className="p-8 text-center text-gray-600">Loading...</div>
                    ) : applications.length === 0 ? (
                        <div className="p-8 text-center text-gray-600">
                            No applications found.
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-gray-200">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Service
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Applicant Name
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Email
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Submitted
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Status
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Actions
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-200">
                                    {applications.map((app) => (
                                        <tr key={app.id} className="hover:bg-gray-50">
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-800">
                                                {getServiceLabel(app.service)}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-800">
                                                {app.full_name}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                                                {app.email}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                                                {app.created_at
                                                    ? new Date(app.created_at).toLocaleDateString()
                                                    : "—"}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <span
                                                    className={`inline-flex items-center px-2.5 py-0.5 rounded text-xs font-medium border ${getStatusColor(
                                                        app.status
                                                    )}`}
                                                >
                                                    {app.status}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm">
                                                <button
                                                    onClick={() => handleViewDetails(app.id)}
                                                    className="text-nepal-blue hover:text-blue-700 font-medium"
                                                >
                                                    View Details
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            </div>

            {/* Application Details Modal */}
            {showModal && selectedApp && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
                    <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
                        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
                            <h2 className="text-2xl font-bold text-nepal-darkBlue">
                                Application Details
                            </h2>
                            <button
                                onClick={() => setShowModal(false)}
                                className="text-gray-500 hover:text-gray-700 text-2xl"
                            >
                                ×
                            </button>
                        </div>
                        <div className="p-6 space-y-6">
                            {/* Status and Actions */}
                            <div className="flex items-center justify-between">
                                <div>
                                    <span className="text-sm text-gray-600">Status:</span>
                                    <span
                                        className={`ml-2 inline-flex items-center px-3 py-1 rounded text-sm font-medium border ${getStatusColor(
                                            selectedApp.status
                                        )}`}
                                    >
                                        {selectedApp.status}
                                    </span>
                                </div>
                                <div className="flex gap-2">
                                    {selectedApp.status === "submitted" && (
                                        <>
                                            <button
                                                onClick={() => handleUpdateStatus("in_review")}
                                                disabled={updatingStatus}
                                                className="bg-yellow-600 text-white px-4 py-2 rounded-lg hover:bg-yellow-700 transition disabled:opacity-50"
                                            >
                                                Mark In Review
                                            </button>
                                            <button
                                                onClick={() => handleUpdateStatus("approved")}
                                                disabled={updatingStatus}
                                                className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition disabled:opacity-50"
                                            >
                                                Approve
                                            </button>
                                            <button
                                                onClick={() => handleUpdateStatus("rejected")}
                                                disabled={updatingStatus}
                                                className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition disabled:opacity-50"
                                            >
                                                Reject
                                            </button>
                                        </>
                                    )}
                                    {selectedApp.status === "in_review" && (
                                        <>
                                            <button
                                                onClick={() => handleUpdateStatus("approved")}
                                                disabled={updatingStatus}
                                                className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition disabled:opacity-50"
                                            >
                                                Approve
                                            </button>
                                            <button
                                                onClick={() => handleUpdateStatus("rejected")}
                                                disabled={updatingStatus}
                                                className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition disabled:opacity-50"
                                            >
                                                Reject
                                            </button>
                                        </>
                                    )}
                                </div>
                            </div>

                            {/* Application Information */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">
                                        Service
                                    </label>
                                    <p className="mt-1 text-sm text-gray-900">
                                        {getServiceLabel(selectedApp.service)}
                                    </p>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">
                                        Full Name
                                    </label>
                                    <p className="mt-1 text-sm text-gray-900">
                                        {selectedApp.full_name}
                                    </p>
                                    {selectedApp.full_name_np && (
                                        <p className="mt-1 text-sm text-gray-600">
                                            {selectedApp.full_name_np}
                                        </p>
                                    )}
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">
                                        Date of Birth (AD)
                                    </label>
                                    <p className="mt-1 text-sm text-gray-900">
                                        {selectedApp.date_of_birth || "—"}
                                    </p>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">
                                        Date of Birth (BS)
                                    </label>
                                    <p className="mt-1 text-sm text-gray-900">
                                        {selectedApp.date_of_birth_bs || "—"}
                                    </p>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">
                                        Citizenship Number
                                    </label>
                                    <p className="mt-1 text-sm text-gray-900">
                                        {selectedApp.citizenship_number}
                                    </p>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">
                                        Email
                                    </label>
                                    <p className="mt-1 text-sm text-gray-900">
                                        {selectedApp.email}
                                    </p>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">
                                        Phone
                                    </label>
                                    <p className="mt-1 text-sm text-gray-900">
                                        {selectedApp.phone}
                                    </p>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">
                                        Address
                                    </label>
                                    <p className="mt-1 text-sm text-gray-900">
                                        {selectedApp.address}
                                    </p>
                                </div>
                                {selectedApp.father_name && (
                                    <>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700">
                                                Father's Name
                                            </label>
                                            <p className="mt-1 text-sm text-gray-900">
                                                {selectedApp.father_name}
                                            </p>
                                            {selectedApp.father_name_np && (
                                                <p className="mt-1 text-sm text-gray-600">
                                                    {selectedApp.father_name_np}
                                                </p>
                                            )}
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700">
                                                Mother's Name
                                            </label>
                                            <p className="mt-1 text-sm text-gray-900">
                                                {selectedApp.mother_name}
                                            </p>
                                            {selectedApp.mother_name_np && (
                                                <p className="mt-1 text-sm text-gray-600">
                                                    {selectedApp.mother_name_np}
                                                </p>
                                            )}
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700">
                                                Grandfather's Name
                                            </label>
                                            <p className="mt-1 text-sm text-gray-900">
                                                {selectedApp.grandfather_name}
                                            </p>
                                            {selectedApp.grandfather_name_np && (
                                                <p className="mt-1 text-sm text-gray-600">
                                                    {selectedApp.grandfather_name_np}
                                                </p>
                                            )}
                                        </div>
                                    </>
                                )}
                            </div>

                            {/* Citizenship Images */}
                            {(selectedApp.citizenship_front_url ||
                                selectedApp.citizenship_back_url) && (
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Citizenship Documents
                                    </label>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        {selectedApp.citizenship_front_url && (
                                            <div>
                                                <p className="text-sm text-gray-600 mb-2">Front</p>
                                                <a
                                                    href={selectedApp.citizenship_front_url}
                                                    target="_blank"
                                                    rel="noreferrer"
                                                    className="block"
                                                >
                                                    <img
                                                        src={selectedApp.citizenship_front_url}
                                                        alt="Citizenship Front"
                                                        className="w-full h-64 object-contain border border-gray-300 rounded-lg"
                                                    />
                                                </a>
                                            </div>
                                        )}
                                        {selectedApp.citizenship_back_url && (
                                            <div>
                                                <p className="text-sm text-gray-600 mb-2">Back</p>
                                                <a
                                                    href={selectedApp.citizenship_back_url}
                                                    target="_blank"
                                                    rel="noreferrer"
                                                    className="block"
                                                >
                                                    <img
                                                        src={selectedApp.citizenship_back_url}
                                                        alt="Citizenship Back"
                                                        className="w-full h-64 object-contain border border-gray-300 rounded-lg"
                                                    />
                                                </a>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}

                            {/* Timestamps */}
                            <div className="pt-4 border-t border-gray-200">
                                <div className="grid grid-cols-2 gap-4 text-sm">
                                    <div>
                                        <span className="text-gray-600">Submitted:</span>
                                        <span className="ml-2 text-gray-900">
                                            {selectedApp.created_at
                                                ? new Date(selectedApp.created_at).toLocaleString()
                                                : "—"}
                                        </span>
                                    </div>
                                    {selectedApp.processed_at && (
                                        <div>
                                            <span className="text-gray-600">Processed:</span>
                                            <span className="ml-2 text-gray-900">
                                                {new Date(
                                                    selectedApp.processed_at
                                                ).toLocaleString()}
                                            </span>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AdminDashboard;
