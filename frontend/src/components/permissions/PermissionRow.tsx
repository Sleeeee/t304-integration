import React from "react";
import { Check, ExpandMore } from '@mui/icons-material';
import { CircularProgress } from '@mui/material';

// Couleur contrastée (Ratio > 4.5:1)
const ACCESSIBLE_BLUE = "#2A4AE5";

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
        ? 'bg-slate-100' // La bordure est gérée via style pour la couleur exacte
        : 'hover:bg-slate-50'
        }`}
      // Applique la bordure bleue accessible si sélectionné
      style={selected ? { borderLeft: `4px solid ${ACCESSIBLE_BLUE}` } : {}}
      // Si la ligne entière est cliquable (hors bouton expand), on devrait ajouter role="button" ici
      // Pour l'instant, on suppose que c'est une ligne d'affichage.
    >
      {expandable && (
        <button
          onClick={onExpand}
          className="flex items-center justify-center cursor-pointer text-slate-500 hover:text-slate-700 transition" // Slate-500 est plus contrasté que 400
          disabled={isLoading}
          // ACCESSIBILITÉ: Indique l'état (ouvert/fermé) au lecteur d'écran
          aria-expanded={!collapsed}
          // ACCESSIBILITÉ: Label explicite
          aria-label={collapsed ? `Expand ${label}` : `Collapse ${label}`}
        >
          {isLoading ? (
            <CircularProgress size={16} aria-label="Loading" />
          ) : (
            <ExpandMore
              fontSize="small"
              aria-hidden="true" // Icône décorative
              sx={{
                transform: collapsed ? 'rotate(0deg)' : 'rotate(-90deg)',
                transition: 'transform 0.2s'
              }}
            />
          )}
        </button>
      )}
      
      {/* Espaceur si non extensible */}
      {!expandable && <span className="w-4" aria-hidden="true"></span>}
      
      <span className="text-sm text-slate-700 flex-1 font-medium">
        {label}
      </span>
      
      {selected && (
        <Check 
          fontSize="small" 
          aria-hidden="true" // L'état sélectionné est déjà visuellement clair par le fond/bordure
          sx={{ color: ACCESSIBLE_BLUE }} 
        />
      )}
    </div>
  );
};

export default PermissionRow;