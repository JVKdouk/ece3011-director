import { Server, Socket } from 'socket.io';
import { SERVER_STATE } from '../types';
import { start_presentation } from './presentation';
import express from 'express';
import http from 'http';
import events from 'events';
import handle_connection from './connection';
import cli_arg_parser from './cli';

const PORT = 3333;

export const app = express();
export const server = http.createServer(app);
export const io = new Server(server);
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
      io.sockets.emit('message', { cmd: 'PRESENTATION_COMPLETE', data: null });
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
  message: string,
  robot_id: string,
  socket: Socket
) {
  if (server_state === 'ECHOING')
    socket.emit('message', { cmd: 'ECHO', data: message });

  event_emitter.emit(message, robot_id, socket);
}

cli_arg_parser();

// Listeners
io.on('connection', handle_connection);
server.listen(PORT, () => console.log('[SERVER] Running on port 3333...\n'));
