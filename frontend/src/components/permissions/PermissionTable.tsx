import React, { useEffect, useState, FC } from 'react';
import { Accordion, AccordionSummary, AccordionDetails, Button, ButtonGroup, Typography } from '@mui/material';
import { ExpandMore, CheckCircle, Cancel } from '@mui/icons-material';
import CustomSnackbar from '../CustomSnackbar';
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

  const [snackbar, setSnackbar] = useState({
    isError: false,
    text: "",
  });

  const [users, setUsers] = useState([]);
  const [locks, setLocks] = useState([]);
  const [permissions, setPermissions] = useState([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch users, locks, and all permissions in parallel
        const [usersRes, locksRes, permissionsRes] = await Promise.all([
          fetch(`${process.env.REACT_APP_BACKEND_URL}/users/`, {
            method: "GET",
            credentials: "include"
          }),
          fetch(`${process.env.REACT_APP_BACKEND_URL}/locks/`, {
            method: "GET",
            credentials: "include"
          }),
          fetch(`${process.env.REACT_APP_BACKEND_URL}/permissions/?type=all`, {
            method: "GET",
            credentials: "include"
          })
        ]);

        const usersJson = await usersRes.json();
        const locksJson = await locksRes.json();
        const permissionsJson = await permissionsRes.json();

        const transformedUsers = usersJson.users.map((user: any) => ({
          ...user,
          name: user.username
        }));

        const transformedLocks = locksJson.locks.map((lock: any) => ({
          ...lock,
          id: lock.id_lock
        }));

        setUsers(transformedUsers);
        setLocks(transformedLocks);
        setPermissions(permissionsJson);
      } catch (error) {
        setSnackbar({
          isError: true,
          text: `Error fetching data: ${error}`,
        });
      }
    };
    fetchData();
  }, []);

  // Helper function to check if a user has permission for a lock
  const hasPermission = (userId: number, lockId: number): boolean => {
    return permissions.some((perm: any) =>
      perm.user !== null && perm.lock !== null &&
      perm.user === userId && perm.lock === lockId
    );
  };

  // Helper function to check if a group has permission for a lock
  const hasGroupPermission = (groupId: number, lockId: number): boolean => {
    return permissions.some((perm: any) =>
      perm.group !== null && perm.lock !== null &&
      perm.group === groupId && perm.lock === lockId
    );
  };

  // Helper function to check if a user has permission for a lock group
  const hasPermissionToLockGroup = (userId: number, lockGroupId: number): boolean => {
    return permissions.some((perm: any) =>
      perm.user !== null && perm.lock_group !== null &&
      perm.user === userId && perm.lock_group === lockGroupId
    );
  };

  // Helper function to check if a group has permission for a lock group
  const hasGroupPermissionToLockGroup = (groupId: number, lockGroupId: number): boolean => {
    return permissions.some((perm: any) =>
      perm.group !== null && perm.lock_group !== null &&
      perm.group === groupId && perm.lock_group === lockGroupId
    );
  };

  const userGroups = [
    { id: 1, name: "IT" },
    { id: 2, name: "PROD" },
    { id: 3, name: "MAINTENANCE" }
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

  // Get the selected item
  const selectedItem = dataMap[mode][selected.type][selected.index];
  const selectedItemId = selectedItem?.id;

  return (
    <main className="px-8 py-8 max-w-7xl mx-auto">
      <CustomSnackbar
        isError={snackbar?.isError}
        text={snackbar?.text}
        onClose={() => { setSnackbar({ isError: snackbar?.isError || false, text: "" }); }}
      />

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
                      {Array.isArray(items) && items.map((item, index) => (
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
              {`Assign permissions to ${mode === 'locks' ? 'Lock' : 'User'}${selected.type === 'group' ? ' Group' : ''} ${selectedItem?.name || 'N/A'}`}
            </h2>

            <div className="grid grid-cols-2 gap-8 mb-8">
              {Object.entries(dataMap[otherMode]).map(([categoryKey, items]) => (
                <div key={categoryKey} className="mb-8">
                  <h3 className="text-sm font-bold text-slate-900 text-center mb-6 uppercase tracking-wide">
                    {categoryKey === "individual" ? `INDIVIDUAL ${otherMode.toUpperCase()}` : `${otherMode.substring(0, otherMode.length - 1).toUpperCase()} GROUPS`}
                  </h3>
                  {Array.isArray(items) && items.map(item => {
                    let hasAccess = false;

                    // Determine permission status based on mode and selection type
                    if (mode === 'locks' && selected.type === 'individual') {
                      // Viewing a specific lock - check which users/groups have access
                      hasAccess = categoryKey === 'individual'
                        ? hasPermission(item.id, selectedItemId)
                        : hasGroupPermission(item.id, selectedItemId);
                    } else if (mode === 'users' && selected.type === 'individual') {
                      // Viewing a specific user - check which locks/lock groups they have access to
                      hasAccess = categoryKey === 'individual'
                        ? hasPermission(selectedItemId, item.id)
                        : hasPermissionToLockGroup(selectedItemId, item.id);
                    } else if (mode === 'locks' && selected.type === 'group') {
                      // Viewing a specific lock group - check which users/groups have access
                      hasAccess = categoryKey === 'individual'
                        ? hasPermissionToLockGroup(item.id, selectedItemId)
                        : hasGroupPermissionToLockGroup(item.id, selectedItemId);
                    } else if (mode === 'users' && selected.type === 'group') {
                      // Viewing a specific user group - check which locks/lock groups they have access to
                      hasAccess = categoryKey === 'individual'
                        ? hasGroupPermission(item.id, selectedItemId)
                        : hasGroupPermissionToLockGroup(item.id, selectedItemId);
                    }

                    return (
                      <div key={item.id || item.name} className="flex items-center justify-between mb-3 p-2 hover:bg-slate-50 rounded">
                        <PermissionRow label={item.name} expandable={categoryKey === "group"} collapsed={false} />
                        <div className="ml-auto">
                          {hasAccess ? (
                            <CheckCircle sx={{ color: 'green', fontSize: 24 }} />
                          ) : (
                            <Cancel sx={{ color: 'lightgray', fontSize: 24 }} />
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              ))}
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
