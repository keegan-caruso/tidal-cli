import { createServer } from 'node:http';
import { Command } from 'commander';
import {
  startLogin,
  completeLogin,
  isUserLoggedIn,
} from '../../services/auth.ts';
import { formatCliError, openUrl } from '../utils.ts';

const CALLBACK_PORT = 17893;
const REDIRECT_URI = `http://localhost:${CALLBACK_PORT}/callback`;

export function createLoginCommand(): Command {
  const cmd = new Command('login');

  cmd
    .description('Log in to Tidal with your account')
    .action(async () => {
      try {
        const alreadyLoggedIn = await isUserLoggedIn();
        if (alreadyLoggedIn) {
          process.stdout.write('You are already logged in.\n');
          return;
        }

        process.stdout.write('Starting login...\n\n');

        // Start local server to receive callback FIRST
        const { serverReady, callbackReceived, cleanup } = createCallbackServer();
        await serverReady;

        // Get the login URL
        const loginUrl = await startLogin(REDIRECT_URI);

        // Open browser
        process.stdout.write('Opening browser for Tidal login...\n');
        process.stdout.write(`If browser doesn't open, visit: ${loginUrl}\n\n`);
        openUrl(loginUrl);

        // Wait for callback
        process.stdout.write('Waiting for login to complete...\n');
        const query = await callbackReceived;
        cleanup();

        // Complete login
        await completeLogin(query);

        process.stdout.write('\nLogin successful!\n');
      } catch (err) {
        process.stderr.write(`${formatCliError(err)}\n`);
        process.exit(1);
      }
    });

  return cmd;
}

interface CallbackServer {
  serverReady: Promise<void>;
  callbackReceived: Promise<string>;
  cleanup: () => void;
}

function createCallbackServer(): CallbackServer {
  let resolveReady: () => void;
  let resolveCallback: (query: string) => void;
  let rejectCallback: (err: Error) => void;

  const serverReady = new Promise<void>((resolve) => {
    resolveReady = resolve;
  });

  const callbackReceived = new Promise<string>((resolve, reject) => {
    resolveCallback = resolve;
    rejectCallback = reject;
  });

  const server = createServer((req, res) => {
    const url = new URL(req.url ?? '/', `http://localhost:${CALLBACK_PORT}`);

    if (url.pathname === '/callback') {
      // Send success page
      res.writeHead(200, { 'Content-Type': 'text/html' });
      res.end(`
        <!DOCTYPE html>
        <html>
        <head>
          <title>Tidal CLI - Login Successful</title>
          <style>
            body {
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
              display: flex;
              justify-content: center;
              align-items: center;
              height: 100vh;
              margin: 0;
              background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%);
              color: white;
            }
            .container {
              text-align: center;
              padding: 2rem;
            }
            h1 { color: #00ffff; }
            p { color: #ccc; }
          </style>
        </head>
        <body>
          <div class="container">
            <h1>Login Successful!</h1>
            <p>You can close this window and return to the terminal.</p>
          </div>
        </body>
        </html>
      `);

      resolveCallback(url.search);
    } else {
      res.writeHead(404);
      res.end('Not found');
    }
  });

  server.on('error', (err) => {
    rejectCallback(new Error(`Failed to start callback server: ${err.message}`));
  });

  server.listen(CALLBACK_PORT, '127.0.0.1', () => {
    resolveReady();
  });

  // Timeout after 5 minutes
  const timeout = setTimeout(() => {
    server.close();
    rejectCallback(new Error('Login timed out. Please try again.'));
  }, 5 * 60 * 1000);

  const cleanup = () => {
    clearTimeout(timeout);
    server.close();
  };

  return { serverReady, callbackReceived, cleanup };
}

