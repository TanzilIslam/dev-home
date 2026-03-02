// Error classes
export { SupabaseError, ApiRequestError } from "./utils";

// Clients
export {
  listClients,
  listClientDropdown,
  createClient,
  updateClient,
  deleteClient,
} from "./clients";

// Projects
export {
  listProjects,
  listProjectDropdown,
  createProject,
  updateProject,
  deleteProject,
} from "./projects";

// Codebases
export {
  listCodebases,
  listCodebaseDropdown,
  createCodebase,
  updateCodebase,
  deleteCodebase,
} from "./codebases";

// Links
export { listLinks, createLink, updateLink, deleteLink } from "./links";

// Files + Storage
export { uploadFile, listFiles, deleteFileRecord, createSignedUrl } from "./files";

// Auth / Profile
export {
  updateProfile,
  changePassword,
  signIn,
  signUp,
  getAuthUser,
  onAuthStateChange,
  signOut,
  resendVerificationEmail,
  verifyOtp,
  exchangeCodeForSession,
  resetPasswordForEmail,
  updatePassword,
} from "./auth";
