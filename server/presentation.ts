import path from 'path';
import parse_csv from '../utils/parse_csv';
import wait_robot from '../utils/wait_robot';
import { IScriptLine } from '../types';
import { set_state } from './server';
import { connection_list } from './connection';

// Field in milliseconds. To disable timeout, set this field to 0.
const ROBOT_WAIT_TIMEOUT = 60_000;

const csv_path = path.join(__dirname, './script.csv');
export const presentation_lines = parse_csv<IScriptLine>(csv_path);

/**
 * Starts the presentation. Reads in lines from the CSV and communicates with each robot
 * to perform the given line. If a robot is not connected, it skips that robot's line.
 */
export async function start_presentation() {
  // Script execution loop
  for (let i = 0; i < presentation_lines.length; i++) {
    const line = presentation_lines[i];

    // Fetch robot for that given line
    const connection = connection_list.find(
      (conn) => conn.robot_id === line.robot_id
    );

    if (!connection) {
      console.log('[SERVER] Robot not found during presentation, moving on...');
      continue;
    }

    // Send line to robot
    connection.socket.write(
      JSON.stringify({ cmd: 'LINE', data: line.message })
    );

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
