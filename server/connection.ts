import net from 'net';
import { Socket } from '../types';
import { presentation_lines } from './presentation';
import { event_emitter, server_state } from './server';
import { v4 as uuid } from 'uuid';

export const connection_list: { socket: Socket; robot_id: string | null }[] =
  [];

function fail(socket: Socket, message: string) {
  socket.write(JSON.stringify({ cmd: 'FAILED', data: message }));
  console.log(`[SERVER] Failed: ${message}`);
}

// Robot identification procedure
export function identify_robot(socket: Socket, robot_id: string) {
  if (!robot_id) return fail(socket, 'Identification not provided');

  const conn_index = connection_list.findIndex(
    (entry) => entry.socket.id === socket.id
  );

  if (conn_index === -1) return fail(socket, 'Not connected');
  connection_list[conn_index].robot_id = robot_id;

  // Perform Acknowledgement
  socket.write(JSON.stringify({ cmd: 'IDENTIFY', data: true }));
  console.log('[SERVER]', socket.id, 'identified as', robot_id);

  if (server_state === 'ECHOING') handle_echo(socket, robot_id);

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
  console.log('[SERVER] Sending lines to', robot_id);

  const lines = presentation_lines
    .filter((entry) => entry.robot_id === robot_id)
    .map((line) => line.message);

  socket.write(JSON.stringify({ cmd: 'LINES', data: lines }));
}

export function get_robot_id(socket: Socket) {
  const robot_id =
    connection_list.find((entry) => socket.id === entry.socket.id)?.robot_id ||
    null;

  return robot_id;
}

export function broadcast(message: string) {
  for (let i = 0; i < connection_list.length; i++) {
    connection_list[i].socket.write(message);
  }
}

/**
 * Handle a new connection to the director. The identification procedure is used
 * to select which lines a given robot will speak.
 * @param socket data packet containing connection details
 */
function handle_connection(socket: Socket) {
  if (server_state === 'RUNNING_PRESENTATION')
    return fail(socket, 'Not accepting new connections');

  socket.id = uuid();
  console.log('[SERVER] Connection from', socket.remoteAddress);

  // Store connection
  connection_list.push({ socket, robot_id: null });

  // Attach listeners
  socket.on('close', () => handle_disconnect(socket));
  socket.on('error', () => handle_disconnect(socket));
  socket.on('data', (message) => {
    try {
      handle_message(JSON.parse(message.toString()), socket);
    } catch (e) {
      console.log('[SERVER] Invalid message from', socket.id);
    }
  });
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

export default handle_connection;
