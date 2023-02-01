import { Server, Socket } from 'socket.io';
import { SERVER_STATE } from '../types';
import { start_presentation } from './presentation';
import express from 'express';
import http from 'http';
import events from 'events';

import './commands';

const PORT = 3333;

export const app = express();
export const server = http.createServer(app);
export const io = new Server(server);
export const event_emitter = new events.EventEmitter();

export const connection_list: { socket: Socket; id: string }[] = [];
export let server_state: keyof typeof SERVER_STATE = 'WAITING_CONNECTIONS';

/**
 * Handle a new connection to the director. The identification procedure is used
 * to select which lines a given robot will speak.
 * @param socket data packet containing connection details
 */
function handle_connection(socket: Socket) {
  if (server_state !== 'WAITING_CONNECTIONS') {
    socket.emit('message', 'FAILED:Not accepting new connections');
    console.log('[SERVER] Failure: Not accepting new connections');
    return;
  }

  console.log('[SERVER] Connection request from', socket.handshake.address);

  // Robot identification procedure
  const robot_id = socket.handshake.query.robot_id as string;

  if (!robot_id) {
    socket.emit('message', 'FAILED:Identification not provided');
    console.log('[SERVER] Failure: No identification');
    return;
  }

  const is_duplicate =
    connection_list.findIndex((entry) => entry.id === robot_id) > -1;

  if (is_duplicate) {
    socket.emit('message', 'FAILED:Already registered');
    console.log('[SERVER] Failure: Duplicate robot_id');
    return;
  }

  console.log('[SERVER] Identified as', robot_id);
  socket.emit('message', 'IDENTIFIED');

  // Store connection
  connection_list.push({ socket, id: robot_id });
  console.log('[SERVER] Connection complete\n');

  socket.on('message', (message) => handle_message(message, robot_id, socket));

  socket.on('disconnect', () => {
    // Remove the robot from the connection list
    const index = connection_list.findIndex(
      (conn) => conn.socket.id === socket.id
    );

    if (index > -1) connection_list.splice(index, 1);

    console.log(`[SERVER] ${socket.id} disconnected...\n`);
  });
}

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
      io.sockets.emit('message', 'PRESENTATION_COMPLETE');
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
function handle_message(message: string, robot_id: string, socket: Socket) {
  event_emitter.emit(message, robot_id, socket);
}

// Socket Listeners
io.on('connection', handle_connection);

// Server Listener
server.listen(PORT, () => console.log('[SERVER] Running on port 3333...\n'));
