import React from "react";
import RightDrawer from "./RightDrawer";
import LogsViewer from "./LogsViewer";

interface LogsDrawerProps {
  open: boolean;
  onClose: () => void;
  lockId?: number;
  lockName?: string;
  userId?: number;    
  userName?: string;
}

const LogsDrawer: React.FC<LogsDrawerProps> = ({ 
  open, 
  onClose, 
  lockId, 
  lockName,
  userId,    
  userName 
}) => {


  let title = "History of Scans";
  
  if (lockId && lockName) {
    title = `Logs - ${lockName}`;
  } else if (userId && userName) { 
    title = `Logs - ${userName}`;
  }

  return (
    <RightDrawer
      open={open}
      onClose={onClose}
      title={title}
      width={600}
    >

      <LogsViewer lockId={lockId} userId={userId} /> 
    </RightDrawer>
  );
};

export default LogsDrawer;