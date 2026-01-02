import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  PropsWithChildren,
} from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { BasicAuth } from "types";

// Create a context
const AppContext = createContext({
  serverUrl: "",
  basicAuth: { required: false } as BasicAuth,
  mtlsRequired: false,
  isLoading: true,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  updateServerUrl: async (
    _url: string,
    _basicAuth: BasicAuth,
    _mtlsRequired: boolean,
  ) => {},
});

// Provider component
export const AppProvider = ({ children }: PropsWithChildren) => {
  const [serverUrl, setServerUrl] = useState("");
  const [basicAuth, setBasicAuth] = useState({ required: false });
  const [mtlsRequired, setMtlsRequired] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Load the URL from AsyncStorage on startup
  useEffect(() => {
    const loadServerUrl = async () => {
      const url = await AsyncStorage.getItem("serverUrl");
      setServerUrl(url || "");

      const basicAuthJson = await AsyncStorage.getItem("basicAuth");
      if (basicAuthJson) {
        setBasicAuth(JSON.parse(basicAuthJson));
      } else {
        setBasicAuth({ required: false });
      }

      const mtlsRequiredValue = await AsyncStorage.getItem("mtlsRequired");
      setMtlsRequired(mtlsRequiredValue === "true");

      setIsLoading(false);
    };

    loadServerUrl();
  }, []);

  const updateServerUrl = async (
    url: string,
    basicAuth: BasicAuth,
    nextMtlsRequired: boolean,
  ) => {
    setBasicAuth(basicAuth);
    await AsyncStorage.setItem("basicAuth", JSON.stringify(basicAuth));
    setMtlsRequired(nextMtlsRequired);
    await AsyncStorage.setItem("mtlsRequired", String(nextMtlsRequired));
    setServerUrl(url);
    await AsyncStorage.setItem("serverUrl", url);
  };

  return (
    <AppContext.Provider
      value={{
        serverUrl,
        basicAuth,
        mtlsRequired,
        isLoading,
        updateServerUrl,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useAppContext = () => useContext(AppContext);
