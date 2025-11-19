import React from "react";
import RightDrawer from "./RightDrawer";
import LogsViewer from "./LogsViewer";

interface LogsDrawerProps {
  open: boolean;
  onClose: () => void;
}

const LogsDrawer: React.FC<LogsDrawerProps> = ({ open, onClose }) => {
  return (
    <RightDrawer
      open={open}
      onClose={onClose}
      title="Historique des Scans"
      width={600}
    >
      <LogsViewer />
    </RightDrawer>
  );
};

export default LogsDrawer;
