import fs from 'fs';
import path from 'path';
import { IScriptLine } from '../types';
import { connection_list, event_emitter, io, set_state } from './server';

// Field in milliseconds. To disable timeout, set this field to 0.
const ROBOT_WAIT_TIMEOUT = 60_000;

/**
 * Starts the presentation. Reads in lines from the CSV and communicates with each robot
 * to perform the given line. If a robot is not connected, it skips that robot's line.
 */
export async function start_presentation() {
  const csv_path = path.join(__dirname, './script.csv');
  const lines = read_script_csv(csv_path);

  // Script execution loop
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    // Fetch robot for that given line
    const connection = connection_list.find(
      (conn) => conn.id === line.robot_id
    );

    if (!connection) {
      console.log('[SERVER] Robot not found during presentation, moving on...');
      continue;
    }

    // Send line to robot
    connection.socket.emit('message', `LINE:${line.message}`);

    // Wait until robot completes their line
    await wait_robot(
      line.robot_id as string,
      'LINE_COMPLETE',
      ROBOT_WAIT_TIMEOUT
    );
  }

  console.log('[SERVER] Presentation is Complete');
  set_state('WAITING_CONNECTIONS');
}

/**
 * This function waits on a given robot to respond with a provided message, via Promise
 * @param robot_id id of the robot being waited on
 * @param message the message being waited on
 * @returns a promise that is only resolved when the robot responds with message
 */
function wait_robot(robot_id: string, message: string, wait = 0) {
  if (!robot_id) throw new Error('Robot not identified in script');

  return new Promise((resolve) => {
    // Timeout for misbehaving robots
    const timeout = setTimeout(() => {
      if (wait === 0) return;
      event_emitter.removeListener(message, check_robot);
      resolve(true);
    }, wait);

    // Wait for the robot to respond with the expected message
    const check_robot = (id: string) => {
      if (robot_id === id) {
        event_emitter.removeListener(message, check_robot);
        clearTimeout(timeout);
        resolve(true);
      }
    };

    event_emitter.on('LINE_COMPLETE', check_robot);
  });
}

/**
 * Reads and parses text from CSV, extracting each row in a separate object
 * @param path Path to the CSV
 * @returns Decoded data
 */
function read_script_csv(path: string) {
  const csv = fs.readFileSync(path).toString();
  const csv_lines = csv.split('\n');
  const header_fields = csv_lines[0].split(',');

  const lines = csv_lines.slice(1).map((entry) => {
    const line: Partial<Record<keyof IScriptLine, string>> = {};
    const csv_row = entry.split(',');

    for (let i = 0; i < header_fields.length; i++) {
      const field = header_fields[i] as keyof IScriptLine;
      line[field] = csv_row[i];
    }

    return line;
  });

  return lines;
}
