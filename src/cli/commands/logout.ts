import { Command } from 'commander';
import { logoutUser, isUserLoggedIn } from '../../services/auth.ts';
import { formatCliError } from '../utils.ts';

export function createLogoutCommand(): Command {
  const cmd = new Command('logout');

  cmd
    .description('Log out from Tidal')
    .action(async () => {
      try {
        const loggedIn = await isUserLoggedIn();
        if (!loggedIn) {
          process.stdout.write('You are not logged in.\n');
          return;
        }

        await logoutUser();
        process.stdout.write('Logged out successfully.\n');
      } catch (err) {
        process.stderr.write(`${formatCliError(err)}\n`);
        process.exit(1);
      }
    });

  return cmd;
}
