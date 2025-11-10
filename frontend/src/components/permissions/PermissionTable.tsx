import React, { useEffect, useState, FC } from 'react';
import { Accordion, AccordionSummary, AccordionDetails, Button, ButtonGroup, Typography, Tooltip, CircularProgress, IconButton } from '@mui/material';
import { ExpandMore, CheckCircle, Cancel, Warning, ChevronRight } from '@mui/icons-material';
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
  const keys: Array<keyof Permission> = ['user', 'group', 'lock', 'lock_group'];
  const orderedObj: { [k: string]: number } = {};
  keys.forEach(key => {
    if (permissionObj.hasOwnProperty(key) && permissionObj[key] !== undefined && permissionObj[key] !== null) {
      const value = permissionObj[key]!;
      if (typeof value === 'number') {
        orderedObj[key] = value;
      }
    }
  });
  return JSON.stringify(orderedObj);
};

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
  const [lockGroups, setLockGroups] = useState<Entity[]>([]);
  const [permissions, setPermissions] = useState<Permission[]>([]);

  const [expandedGroups, setExpandedGroups] = useState<{ [key: string]: Entity[] }>({});
  const [loadingGroups, setLoadingGroups] = useState<Set<string>>(new Set());

  const [selectedGroupMembers, setSelectedGroupMembers] = useState<Entity[] | null>(null);
  const [loadingSelectedGroup, setLoadingSelectedGroup] = useState(false);
  // NEW STATE: Control whether the selected group members are displayed
  const [isSelectedGroupExpanded, setIsSelectedGroupExpanded] = useState(false);

  const [permissionChanges, setPermissionChanges] = useState<PermissionChanges>({ toAdd: [], toRemove: [] });

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

  const toggleMode = () => {
    setMode(prevMode => (prevMode === 'locks' ? 'users' : 'locks'));
    // Reset selection state upon mode switch
    setSelected({ type: "group", index: 0 });
    setSelectedGroupMembers(null);
    setIsSelectedGroupExpanded(false); // Reset expansion state
  };

  // --- CORE DATA FETCHING ---

  const fetchData = async () => {
    try {
      const [usersRes, locksRes, userGroupsRes, lockGroupsRes, permissionsRes] = await Promise.all([
        fetch(`${process.env.REACT_APP_BACKEND_URL}/users/`, { method: "GET", credentials: "include" }),
        fetch(`${process.env.REACT_APP_BACKEND_URL}/locks/`, { method: "GET", credentials: "include" }),
        fetch(`${process.env.REACT_APP_BACKEND_URL}/users/groups/`, { method: "GET", credentials: "include" }),
        fetch(`${process.env.REACT_APP_BACKEND_URL}/locks/groups/`, { method: "GET", credentials: "include" }),
        fetch(`${process.env.REACT_APP_BACKEND_URL}/permissions/?type=all`, { method: "GET", credentials: "include" })
      ]);

      const usersJson = await usersRes.json();
      const locksJson = await locksRes.json();
      const userGroupsJson = await userGroupsRes.json();
      const lockGroupsJson = await lockGroupsRes.json();
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

      const transformedLockGroups: Entity[] = (lockGroupsJson.lock_groups || []).map((lockGroup: any) => ({
        ...lockGroup,
        id: lockGroup.id_group
      }));

      setUsers(transformedUsers);
      setLocks(transformedLocks);
      setUserGroups(userGroupsJson.groups || []);
      setLockGroups(transformedLockGroups);
      setPermissions(permissionsJson || []);
      setExpandedGroups({});
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      setSnackbar({ isError: true, text: `Error fetching initial data: ${errorMessage}` });
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // --- MANUAL MEMBER FETCHING FOR SELECTED GROUP (LEFT COLUMN) ---

  const toggleSelectedGroupMembers = async () => {
    const isCurrentlyExpanded = isSelectedGroupExpanded;

    if (!selectedItem || selected.type !== 'group') return;

    // If currently expanded, just collapse (no fetch needed)
    if (isCurrentlyExpanded) {
      setIsSelectedGroupExpanded(false);
      return;
    }

    // If collapsing is false, proceed to fetch and expand
    const groupType = mode; // 'users' or 'locks'
    const groupItem = selectedItem;
    const groupId = groupType === 'locks' ? groupItem.id_group || groupItem.id : groupItem.id;

    if (typeof groupId !== 'number') return;

    setLoadingSelectedGroup(true);

    try {
      const membersEndpoint = `${process.env.REACT_APP_BACKEND_URL}/${groupType}/groups/${groupId}/${groupType}/`;

      const res = await fetch(membersEndpoint, { method: "GET", credentials: "include" });

      if (!res.ok) {
        throw new Error(`Failed to fetch group members from ${membersEndpoint} with status: ${res.status}`);
      }

      const data = await res.json();
      let members: Entity[];

      if (groupType === 'users') {
        members = (data.members || []).map((member: any) => ({
          ...member,
          name: member.username,
        })) as User[];
      } else { // groupType === 'locks'
        members = (data.locks || []).map((member: any) => ({
          ...member,
          name: member.name || `Lock ${member.id_lock}`,
          id: member.id_lock
        })) as Lock[];
      }

      setSelectedGroupMembers(members);
      setIsSelectedGroupExpanded(true); // Set expanded only upon successful fetch

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      setSnackbar({ isError: true, text: `Error fetching ${groupType} members: ${errorMessage}` });
      setSelectedGroupMembers(null);
      setIsSelectedGroupExpanded(false);
    } finally {
      setLoadingSelectedGroup(false);
    }
  };

  // Reset expansion state when selected item changes (without refetching)
  useEffect(() => {
    setIsSelectedGroupExpanded(false);
    setSelectedGroupMembers(null);
  }, [selected.type, selected.index, mode]);


  // --- PERMISSION/PENDING STATUS HELPERS ---

  const getPermissionContext = (
    isSelectedEntity: boolean,
    isEntityGroup: boolean,
    isTargetGroup: boolean,
  ): {
    entityType: 'user' | 'group',
    targetType: 'lock' | 'lock_group',
  } => {
    let entityType: 'user' | 'group';
    let targetType: 'lock' | 'lock_group';

    if (mode === 'locks') {
      entityType = isEntityGroup ? 'group' : 'user';
      targetType = isTargetGroup ? 'lock_group' : 'lock';
    } else {
      entityType = isEntityGroup ? 'group' : 'user';
      targetType = isTargetGroup ? 'lock_group' : 'lock';
    }

    return { entityType, targetType };
  };

  const togglePermission = (
    entityId: number | undefined,
    targetId: number | undefined,
    entityType: 'user' | 'group',
    targetType: 'lock' | 'lock_group',
    currentlyGranted: boolean
  ) => {
    if (typeof entityId !== 'number' || typeof targetId !== 'number') {
      setSnackbar({ isError: true, text: "Error: Entity or Target ID is missing." });
      return;
    }

    const permissionObj: Permission = {
      ...(entityType === 'user' ? { user: entityId } : { group: entityId }),
      ...(targetType === 'lock' ? { lock: targetId } : { lock_group: targetId })
    };

    const permKey = getPermissionKey(permissionObj);

    setPermissionChanges(prev => {
      const newChanges = { ...prev };
      const inAdd = newChanges.toAdd.some(p => getPermissionKey(p) === permKey);
      const inRemove = newChanges.toRemove.some(p => getPermissionKey(p) === permKey);

      if (inAdd) {
        newChanges.toAdd = newChanges.toAdd.filter(p => getPermissionKey(p) !== permKey);
      } else if (inRemove) {
        newChanges.toRemove = newChanges.toRemove.filter(p => getPermissionKey(p) !== permKey);
      } else if (currentlyGranted) {
        newChanges.toRemove = [...newChanges.toRemove, permissionObj];
      } else {
        newChanges.toAdd = [...newChanges.toAdd, permissionObj];
      }

      return newChanges;
    });
  };

  const hasExplicitPermission = (
    entityId: number | undefined,
    targetId: number | undefined,
    entityType: 'user' | 'group',
    targetType: 'lock' | 'lock_group'
  ): boolean | null => {
    if (typeof entityId !== 'number' || typeof targetId !== 'number') return null;

    const perm = permissions.find((p: Permission) => {
      const matchEntity = (entityType === 'user' ? p.user : p.group) === entityId;
      const matchTarget = (targetType === 'lock' ? p.lock : p.lock_group) === targetId;
      return matchEntity && matchTarget;
    });
    return perm ? true : null;
  };

  const isPermissionPending = (
    entityId: number | undefined,
    targetId: number | undefined,
    entityType: 'user' | 'group',
    targetType: 'lock' | 'lock_group'
  ): 'add' | 'remove' | false => {
    if (typeof entityId !== 'number' || typeof targetId !== 'number') return false;

    const permissionObj: Permission = {
      ...(entityType === 'user' ? { user: entityId } : { group: entityId }),
      ...(targetType === 'lock' ? { lock: targetId } : { lock_group: targetId })
    };
    const permKey = getPermissionKey(permissionObj);

    if (!permKey) return false;

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

  // --- ACTIONS ---

  const clearPermissionChanges = () => {
    setPermissionChanges({ toAdd: [], toRemove: [] });
  };

  const handlePermissionChanges = async () => {
    const csrfToken = getCookie("csrftoken");
    const headers: HeadersInit = csrfToken
      ? {
        "Content-Type": "application/json",
        "X-CSRFToken": csrfToken
      }
      : {};

    try {
      const response = await fetch(`${process.env.REACT_APP_BACKEND_URL}/permissions/`, {
        method: "POST",
        credentials: "include",
        headers,
        body: JSON.stringify(permissionChanges),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`HTTP error! status: ${response.status}. Details: ${errorText.substring(0, 100)}...`);
      }

      clearPermissionChanges();
      setSnackbar({ isError: false, text: "Permissions updated successfully!" });
      fetchData();
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      setSnackbar({ isError: true, text: `Error saving permissions: ${errorMessage}` });
    }
  };

  // --- GROUP EXPANSION LOGIC FOR RIGHT COLUMN ---

  const fetchRightColumnGroupMembers = async (groupItem: Entity, groupType: Mode) => {
    const groupId = groupType === 'locks' ? groupItem.id_group || groupItem.id : groupItem.id;

    if (typeof groupId !== 'number') return;

    const key = `${groupType}-group-${groupId}`;

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
      const membersEndpoint = `${process.env.REACT_APP_BACKEND_URL}/${groupType}/groups/${groupId}/${groupType}/`;

      const res = await fetch(membersEndpoint, { method: "GET", credentials: "include" });

      if (!res.ok) {
        throw new Error(`Failed to fetch group members from ${membersEndpoint} with status: ${res.status}`);
      }

      const data = await res.json();
      let transformedMembers: Entity[];

      if (groupType === 'users') {
        transformedMembers = (data.members || []).map((member: any) => ({
          ...member,
          name: member.username,
        })) as User[];
      } else { // groupType === 'locks'
        transformedMembers = (data.locks || []).map((member: any) => ({
          ...member,
          name: member.name || `Lock ${member.id_lock}`,
          id: member.id_lock
        })) as Lock[];
      }

      setExpandedGroups(prev => ({ ...prev, [key]: transformedMembers }));
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      setSnackbar({ isError: true, text: `Error fetching ${groupType} group members: ${errorMessage}` });
    } finally {
      setLoadingGroups(prev => {
        const newSet = new Set(prev);
        newSet.delete(key);
        return newSet;
      });
    }
  };


  const isLoadingOrInvalid = !selectedItem || (mode === 'locks' && locks.length === 0 && lockGroups.length === 0) || (mode === 'users' && users.length === 0 && userGroups.length === 0);

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
                        const isCurrentSelection = selected.type === categoryKey && selected.index === index;
                        const itemType: keyof Permission = categoryKey === 'group'
                          ? (mode === 'locks' ? 'lock_group' : 'group')
                          : (mode === 'locks' ? 'lock' : 'user');
                        const hasPending = hasItemPendingChanges(item.id, itemType);

                        return (
                          <div key={item.id}>
                            <Button
                              onClick={() => {
                                setSelected({ type: categoryKey as SelectionType, index });
                              }}
                              sx={{
                                color: isCurrentSelection ? "primary.main" : "text.secondary",
                                fontWeight: isCurrentSelection ? 700 : 500,
                                justifyContent: "flex-start",
                                textTransform: "none",
                                paddingRight: 1,
                                backgroundColor: isCurrentSelection ? "rgba(25, 118, 210, 0.04)" : "transparent",
                                '&:hover': {
                                  backgroundColor: isCurrentSelection ? "rgba(25, 118, 210, 0.08)" : "rgba(0, 0, 0, 0.04)"
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
                          </div>
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

            <div className="flex items-center justify-start mb-2">
              <h2 className="text-2xl font-semibold text-slate-900 mr-4 mb-6">
                {`Manage permissions for ${mode === 'locks' ? 'Lock' : 'User'}${selected.type === 'group' ? ' Group' : ''} "${selectedItem?.name}"`}
              </h2>

              {/* MANUAL EXPAND/COLLAPSE BUTTON */}
              {selected.type === 'group' && (
                <Tooltip title={`${isSelectedGroupExpanded ? 'Hide' : 'Show'} group members`}>
                  <IconButton
                    size="small"
                    onClick={toggleSelectedGroupMembers}
                    disabled={loadingSelectedGroup}
                  >
                    {loadingSelectedGroup ? (
                      <CircularProgress size={16} />
                    ) : (
                      <ChevronRight
                        sx={{
                          transition: 'transform 0.2s',
                          transform: isSelectedGroupExpanded ? 'rotate(90deg)' : 'rotate(0deg)',
                          color: isSelectedGroupExpanded ? 'primary.main' : 'text.secondary'
                        }}
                      />
                    )}
                  </IconButton>
                </Tooltip>
              )}
            </div>

            {/* Expanded members under the title (Conditional Display) */}
            {selected.type === 'group' && isSelectedGroupExpanded && (
              <div className="mb-6 pb-2 border-b border-slate-200">
                {selectedGroupMembers && selectedGroupMembers.length > 0 && (
                  <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs mt-2">
                    <Typography variant="caption" className="font-bold text-slate-500 w-full mb-1">
                      Members of this {mode === 'users' ? 'User' : 'Lock'} Group:
                    </Typography>
                    {selectedGroupMembers.map(member => (
                      <span key={member.id} className="text-slate-600 truncate py-0.5">
                        {member.name}
                      </span>
                    ))}
                  </div>
                )}
                {selectedGroupMembers && selectedGroupMembers.length === 0 && (
                  <Typography variant="caption" className="text-slate-500 mt-2 block">
                    This {mode === 'users' ? 'User' : 'Lock'} Group has no members.
                  </Typography>
                )}
              </div>
            )}
            {/* End Expanded members under the title */}


            <div className="grid grid-cols-2 gap-8 mb-8">
              {Object.entries(otherData).map(([categoryKey, items]) => (
                <div key={categoryKey} className="mb-8">
                  <h3 className="text-sm font-bold text-slate-900 text-center mb-6 uppercase tracking-wide">
                    {categoryKey === "individual" ? `INDIVIDUAL ${otherMode.toUpperCase()}` : `${otherMode.substring(0, otherMode.length - 1).toUpperCase()} GROUPS`}
                  </h3>
                  {items.map((item: Entity) => {
                    const isSelectedEntity = mode === 'users';
                    const isEntityGroup = isSelectedEntity ? selected.type === 'group' : categoryKey === 'group';
                    const isTargetGroup = isSelectedEntity ? categoryKey === 'group' : selected.type === 'group';

                    let entityId = isSelectedEntity ? selectedItemId : item.id;
                    let targetId = isSelectedEntity ? item.id : selectedItemId;

                    const { entityType, targetType } = getPermissionContext(isSelectedEntity, isEntityGroup, isTargetGroup);
                    const hasAccess = hasExplicitPermission(entityId, targetId, entityType, targetType);
                    const isCurrentlyGranted = hasAccess === true;
                    const pendingStatus = isPermissionPending(entityId, targetId, entityType, targetType);

                    const isGroup = categoryKey === 'group';

                    const groupIdForLookup = otherMode === 'locks' ? item.id_group || item.id : item.id;
                    const groupKey = `${otherMode}-group-${groupIdForLookup}`;

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
                            onExpand={isGroup ? () => fetchRightColumnGroupMembers(item, otherMode) : undefined}
                            isLoading={isLoading}
                          />
                          <button
                            onClick={() => {
                              togglePermission(entityId, targetId, entityType, targetType, isCurrentlyGranted);
                            }}
                            className="ml-auto hover:opacity-70 transition"
                            disabled={typeof entityId !== 'number' || typeof targetId !== 'number'}
                          >
                            {(() => {
                              const status = isCurrentlyGranted ? (pendingStatus === 'remove' ? 'pending_remove' : 'granted') : (pendingStatus === 'add' ? 'pending_add' : 'revoked');

                              if (status === 'pending_add') return <CheckCircle sx={{ color: 'blue', fontSize: 24 }} />;
                              if (status === 'pending_remove') return <Cancel sx={{ color: 'blue', fontSize: 24 }} />;
                              if (status === 'granted') return <CheckCircle sx={{ color: 'green', fontSize: 24 }} />;
                              return <Cancel sx={{ color: 'lightgray', fontSize: 24 }} />;
                            })()}
                          </button>
                        </div>

                        {/* Expanded Group Members (Inner List) */}
                        {isGroup && isExpanded && members.length > 0 && (
                          <div className="pl-6 border-l-2 border-slate-200 ml-3 mb-3">
                            {members.map((member: Entity) => {

                              let memberEntityId: number | undefined;
                              let memberTargetId: number | undefined;
                              let memberEntityType: 'user' | 'group';
                              let memberTargetType: 'lock' | 'lock_group';

                              if (mode === 'locks') {
                                memberEntityId = member.id;
                                memberEntityType = 'user';
                                memberTargetId = selectedItemId;
                                memberTargetType = selected.type === 'individual' ? 'lock' : 'lock_group';
                              } else {
                                memberEntityId = selectedItemId;
                                memberEntityType = selected.type === 'individual' ? 'user' : 'group';
                                memberTargetId = member.id;
                                memberTargetType = 'lock';
                              }

                              const memberExplicitPermission = hasExplicitPermission(memberEntityId, memberTargetId, memberEntityType, memberTargetType);
                              const memberIsCurrentlyGranted = memberExplicitPermission === true;
                              const memberPendingStatus = isPermissionPending(memberEntityId, memberTargetId, memberEntityType, memberTargetType);

                              if (typeof memberEntityId !== 'number' || typeof memberTargetId !== 'number') {
                                return <div key={member.id} className="text-red-500 p-2">Error: Missing ID for member check.</div>;
                              }

                              return (
                                <div key={member.id} className="flex items-center justify-between p-2 hover:bg-slate-50 rounded text-sm">
                                  <span className="text-slate-600">{member.name}</span>
                                  <button
                                    onClick={() => {
                                      togglePermission(memberEntityId, memberTargetId, memberEntityType, memberTargetType, memberIsCurrentlyGranted);
                                    }}
                                    className="ml-auto hover:opacity-70 transition"
                                  >
                                    {(() => {
                                      const status = memberIsCurrentlyGranted ? (memberPendingStatus === 'remove' ? 'pending_remove' : 'granted') : (memberPendingStatus === 'add' ? 'pending_add' : 'revoked');
                                      let Icon, color, title;
                                      if (status === 'pending_add') { Icon = CheckCircle; color = 'blue'; title = `${mode === 'locks' ? 'User' : 'Lock'} permission add pending (Individual override)`; }
                                      else if (status === 'pending_remove') { Icon = Cancel; color = 'blue'; title = `${mode === 'locks' ? 'User' : 'Lock'} permission revoke pending (Individual override)`; }
                                      else if (status === 'granted') { Icon = CheckCircle; color = 'green'; title = 'Explicit individual permission granted'; }
                                      else {
                                        if (!memberIsCurrentlyGranted && !memberPendingStatus) return <div className="w-5 h-5" />;
                                        Icon = Cancel; color = 'lightgray'; title = 'No explicit individual permission';
                                      }
                                      return (<Tooltip title={title}><Icon sx={{ color: color, fontSize: 20 }} /></Tooltip>);
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
