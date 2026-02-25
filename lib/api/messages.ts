function entityMessages(entity: string, plural: string) {
  const lower = entity.toLowerCase();
  return {
    notFound: `${entity} not found.`,
    invalidId: `Invalid ${lower} id.`,
    listError: `Unable to fetch ${plural} right now.`,
    fetchError: `Unable to fetch ${lower} right now.`,
    createError: `Unable to create ${lower} right now.`,
    updateError: `Unable to update ${lower} right now.`,
    deleteError: `Unable to delete ${lower} right now.`,
    created: `${entity} created successfully.`,
    updated: `${entity} updated successfully.`,
    deleted: `${entity} deleted successfully.`,
  };
}

export const CLIENT_MSG = entityMessages("Client", "clients");
export const PROJECT_MSG = entityMessages("Project", "projects");
export const CODEBASE_MSG = entityMessages("Codebase", "codebases");
export const LINK_MSG = entityMessages("Link", "links");
