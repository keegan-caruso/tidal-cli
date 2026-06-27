import type { UserController } from '../../controllers/user.ts';
import type {
  MixesToolInput,
  CollectionToolInput,
  LoginStatusToolInput,
} from '../inputs/user.ts';
import { isUserLoggedIn } from '../../services/auth.ts';
import { jsonToolResult } from '../format.ts';

export const getMixesToolName = 'tidal_get_mixes' as const;
export const getMixesToolDescription =
  "Get the user's personalized mixes (requires login). Returns playlists tailored to the user's listening history.";

export const getCollectionToolName = 'tidal_get_collection' as const;
export const getCollectionToolDescription =
  "Get the user's saved music collection (requires login). Returns saved tracks, albums, artists, or playlists.";

export const loginStatusToolName = 'tidal_login_status' as const;
export const loginStatusToolDescription =
  'Check if a user is currently logged in to Tidal.';

export function createGetMixesToolHandler(controller: UserController) {
  return async (input: MixesToolInput) => {
    const result = await controller.getMixes({
      type: input.type,
    });
    return jsonToolResult(result);
  };
}

export function createGetCollectionToolHandler(controller: UserController) {
  return async (input: CollectionToolInput) => {
    const result = await controller.getCollection({
      type: input.type,
      sort: input.sort,
      limit: input.limit,
    });
    return jsonToolResult(result);
  };
}

export function createLoginStatusToolHandler() {
  return async (_input: LoginStatusToolInput) => {
    const loggedIn = await isUserLoggedIn();
    const result = {
      loggedIn,
      message: loggedIn
        ? 'User is logged in to Tidal.'
        : 'User is not logged in. Run "tidal login" in the CLI to authenticate.',
    };
    return jsonToolResult(result);
  };
}
