import * as React from "react";
import { ThemeContext, type Theme } from "../lib/theme-context";

export function ThemeProvider({
  children,
  ...props
}: {
  children: React.ReactNode;
  defaultTheme?: Theme;
  storageKey?: string;
}) {
  // Force dark mode always
  const [theme] = React.useState<Theme>("dark");

  React.useEffect(() => {
    const root = window.document.documentElement;

    root.classList.remove("light", "dark");
    root.classList.add("dark");
  }, []);

  const value = {
    theme,
    setTheme: () => {
      // Do nothing - theme is always dark
    },
  };

  return (
    <ThemeContext.Provider {...props} value={value}>
      {children}
    </ThemeContext.Provider>
  );
}
