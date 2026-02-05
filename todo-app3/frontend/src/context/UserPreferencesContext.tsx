import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from "react";
import { ChatKitProvider } from "@chatkit/react";
import { optimizeAnimationForDevice } from "../utils/animation-utils";

// Define types
interface UserPreference {
  animationsEnabled: boolean;
  animationSpeed: number;
  motionSensitivity: "low" | "medium" | "high";
  colorTheme: string;
  avatarStyle: string;
}

interface UserPreferencesContextType {
  preferences: UserPreference;
  updatePreferences: (newPrefs: Partial<UserPreference>) => void;
  resetPreferences: () => void;
  isReducedMotion: boolean;
  shouldAnimate: boolean;
}

// Default preferences
const DEFAULT_PREFERENCES: UserPreference = {
  animationsEnabled: true,
  animationSpeed: 1,
  motionSensitivity: "medium",
  colorTheme: "light",
  avatarStyle: "default",
};

// Create context
const UserPreferencesContext =
  createContext<UserPreferencesContextType | undefined>(undefined);

// Provider component
export const UserPreferencesProvider: React.FC<{ children: ReactNode }> = ({
  children,
}) => {
  const [preferences, setPreferences] = useState<UserPreference>(
    DEFAULT_PREFERENCES
  );

  const [isReducedMotion, setIsReducedMotion] = useState(false);

  // ✅ Load preferences on client only
  useEffect(() => {
    const savedPrefs = localStorage.getItem("user-preferences");
    if (savedPrefs) {
      setPreferences(JSON.parse(savedPrefs));
    }
  }, []);

  // Check for reduced motion preference
  useEffect(() => {
    const mediaQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    setIsReducedMotion(mediaQuery.matches);

    const handleChange = (e: MediaQueryListEvent) => {
      setIsReducedMotion(e.matches);
    };

    mediaQuery.addEventListener("change", handleChange);
    return () => mediaQuery.removeEventListener("change", handleChange);
  }, []);

  // Persist preferences
  useEffect(() => {
    localStorage.setItem("user-preferences", JSON.stringify(preferences));
  }, [preferences]);

  const updatePreferences = (newPrefs: Partial<UserPreference>) => {
    setPreferences((prev) => ({ ...prev, ...newPrefs }));
  };

  const resetPreferences = () => {
    setPreferences(DEFAULT_PREFERENCES);
  };

  const shouldAnimate = (): boolean => {
    const perfData = optimizeAnimationForDevice();

    return (
      preferences.animationsEnabled &&
      !isReducedMotion &&
      !perfData.shouldOptimize
    );
  };

  const contextValue: UserPreferencesContextType = {
    preferences,
    updatePreferences,
    resetPreferences,
    isReducedMotion,
    shouldAnimate,
  };

  return (
    <ChatKitProvider
      publicKey="domain_pk_698410923bb0819590e60af8bbeee46a08c8da1bd8601a5b"
      domain="asultani-todo3.hf.space"
    >
      <UserPreferencesContext.Provider value={contextValue}>
        {children}
      </UserPreferencesContext.Provider>
    </ChatKitProvider>
  );
};

// Hook
export const useUserPreferences = (): UserPreferencesContextType => {
  const context = useContext(UserPreferencesContext);
  if (!context) {
    throw new Error(
      "useUserPreferences must be used within a UserPreferencesProvider"
    );
  }
  return context;
};

export default UserPreferencesContext;
