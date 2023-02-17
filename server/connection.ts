import { Socket } from 'socket.io';
import { presentation_lines } from './presentation';
import { handle_message, server_state } from './server';

export const connection_list: { socket: Socket; robot_id: string }[] = [];

function fail(socket: Socket, message: string) {
  socket.emit('message', { cmd: 'FAILED', data: message });
  console.log(`[SERVER] Failed: ${message}`);
}

// Robot identification procedure
function identify_robot(socket: Socket) {
  const robot_id = socket.handshake.query.robot_id as string;
  if (!robot_id) return fail(socket, 'Identification not provided');

  const is_duplicate =
    connection_list.findIndex((entry) => entry.robot_id === robot_id) > -1;
  if (is_duplicate) return fail(socket, 'Already registered');

  // Store connection
  connection_list.push({ socket, robot_id });

  // Acknowledge Connection
  socket.emit('message', { cmd: 'IDENTIFIED', data: null });

  return robot_id;
}

// Remove robot from connection list
function handle_disconnect(socket: Socket) {
  const index = connection_list.findIndex(
    (conn) => conn.socket.id === socket.id
  );

  if (index === -1) return;

  const robot_id = connection_list[index].robot_id;
  connection_list.splice(index, 1);
  console.log(`[SERVER] ${socket.id} (${robot_id}) disconnected...\n`);
}

// Echo all lines back to the robot on connect
function handle_echo(socket: Socket, robot_id: string) {
  console.log('[SERVER] Sending Lines');

  const lines = presentation_lines
    .filter((entry) => entry.robot_id === robot_id)
    .map((line) => line.message);

  socket.emit('message', { cmd: 'LINES', data: lines });
}

/**
 * Handle a new connection to the director. The identification procedure is used
 * to select which lines a given robot will speak.
 * @param socket data packet containing connection details
 */
function handle_connection(socket: Socket) {
  if (server_state === 'RUNNING_PRESENTATION')
    return fail(socket, 'Not accepting new connections');

  console.log('[SERVER] Connection request from', socket.handshake.address);

  const robot_id = identify_robot(socket);
  if (!robot_id) return;

  console.log('[SERVER] Identified as', robot_id);

  if (server_state === 'ECHOING') handle_echo(socket, robot_id);

  // Attach listeners
  socket.on('message', (message) => handle_message(message, robot_id, socket));
  socket.on('disconnect', () => handle_disconnect(socket));
}

export default handle_connection;
