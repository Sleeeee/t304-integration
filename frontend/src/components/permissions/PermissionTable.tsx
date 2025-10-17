import React, { useState, FC } from 'react';
import { Accordion, AccordionSummary, AccordionDetails, Button, ButtonGroup, Typography } from '@mui/material';
import { ExpandMore } from '@mui/icons-material';
import PermissionRow from './PermissionRow';

type Mode = 'locks' | 'users';
type SelectionType = 'individual' | 'group';

const PermissionTable: FC = () => {
  const [mode, setMode] = useState<Mode>('locks');
  const otherMode = mode === "locks" ? "users" : "locks";

  const [selected, setSelected] = useState<{
    type: SelectionType;
    index: number;
  }>({
    type: "group",
    index: 0
  });

  const toggleMode = () => {
    setMode(mode === 'locks' ? 'users' : 'locks');
  };

  const users = [
    { id: 1, name: "John" },
    { id: 2, name: "Maria" },
    { id: 3, name: "Lili" },
    { id: 4, name: "Mathéo" }
  ];

  const userGroups = [
    { id: 1, name: "IT" },
    { id: 2, name: "PROD" },
    { id: 3, name: "MAINTENANCE" }
  ];

  const locks = [
    { id: 1, name: "Front door" },
    { id: 2, name: "Vault door" },
    { id: 3, name: "Server room" }
  ];

  const lockGroups = [
    { id: 1, name: "FIRST FLOOR" },
    { id: 2, name: "SERVERS" },
    { id: 3, name: "OUTSIDE" }
  ];

  const dataMap = {
    users: {
      group: userGroups,
      individual: users
    },
    locks: {
      group: lockGroups,
      individual: locks
    }
  };

  return (
    <main className="px-8 py-8 max-w-7xl mx-auto">
      {/* Mode Toggle Button */}
      <div className="flex justify-end mb-8">
        <Button
          variant="outlined"
          onClick={toggleMode}
        >
          SWITCH TO {mode === 'locks' ? 'USER' : 'LOCK'} EDITING MODE
        </Button>
      </div>

      <div className="grid grid-cols-3 gap-8">
        {/* Left Sidebar - Search */}
        <div className="col-span-1">
          <div className="bg-white rounded-lg shadow p-6 sticky top-24">
            <h3 className="text-sm font-semibold text-slate-700 mb-4">
              {mode === 'locks' ? 'Search lock or group' : 'Search user or group'}
            </h3>
            <input
              type="text"
              placeholder="Name, group, ..."
              className="w-full px-4 py-2 border border-slate-300 rounded mb-6 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />

            <div className="space-y-2 text-sm">
              {Object.entries(dataMap[mode]).map(([categoryKey, items]) => (
                <Accordion defaultExpanded key={categoryKey}>
                  <AccordionSummary expandIcon={<ExpandMore />}>
                    <Typography variant="h6">
                      {categoryKey === "group"
                        ? `${mode === "locks" ? "Lock" : "User"} Groups`
                        : mode === "locks"
                          ? "Locks"
                          : "Users"}
                    </Typography>
                  </AccordionSummary>
                  <AccordionDetails>
                    <ButtonGroup orientation="vertical" variant="text" className="w-full">
                      {items.map((item, index) => (
                        <Button
                          key={item.id || item.name}
                          onClick={() => { setSelected({ type: categoryKey as SelectionType, index }) }}
                          sx={{ color: "text.secondary", fontWeight: 500 }}
                        >
                          {item.name}
                        </Button>
                      ))}
                    </ButtonGroup>
                  </AccordionDetails>
                </Accordion>
              ))}
            </div>
          </div>
        </div>

        {/* Right Content - Main Table */}
        <div className="col-span-2">
          <div className="bg-white rounded-lg shadow p-8">
            <h2 className="text-lg font-semibold text-slate-900 mb-8">
              {`Assign permissions to ${mode === 'locks' ? 'Lock' : 'User'}${selected.type === 'group' ? ' Group' : ''} ${dataMap[mode][selected.type][selected.index].name}`}
            </h2>


            <div className="grid grid-cols-2 gap-8 mb-8">
              <>
                {Object.entries(dataMap[otherMode]).map(([categoryKey, items]) => (
                  <div key={categoryKey} className="mb-8">
                    <h3 className="text-sm font-bold text-slate-900 text-center mb-6 uppercase tracking-wide">
                      {categoryKey === "individual" ? `INDIVIDUAL ${otherMode.toUpperCase()}` : `${otherMode.substring(0, otherMode.length - 1).toUpperCase()} GROUPS`}
                    </h3>
                    {items.map(item => (
                      <PermissionRow label={item.name} expandable={categoryKey === "group"} collapsed={false} />
                    ))}
                  </div>
                ))}
              </>
            </div>

            {/* Footer */}
            <div className="flex items-center justify-end pt-6 border-t border-slate-200 gap-10">
              <span className="text-md text-blue-500 font-bold">X to update</span>
              <Button variant="contained">
                SAVE
              </Button>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
};

export default PermissionTable;
