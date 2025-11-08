import React from "react";
import govLogo from "../assets/govlogo.png";

const Header = () => {
    return (
        <header className="bg-white border-b border-gray-200">
            <div className="gov-ribbon" />
            <div className="container mx-auto px-4 py-3 flex items-center gap-3 md:gap-4">
                <img
                    src={govLogo}
                    alt="नेपाल सरकार / Government of Nepal"
                    className="w-12 h-12 md:w-14 md:h-14"
                />
                <div className="leading-tight">
                    <p className="text-sm md:text-base text-gray-600">नेपाल सरकार</p>
                    <h1 className="text-xl md:text-2xl gov-title">Government of Nepal</h1>
                    <p className="text-sm md:text-base text-gray-700">नेपाल सेवा केन्द्र • Nepal Seva Kendra</p>
                </div>
            </div>
        </header>
    );
};

export default Header;
