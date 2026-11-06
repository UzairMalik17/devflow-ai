"use client";
import { createContext, useContext, useState } from "react";

type RepositoryRefreshContextType = {
  repositoryRefreshKey: number;
  notifyRepositoryAdded: () => void;
};

const RepositoryRefreshContext = createContext<
  RepositoryRefreshContextType | undefined
>(undefined);

export const RepositoryRefreshProvider = ({
  children,
}: {
  children: React.ReactNode;
}) => {
  const [repositoryRefreshKey, setRepositoryRefreshKey] = useState(0);

  const notifyRepositoryAdded = () => {
    setRepositoryRefreshKey((prev) => prev + 1);
  };

  return (
    <RepositoryRefreshContext.Provider
      value={{ repositoryRefreshKey, notifyRepositoryAdded }}
    >
      {children}
    </RepositoryRefreshContext.Provider>
  );
};

export const useRepositoryRefresh = () => {
  const context = useContext(RepositoryRefreshContext);
  if (!context) {
    throw new Error(
      "useRepositoryRefresh must be used within a RepositoryRefreshProvider",
    );
  }
  return context;
};
