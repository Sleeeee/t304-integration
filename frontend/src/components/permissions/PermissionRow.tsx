import React from "react";
import { Check, Close, Visibility } from '@mui/icons-material';

interface PermissionRowProps {
  label: string;
  expandable?: boolean;
  collapsed?: boolean;
  selected?: boolean;
}

const PermissionRow = ({ label, expandable, collapsed, selected }: PermissionRowProps) => {
  return (
    <div
      className={`flex items-center gap-3 py-2 px-4 rounded transition ${selected
        ? 'bg-slate-100 border-l-4 border-blue-600'
        : 'hover:bg-slate-50'
        }`}
    >
      {expandable && (
        <span className="text-slate-400">
          {collapsed ? '▼' : '▶'}
        </span>
      )}
      {!expandable && <span className="text-slate-300 w-4"></span>}
      <span className="text-sm text-slate-700 flex-1">{label}</span>
      <Visibility fontSize="small" className="text-slate-400" />
      {selected && (
        <Check fontSize="small" className="text-blue-600" />
      )}
    </div>
  );

};

export default PermissionRow;
