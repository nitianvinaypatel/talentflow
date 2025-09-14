import { Moon, Sun } from "lucide-react";

import { Button } from "@/components/ui/button";
import { useTheme } from "@/lib/use-theme";

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();

  const toggleTheme = () => {
    switch (theme) {
      case "light":
        setTheme("dark");
        break;
      case "dark":
        setTheme("light");
        break;
      case "system":
        setTheme("light");
        break;
      default:
        setTheme("dark");
        break;
    }
  };

  const getIcon = () => {
    switch (theme) {
      case "light":
        return <Sun className="h-4 w-4 transition-all" />;
      case "dark":
        return <Moon className="h-4 w-4 transition-all" />;
      case "system":
        return <Sun className="h-4 w-4 transition-all" />;
      default:
        return <Sun className="h-4 w-4 transition-all" />;
    }
  };

  const getTooltip = () => {
    switch (theme) {
      case "light":
        return "Switch to dark mode";
      case "dark":
        return "Switch to light mode";
      case "system":
        return "Switch to dark mode";
      default:
        return "Toggle theme";
    }
  };

  return (
    <Button
      variant="ghost"
      size="icon"
      className="h-8 w-8"
      onClick={toggleTheme}
      title={getTooltip()}
    >
      {getIcon()}
      <span className="sr-only">{getTooltip()}</span>
    </Button>
  );
}
