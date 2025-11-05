import React from "react";
import "./index.css";
import Landing from "./pages/Landing";
import Footer from "./components/Footer";
import Header from "./components/Header";
import { AuthProvider } from "./context/AuthContext";

const App = () => {
    return (
        <div>
            <AuthProvider>
                <Header />
                <Landing />
                <Footer />
            </AuthProvider>
        </div>
    );
};

export default App;
