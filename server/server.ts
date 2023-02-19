import net from 'net';
import { SERVER_STATE, Socket } from '../types';
import { start_presentation } from './presentation';
import events from 'events';
import handle_connection, {
  broadcast,
  get_robot_id,
  identify_robot,
} from './connection';
import cli_arg_parser from './cli';

const PORT = 3333;

export const server = net.createServer();
export const event_emitter = new events.EventEmitter();

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

/**
 * Every message from a robot pass through this function. A new message creates
 * a system-wide event that the right listener will react to.
 * @param message Message that was received
 * @param robot_id Id of the robot that sent the message
 * @param socket Socket from which the message came from
 */
export function handle_message(
  message: Record<string, unknown>,
  socket: Socket
) {
  if (message.cmd === 'IDENTIFY') {
    return identify_robot(socket, message.data as string);
  }

  if (server_state === 'ECHOING') {
    return socket.write(JSON.stringify({ cmd: 'ECHO', data: message }));
  }

  const robot_id = get_robot_id(socket);
  event_emitter.emit(message.cmd as string, message.data, robot_id, socket);
}

cli_arg_parser();

// Listeners
server.on('connection', handle_connection);
server.on('error', () => null); // Protect server from misbehaving clients
server.listen(PORT, () => console.log('[SERVER] Listening on port 3333'));
