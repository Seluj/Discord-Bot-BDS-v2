/**
 * Add a role to a member
 * @param member member to add a role
 * @param id_role role to add
 */
function addRole(member, id_role) {
  member.roles.add(id_role);
}

/**
 * delete a role to a member
 * @param member member to remove the role
 * @param id_role role to remove
 */
function deleteRole(member, id_role) {
  member.roles.remove(id_role);
}

module.exports = {
  addRole,
  deleteRole,
};