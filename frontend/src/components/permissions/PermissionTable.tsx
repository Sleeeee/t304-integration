import React, { useEffect, useState, FC } from 'react';
import { Accordion, AccordionSummary, AccordionDetails, Button, ButtonGroup, Typography, Tooltip, CircularProgress } from '@mui/material';
import { ExpandMore, CheckCircle, Cancel, Warning } from '@mui/icons-material';
import getCookie from '../../context/getCookie';
import CustomSnackbar from '../CustomSnackbar';
import PermissionRow from './PermissionRow';


type Mode = 'locks' | 'users';
type SelectionType = 'individual' | 'group';

interface Entity {
  id: number;
  name: string;
  [key: string]: any;
}

interface User extends Entity {
  username: string;
  id: number;
}

interface Lock extends Entity {
  id_lock: number;
}

interface Permission {
  user?: number;
  group?: number;
  lock?: number;
  lock_group?: number;
}

interface PermissionChanges {
  toAdd: Permission[];
  toRemove: Permission[];
}

// Types for the dynamic data mapping
type ItemCategory = 'individual' | 'group';
type DataMap = {
  [key in Mode]: {
    [key in ItemCategory]: Entity[];
  };
};

const getPermissionKey = (permissionObj: Permission): string => {
  // Ensure the keys are always in the same order for consistent stringification
  const keys: Array<keyof Permission> = ['user', 'group', 'lock', 'lock_group'];
  const orderedObj: { [k: string]: number } = {};
  keys.forEach(key => {
    // Only include keys that are defined and not null/undefined
    if (permissionObj.hasOwnProperty(key) && permissionObj[key] !== undefined && permissionObj[key] !== null) {
      const value = permissionObj[key]!;
      if (typeof value === 'number') {
        orderedObj[key] = value;
      }
    }
  });
  return JSON.stringify(orderedObj);
};

// --- MAIN COMPONENT ---
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

  const [snackbar, setSnackbar] = useState({
    isError: false,
    text: "",
  });

  const [users, setUsers] = useState<User[]>([]);
  const [locks, setLocks] = useState<Lock[]>([]);
  const [userGroups, setUserGroups] = useState<Entity[]>([]);
  const [permissions, setPermissions] = useState<Permission[]>([]);
  const [expandedGroups, setExpandedGroups] = useState<{ [key: string]: Entity[] }>({});
  const [loadingGroups, setLoadingGroups] = useState<Set<string>>(new Set());
  const [permissionChanges, setPermissionChanges] = useState<PermissionChanges>({ toAdd: [], toRemove: [] });

  const toggleMode = () => {
    setMode(prevMode => (prevMode === 'locks' ? 'users' : 'locks'));
    setSelected({ type: "group", index: 0 });
  };

  const lockGroups: Entity[] = [
    { id: 1, name: "FIRST FLOOR" },
    { id: 2, name: "SERVERS" },
    { id: 3, name: "OUTSIDE" }
  ];

  const dataMap: DataMap = {
    users: {
      group: userGroups,
      individual: users
    },
    locks: {
      group: lockGroups,
      individual: locks
    }
  };

  const selectedData = dataMap[mode];
  const selectedItem = selectedData[selected.type]?.[selected.index];
  const selectedItemId = selectedItem?.id;

  const otherData = dataMap[otherMode];

  const fetchData = async () => {
    try {
      const [usersRes, locksRes, userGroupsRes, permissionsRes] = await Promise.all([
        fetch(`${process.env.REACT_APP_BACKEND_URL}/users/`, { method: "GET", credentials: "include" }),
        fetch(`${process.env.REACT_APP_BACKEND_URL}/locks/`, { method: "GET", credentials: "include" }),
        fetch(`${process.env.REACT_APP_BACKEND_URL}/users/groups/`, { method: "GET", credentials: "include" }),
        fetch(`${process.env.REACT_APP_BACKEND_URL}/permissions/?type=all`, { method: "GET", credentials: "include" })
      ]);

      const usersJson = await usersRes.json();
      const locksJson = await locksRes.json();
      const userGroupsJson = await userGroupsRes.json();
      const permissionsJson = await permissionsRes.json();

      const transformedUsers: User[] = (usersJson.users || []).map((user: any) => ({
        ...user,
        name: user.username,
      }));

      const transformedLocks: Lock[] = (locksJson.locks || []).map((lock: any) => ({
        ...lock,
        name: lock.name || `Lock ${lock.id_lock}`,
        id: lock.id_lock
      }));

      setUsers(transformedUsers);
      setLocks(transformedLocks);
      setUserGroups(userGroupsJson.groups || []);
      setPermissions(permissionsJson || []);
      setExpandedGroups({}); // Reset expansion on full data refresh
    } catch (error) {
      setSnackbar({
        isError: true,
        text: `Error fetching initial data: ${error}`,
      });
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const getPermissionContext = (
    isEntitySelected: boolean,
    isEntityGroup: boolean,
    isTargetGroup: boolean,
  ): {
    entityType: 'user' | 'group',
    targetType: 'lock' | 'lock_group',
  } => {

    let entityType: 'user' | 'group';
    let targetType: 'lock' | 'lock_group';

    if (mode === 'locks') {
      entityType = isEntitySelected ? 'group' : 'user';
      entityType = isEntityGroup ? 'group' : 'user';
      targetType = isTargetGroup ? 'lock_group' : 'lock';
    } else {
      entityType = isEntityGroup ? 'group' : 'user';
      targetType = isTargetGroup ? 'lock_group' : 'lock';
    }

    return {
      entityType,
      targetType,
    };
  };

  const togglePermission = (
    entityId: number,
    targetId: number,
    entityType: 'user' | 'group',
    targetType: 'lock' | 'lock_group',
    currentlyGranted: boolean
  ) => {
    const permissionObj: Permission = {
      ...(entityType === 'user' && typeof entityId === 'number' ? { user: entityId } : { group: entityId }),
      ...(targetType === 'lock' && typeof targetId === 'number' ? { lock: targetId } : { lock_group: targetId })
    };

    if (!getPermissionKey(permissionObj)) {
      console.error("Attempted to toggle permission with missing key IDs.", permissionObj);
      setSnackbar({ isError: true, text: "Error: Entity or Target ID is missing." });
      return;
    }

    const permKey = getPermissionKey(permissionObj);

    setPermissionChanges(prev => {
      const newChanges = { ...prev };
      const inAdd = newChanges.toAdd.some(p => getPermissionKey(p) === permKey);
      const inRemove = newChanges.toRemove.some(p => getPermissionKey(p) === permKey);

      if (inAdd) {
        // Revert a pending Add -> Remove from Add list
        newChanges.toAdd = newChanges.toAdd.filter(p => getPermissionKey(p) !== permKey);
      } else if (inRemove) {
        // Revert a pending Remove -> Remove from Remove list
        newChanges.toRemove = newChanges.toRemove.filter(p => getPermissionKey(p) !== permKey);
      } else if (currentlyGranted) {
        // Currently granted, user wants to revoke -> add to remove list
        newChanges.toRemove = [...newChanges.toRemove, permissionObj];
      } else {
        // Currently not granted, user wants to grant -> add to add list
        newChanges.toAdd = [...newChanges.toAdd, permissionObj];
      }

      return newChanges;
    });
  };

  const clearPermissionChanges = () => {
    setPermissionChanges({ toAdd: [], toRemove: [] });
  };

  const csrfToken = getCookie("csrftoken");
  const headers: HeadersInit = csrfToken
    ? {
      "Content-Type": "application/json",
      "X-CSRFToken": csrfToken
    }
    : {};

  const handlePermissionChanges = async () => {
    await fetch(`${process.env.REACT_APP_BACKEND_URL}/permissions/`, {
      method: "POST",
      credentials: "include",
      headers,
      body: JSON.stringify(permissionChanges),
    });

    clearPermissionChanges();
    setSnackbar({ isError: false, text: "Permissions updated successfully!" });
    fetchData();
  };

  // Helper functions for checking **CURRENT** and **PENDING** permissions
  const hasExplicitPermission = (
    entityId: number,
    targetId: number,
    entityType: 'user' | 'group',
    targetType: 'lock' | 'lock_group'
  ): boolean | null => {
    const perm = permissions.find((p: Permission) => {
      const matchEntity = (entityType === 'user' ? p.user : p.group) === entityId;
      const matchTarget = (targetType === 'lock' ? p.lock : p.lock_group) === targetId;
      return matchEntity && matchTarget;
    });
    return perm ? true : null;
  };

  const isPermissionPending = (
    entityId: number,
    targetId: number,
    entityType: 'user' | 'group',
    targetType: 'lock' | 'lock_group'
  ): 'add' | 'remove' | false => {
    const permissionObj: Permission = {
      ...(entityType === 'user' ? { user: entityId } : { group: entityId }),
      ...(targetType === 'lock' ? { lock: targetId } : { lock_group: targetId })
    };
    const permKey = getPermissionKey(permissionObj);

    if (!permKey) return false; // Exit if key couldn't be generated

    if (permissionChanges.toAdd.some(p => getPermissionKey(p) === permKey)) {
      return 'add';
    }
    if (permissionChanges.toRemove.some(p => getPermissionKey(p) === permKey)) {
      return 'remove';
    }
    return false;
  };

  const hasItemPendingChanges = (itemId: number, itemType: keyof Permission): boolean => {
    const isPending = (p: Permission) => p[itemType] === itemId;
    return permissionChanges.toAdd.some(isPending) || permissionChanges.toRemove.some(isPending);
  };


  // --- GROUP EXPANSION LOGIC ---
  const fetchGroupMembers = async (groupId: number, categoryKey: string) => {
    const key = `${categoryKey}-${otherMode}-group-${groupId}`;

    if (expandedGroups[key]) {
      setExpandedGroups(prev => {
        const newState = { ...prev };
        delete newState[key];
        return newState;
      });
      return;
    }

    setLoadingGroups(prev => new Set(prev).add(key));

    try {
      const res = await fetch(
        `${process.env.REACT_APP_BACKEND_URL}/users/groups/${groupId}/users/`,
        { method: "GET", credentials: "include" }
      );

      const data = await res.json();

      const transformedMembers: User[] = (data.members || []).map((member: any) => ({
        ...member,
        name: member.username,
      }));

      setExpandedGroups(prev => ({
        ...prev,
        [key]: transformedMembers
      }));
    } catch (error) {
      setSnackbar({ isError: true, text: `Error fetching group members: ${error}` });
    } finally {
      setLoadingGroups(prev => {
        const newSet = new Set(prev);
        newSet.delete(key);
        return newSet;
      });
    }
  };

  const isLoadingOrInvalid = !selectedItem || (mode === 'locks' && locks.length === 0) || (mode === 'users' && users.length === 0);

  if (isLoadingOrInvalid) {
    return (
      <main className="px-8 py-8 max-w-7xl mx-auto flex flex-col justify-center items-center h-screen">
        <CircularProgress />
        <Typography variant="h5" className="mt-4">Loading data...</Typography>
      </main>
    );
  }

  return (
    <main className="px-8 py-8 max-w-7xl mx-auto">
      <CustomSnackbar
        isError={snackbar?.isError}
        text={snackbar?.text}
        onClose={() => { setSnackbar({ isError: snackbar?.isError || false, text: "" }); }}
      />

      <div className="flex justify-end mb-8">
        <Button
          variant="outlined"
          onClick={toggleMode}
        >
          SWITCH TO {otherMode.toUpperCase()} EDITING MODE
        </Button>
      </div>

      <div className="grid grid-cols-3 gap-8">
        {/* Left Column: Select Entity/Target */}
        <div className="col-span-1">
          <div className="bg-white rounded-lg shadow p-6 sticky top-24">
            <h3 className="text-sm font-semibold text-slate-700 mb-4">
              {mode === 'locks' ? 'Select lock or group' : 'Select user or group'}
            </h3>
            <input
              type="text"
              placeholder="Name, group, ..."
              className="w-full px-4 py-2 border border-slate-300 rounded mb-6 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />

            <div className="space-y-2 text-sm">
              {Object.entries(selectedData).map(([categoryKey, items]) => (
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
                    <ButtonGroup
                      orientation="vertical"
                      variant="text"
                      className="w-full space-y-1"
                    >
                      {items.map((item: Entity, index: number) => {
                        const itemType: keyof Permission = categoryKey === 'group'
                          ? (mode === 'locks' ? 'lock_group' : 'group')
                          : (mode === 'locks' ? 'lock' : 'user');
                        const hasPending = hasItemPendingChanges(item.id, itemType);

                        return (
                          <Button
                            key={item.id}
                            onClick={() => {
                              setSelected({ type: categoryKey as SelectionType, index });
                            }}
                            sx={{
                              color: selected.type === categoryKey && selected.index === index ? "primary.main" : "text.secondary",
                              fontWeight: selected.type === categoryKey && selected.index === index ? 700 : 500,
                              justifyContent: "flex-start",
                              textTransform: "none",
                              paddingRight: 1,
                              backgroundColor: selected.type === categoryKey && selected.index === index ? "rgba(25, 118, 210, 0.04)" : "transparent",
                              '&:hover': {
                                backgroundColor: selected.type === categoryKey && selected.index === index ? "rgba(25, 118, 210, 0.08)" : "rgba(0, 0, 0, 0.04)"
                              }
                            }}
                            size="small"
                            className="w-full"
                          >
                            <div className="flex w-full justify-between items-center">
                              <span className="truncate">{item.name}</span>
                              {hasPending && (
                                <Tooltip title="Pending changes">
                                  <Warning sx={{ color: "orange", fontSize: 18, flexShrink: 0 }} />
                                </Tooltip>
                              )}
                            </div>
                          </Button>
                        );
                      })}
                    </ButtonGroup>
                  </AccordionDetails>
                </Accordion>
              ))}
            </div>
          </div>
        </div>

        {/* Right Column: Permission Assignment */}
        <div className="col-span-2">
          <div className="bg-white rounded-lg shadow p-8">
            <h2 className="text-lg font-semibold text-slate-900 mb-8">
              {`Manage permissions for ${mode === 'locks' ? 'Lock' : 'User'}${selected.type === 'group' ? ' Group' : ''} "${selectedItem?.name}"`}
            </h2>

            <div className="grid grid-cols-2 gap-8 mb-8">
              {Object.entries(otherData).map(([categoryKey, items]) => (
                <div key={categoryKey} className="mb-8">
                  <h3 className="text-sm font-bold text-slate-900 text-center mb-6 uppercase tracking-wide">
                    {categoryKey === "individual" ? `INDIVIDUAL ${otherMode.toUpperCase()}` : `${otherMode.substring(0, otherMode.length - 1).toUpperCase()} GROUPS`}
                  </h3>
                  {items.map((item: Entity) => {
                    // --- CORE LOGIC: Main list item (in the right column) ---

                    const isSelectedEntity = mode === 'users';
                    const isEntityGroup = isSelectedEntity ? selected.type === 'group' : categoryKey === 'group';
                    const isTargetGroup = isSelectedEntity ? categoryKey === 'group' : selected.type === 'group';

                    let entityId = isSelectedEntity ? selectedItemId : item.id;
                    let targetId = isSelectedEntity ? item.id : selectedItemId;

                    const {
                      entityType,
                      targetType
                    } = getPermissionContext(
                      isSelectedEntity,
                      isEntityGroup,
                      isTargetGroup,
                    );

                    // --- Permission Status Check (Current Access) ---
                    const hasAccess = hasExplicitPermission(entityId, targetId, entityType, targetType);
                    const isCurrentlyGranted = hasAccess === true;
                    const pendingStatus = isPermissionPending(entityId, targetId, entityType, targetType);

                    const isGroup = categoryKey === 'group';
                    const groupKey = `${categoryKey}-${otherMode}-group-${item.id}`;
                    const isExpanded = expandedGroups[groupKey] !== undefined;
                    const isLoading = loadingGroups.has(groupKey);
                    const members = expandedGroups[groupKey] || [];

                    return (
                      <div key={item.id}>
                        <div className="flex items-center justify-between mb-3 p-2 hover:bg-slate-50 rounded">
                          <PermissionRow
                            label={item.name}
                            expandable={isGroup}
                            collapsed={!isExpanded}
                            onExpand={isGroup && (otherMode === 'users') ? () => fetchGroupMembers(item.id, categoryKey) : undefined}
                            isLoading={isLoading}
                          />
                          <button
                            onClick={() => {
                              // Ensure IDs are valid numbers before passing
                              if (typeof entityId === 'number' && typeof targetId === 'number') {
                                togglePermission(entityId, targetId, entityType, targetType, isCurrentlyGranted);
                              }
                            }}
                            className="ml-auto hover:opacity-70 transition"
                          >
                            {(() => {
                              const status = isCurrentlyGranted ? (pendingStatus === 'remove' ? 'pending_remove' : 'granted') : (pendingStatus === 'add' ? 'pending_add' : 'revoked');

                              if (status === 'pending_add') {
                                return <CheckCircle sx={{ color: 'blue', fontSize: 24 }} />;
                              } else if (status === 'pending_remove') {
                                return <Cancel sx={{ color: 'blue', fontSize: 24 }} />;
                              } else if (status === 'granted') {
                                return <CheckCircle sx={{ color: 'green', fontSize: 24 }} />;
                              } else {
                                return <Cancel sx={{ color: 'lightgray', fontSize: 24 }} />;
                              }
                            })()}
                          </button>
                        </div>

                        {/* Nested Group Members (Only for User Groups when mode is 'locks') */}
                        {isGroup && isExpanded && otherMode === 'users' && members.length > 0 && (
                          <div className="pl-6 border-l-2 border-slate-200 ml-3 mb-3">
                            {members.map((member: Entity) => {
                              // --- NESTED CORE LOGIC: Always User <-> Selected Target ---

                              // Entity is the individual User (member)
                              const memberEntityId = member.id;
                              const memberEntityType: 'user' = 'user';

                              // Target is the Selected Lock/Lock Group
                              const memberTargetId = selectedItemId!;
                              const memberTargetType = selected.type === 'individual' ? 'lock' : 'lock_group';

                              // Defensive check
                              if (typeof memberEntityId !== 'number' || typeof memberTargetId !== 'number') {
                                return <div key={member.id} className="text-red-500 p-2">Error: Missing User or Lock ID.</div>;
                              }

                              // Check for explicit permission on the member user (User <-> Lock/Lock Group)
                              const memberExplicitPermission = hasExplicitPermission(
                                memberEntityId,
                                memberTargetId,
                                memberEntityType,
                                memberTargetType
                              );

                              const memberIsCurrentlyGranted = memberExplicitPermission === true;
                              const memberPendingStatus = isPermissionPending(
                                memberEntityId,
                                memberTargetId,
                                memberEntityType,
                                memberTargetType
                              );

                              return (
                                <div key={member.id} className="flex items-center justify-between p-2 hover:bg-slate-50 rounded text-sm">
                                  <span className="text-slate-600">{(member as User).username || member.name}</span>
                                  <button
                                    onClick={() => {
                                      togglePermission(
                                        memberEntityId,
                                        memberTargetId,
                                        memberEntityType,
                                        memberTargetType,
                                        memberIsCurrentlyGranted
                                      );
                                    }}
                                    className="ml-auto hover:opacity-70 transition"
                                  >
                                    {(() => {
                                      const status = memberIsCurrentlyGranted ? (memberPendingStatus === 'remove' ? 'pending_remove' : 'granted') : (memberPendingStatus === 'add' ? 'pending_add' : 'revoked');

                                      let Icon, color, title;

                                      if (status === 'pending_add') {
                                        Icon = CheckCircle;
                                        color = 'blue';
                                        title = 'Permission add pending (User override)';
                                      } else if (status === 'pending_remove') {
                                        Icon = Cancel;
                                        color = 'blue';
                                        title = 'Permission revoke pending (User override)';
                                      } else if (status === 'granted') {
                                        Icon = CheckCircle;
                                        color = 'green';
                                        title = 'Explicit permission granted';
                                      } else { // 'revoked'
                                        // Hide icon if no explicit permission and no pending change
                                        if (!memberIsCurrentlyGranted && !memberPendingStatus) {
                                          return <div className="w-5 h-5" />;
                                        }
                                        Icon = Cancel;
                                        color = 'lightgray';
                                        title = 'No explicit permission';
                                      }

                                      return (
                                        <Tooltip title={title}>
                                          <Icon sx={{ color: color, fontSize: 20 }} />
                                        </Tooltip>
                                      );
                                    })()}
                                  </button>
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              ))}
            </div>

            {/* Save/Clear Changes Footer */}
            <div className="flex items-center justify-between pt-6 border-t border-slate-200">
              <Button
                variant="outlined"
                disabled={permissionChanges.toAdd.length + permissionChanges.toRemove.length === 0}
                onClick={clearPermissionChanges}
              >
                CLEAR
              </Button>
              <div className="flex items-center gap-10">
                <span className="text-md text-blue-500 font-bold">
                  {permissionChanges.toAdd.length + permissionChanges.toRemove.length} to update
                </span>
                <Button
                  variant="contained"
                  disabled={permissionChanges.toAdd.length + permissionChanges.toRemove.length === 0}
                  onClick={handlePermissionChanges}
                >
                  SAVE
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
};

export default PermissionTable;
