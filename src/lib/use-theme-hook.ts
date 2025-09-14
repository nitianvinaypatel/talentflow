import * as React from "react";

// This context needs to match the one in use-theme.tsx
// In a real application, you would share this through a separate context file
const ThemeContext = React.createContext<{
  theme: "dark" | "light" | "system";
  setTheme: (theme: "dark" | "light" | "system") => void;
} | undefined>(undefined);

export const useTheme = () => {
  const context = React.useContext(ThemeContext);

  if (context === undefined)
    throw new Error("useTheme must be used within a ThemeProvider");

  return context;
};
