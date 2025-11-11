import { createContext } from "react";

// Separate file for the raw context value to keep component file free of non-component exports
export const AuthContext = createContext(null);

export default AuthContext;
