import net from 'net';
import events from 'events';
import cli_arg_parser from './cli';
import { SERVER_MODE, SERVER_STATE } from '../types';
import { start_presentation } from './presentation';
import handle_connection, { broadcast } from './connection';

const PORT = 3333;

export const server = net.createServer();
export const event_emitter = new events.EventEmitter();

export let server_mode: keyof typeof SERVER_MODE = 'NORMAL';
export let server_state: keyof typeof SERVER_STATE = 'WAITING_CONNECTIONS';

/**
 * Sets the current server state. System can react to a change of state.
 * @param state New state of the server.
 */
export function set_state(state: keyof typeof SERVER_STATE) {
  server_state = state;

  switch (state) {
    case 'RUNNING_PRESENTATION':
      console.log('[SERVER] Starting Presentation...');
      start_presentation();
      break;

    case 'WAITING_CONNECTIONS':
      broadcast(
        JSON.stringify({
          cmd: 'PRESENTATION_COMPLETE',
          data: null,
        })
      );
      break;
  }
}

export function set_mode(mode: keyof typeof SERVER_MODE) {
  server_mode = mode;
}

cli_arg_parser();

// Listeners
server.on('connection', handle_connection);
server.on('error', () => null); // Protect server from misbehaving clients
server.listen(PORT, () => console.log('[SERVER] Listening on port 3333'));
