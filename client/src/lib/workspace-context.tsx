import { createContext, useContext, useState, useEffect } from "react";
import type { Workspace } from "@shared/schema";

type WorkspaceContextType = {
  currentWorkspace: Workspace | null;
  setCurrentWorkspace: (workspace: Workspace | null) => void;
  workspaces: Workspace[];
  setWorkspaces: (workspaces: Workspace[]) => void;
};

const WorkspaceContext = createContext<WorkspaceContextType | undefined>(undefined);

export function WorkspaceProvider({ children }: { children: React.ReactNode }) {
  const [currentWorkspace, setCurrentWorkspace] = useState<Workspace | null>(null);
  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);

  useEffect(() => {
    const savedWorkspaceId = localStorage.getItem("lifeflow-workspace");
    if (savedWorkspaceId && workspaces.length > 0) {
      const saved = workspaces.find(w => w.id === savedWorkspaceId);
      if (saved) {
        setCurrentWorkspace(saved);
      } else {
        setCurrentWorkspace(workspaces[0]);
      }
    } else if (workspaces.length > 0 && !currentWorkspace) {
      setCurrentWorkspace(workspaces[0]);
    }
  }, [workspaces]);

  const handleSetCurrentWorkspace = (workspace: Workspace | null) => {
    setCurrentWorkspace(workspace);
    if (workspace) {
      localStorage.setItem("lifeflow-workspace", workspace.id);
    }
  };

  return (
    <WorkspaceContext.Provider 
      value={{ 
        currentWorkspace, 
        setCurrentWorkspace: handleSetCurrentWorkspace, 
        workspaces, 
        setWorkspaces 
      }}
    >
      {children}
    </WorkspaceContext.Provider>
  );
}

export const useWorkspace = () => {
  const context = useContext(WorkspaceContext);
  if (context === undefined) {
    throw new Error("useWorkspace must be used within a WorkspaceProvider");
  }
  return context;
};
