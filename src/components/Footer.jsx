import React from "react";

const Footer = () => {
    return (
        <footer className="mt-12 border-t border-gray-200 bg-white">
            <div className="container mx-auto px-4 py-6 text-center text-sm text-gray-600">
                <p className="mb-1">
                    © {new Date().getFullYear()} Nepal Seva Kendra
                </p>
                <p className="mb-1">नेपाल सरकार • Government of Nepal</p>
                <p className="mb-2 text-red-500 italic font-semibold">
                    Developed by: Ronish, Devraj and Nayan as a group project
                    for E-governance
                </p>
                <div className="flex items-center justify-center gap-4 text-xs text-gray-500">
                    <a href="#" className="hover:text-nepal-blue">
                        Privacy
                    </a>
                    <span>•</span>
                    <a href="#" className="hover:text-nepal-blue">
                        Terms
                    </a>
                    <span>•</span>
                    <a href="#" className="hover:text-nepal-blue">
                        Help
                    </a>
                </div>
            </div>
        </footer>
    );
};

export default Footer;
