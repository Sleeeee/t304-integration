import React from "react";
import { Check, ExpandMore } from '@mui/icons-material';
import { CircularProgress } from '@mui/material';

interface PermissionRowProps {
  label: string;
  expandable?: boolean;
  collapsed?: boolean;
  selected?: boolean;
  isLoading?: boolean;
  onExpand?: () => void;
}

const PermissionRow = ({ label, expandable, collapsed, selected, isLoading, onExpand }: PermissionRowProps) => {
  return (
    <div
      className={`flex items-center gap-3 py-2 px-4 rounded transition ${selected
        ? 'bg-slate-100 border-l-4 border-blue-600'
        : 'hover:bg-slate-50'
        }`}
    >
      {expandable && (
        <button
          onClick={onExpand}
          className="flex items-center justify-center cursor-pointer text-slate-400 hover:text-slate-600 transition"
          disabled={isLoading}
        >
          {isLoading ? (
            <CircularProgress size={16} />
          ) : (
            <ExpandMore
              fontSize="small"
              sx={{
                transform: collapsed ? 'rotate(0deg)' : 'rotate(-90deg)',
                transition: 'transform 0.2s'
              }}
            />
          )}
        </button>
      )}
      {!expandable && <span className="text-slate-300 w-4"></span>}
      <span className="text-sm text-slate-700 flex-1">{label}</span>
      {selected && (
        <Check fontSize="small" className="text-blue-600" />
      )}
    </div>
  );
};

export default PermissionRow;
