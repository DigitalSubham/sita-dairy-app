// context/AppContext.tsx

import { createContext, useContext } from "react";

type AppContextType = {
  userData: any;
  setUserData: (data: any) => void;
};

export const AppContext = createContext<AppContextType>({
  userData: null,
  setUserData: () => {},
});

export const AppContextProvider = AppContext.Provider;

export const useAppContext = () => useContext(AppContext);
