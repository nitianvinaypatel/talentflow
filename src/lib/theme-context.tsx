import * as React from "react";

export type Theme = "dark" | "light" | "system";

export type ThemeContextProps = {
  theme: Theme;
  setTheme: (theme: Theme) => void;
};

export const ThemeContext = React.createContext<ThemeContextProps | undefined>(
  undefined
);
