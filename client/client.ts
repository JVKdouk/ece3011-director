import { io } from 'socket.io-client';
import { CLIENT_STATE, ServerCommands } from '../types';
import readline from 'readline';

// Initial Setup
const HOST = 'localhost:3333'; // Server Address
const PROTOCOL = 'ws://'; // Use Web Socket Protocol
const ROBOT_ID = 'Angel'; // Robot ID can be a number or a string, it does not matter

let status: keyof typeof CLIENT_STATE = 'PENDING_CONNECTION';
const socket = io(`${PROTOCOL}${HOST}`, { query: { robot_id: ROBOT_ID } });

/**
 * Server can send commands to the robot. Those commands come in the form of COMMAND,
 * or COMMAND:DATA. Each command from the server must be evaluated and handled by the
 * robot independently.
 * @param text Server payload to be processed
 */
function command_parser(text: string) {
  const payload = text.split(':');
  const command = payload[0] as keyof typeof ServerCommands;
  const data = payload[1];

  switch (command) {
    // Once the connection is established, the server will check for the robot id. If the
    // is correctly identified, the server send an "IDENTIFIED" message.
    case 'IDENTIFIED':
      console.log('[CLIENT] Identified Successfuly');
      status = 'CONNECTED';
      break;

    // During the presentation, if the server requires a given line to be read by the robot,
    // it will send the LINE command, followed by the message as data. If you use local storage
    // scripts, you will receive an index of your choice to that script.
    case 'LINE':
      console.log('[CLIENT] Got Line', data);
      break;

    // As soon as the presentation is complete, the server responds with PRESENTATION_COMPLETE.
    // You can react to this status or just ignore it.
    case 'PRESENTATION_COMPLETE':
      console.log('[CLIENT] Presentation is Complete');
      break;

    // During the presentation, if the server requires a given line to be read by the robot,
    // it will send the LINE command, followed by the message as data. If you use local storage
    // scripts, you will receive an index of your choice to that script.
    case 'FAILED':
      console.log('[CLIENT] Connection Failed:', data);
      break;
  }
}

function handle_connection() {
  console.log('[CLIENT] Connection Established');
  status = 'PENDING_IDENTIFICATION';
}

/**
 * Local commands to be used by the client. As soon as the robot is done processing their lines,
 * the LINE_COMPLETE message must be emitted to the server, allowing it to move forward. The server
 * has a timeout for this step, so make sure you are within the allocated time.
 * @param text
 */
function handle_cli_command(text: string) {
  switch (text) {
    case 'complete':
      socket.emit('message', 'LINE_COMPLETE');
      break;
  }
}

// Event Handlers
socket.on('connect', handle_connection);
socket.on('message', command_parser);

// STDIN reader for local commands.
readline
  .createInterface({
    input: process.stdin,
    output: process.stdout,
    terminal: false,
  })
  .on('line', handle_cli_command);
