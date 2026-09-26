/**
 * Authorization helpers for LAMBO specimen management
 * Designated field supervisor (Roll #9260572) has administrative telemetry access.
 */
export const SUPERVISOR_ROLL_NUMBER = '9260572';

export const isFieldSupervisor = (user) => {
  if (!user) return false;
  const roll = typeof user === 'object' ? user.rollNumber : '';
  return String(roll || '').trim() === SUPERVISOR_ROLL_NUMBER;
};

export const canUserLogTree = (user, tree) => {
  if (!user || !tree) return false;
  if (isFieldSupervisor(user)) return true;

  const ownerId = tree.owner?._id ? String(tree.owner._id) : String(tree.owner || '');
  const userId = typeof user === 'object'
    ? String(user._id || user.id || '')
    : String(user || '');
  return Boolean(ownerId && userId && ownerId === userId);
};

export const canUserEditOrDeleteLog = (user, log, tree = null) => {
  if (!user || !log) return false;
  if (isFieldSupervisor(user)) return true;

  const userId = typeof user === 'object'
    ? String(user._id || user.id || '')
    : String(user || '');
  const loggedById = log.loggedBy?._id ? String(log.loggedBy._id) : String(log.loggedBy || '');
  const treeOwnerId = tree?.owner?._id ? String(tree.owner._id) : String(tree?.owner || '');

  return Boolean(
    (userId && loggedById && userId === loggedById) ||
    (userId && treeOwnerId && userId === treeOwnerId)
  );
};
