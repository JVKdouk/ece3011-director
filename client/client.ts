import { io } from 'socket.io-client';
import { CLIENT_STATE } from '../types';
import readline from 'readline';

// Variables and Constants
const HOST = '192.168.1.66:3333';
const PROTOCOL = 'ws://';
const ROBOT_ID = 2;

let status: keyof typeof CLIENT_STATE = 'PENDING_CONNECTION';

// Perform initial socket setup
const socket = io(`${PROTOCOL}${HOST}`, { query: { robot_id: ROBOT_ID } });

function command_parser(text: string) {
  const payload = text.split(':');
  const command = payload[0];
  const data = payload[1];

  switch (command) {
    case 'IDENTIFIED':
      console.log('[CLIENT] Identified Successfuly');
      status = 'CONNECTED';
      break;
    case 'LINE':
      console.log('[CLIENT] Got Line', data);
      break;
  }
}

function handle_connection() {
  console.log('[CLIENT] Connection Established');
  status = 'PENDING_IDENTIFICATION';
}

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
  terminal: false,
});

function handle_cli_command(text: string) {
  switch (text) {
    case 'complete':
      socket.emit('message', 'LINE_COMPLETE');
      break;
  }
}

rl.on('line', handle_cli_command);

// Event Handlers
socket.on('connect', handle_connection);
socket.on('message', command_parser);
