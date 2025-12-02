import React from "react";
import RightDrawer from "./RightDrawer";
import LogsViewer from "./LogsViewer";

interface LogsDrawerProps {
  open: boolean;
  onClose: () => void;
  lockId?: number;
  lockName?: string;
}

const LogsDrawer: React.FC<LogsDrawerProps> = ({ open, onClose, lockId, lockName }) => {
  const title = lockId && lockName
    ? `Logs - ${lockName}`
    : "History of Scans";

  return (
    <RightDrawer
      open={open}
      onClose={onClose}
      title={title}
      width={600}
    >
      <LogsViewer lockId={lockId} />
    </RightDrawer>
  );
};

export default LogsDrawer;
