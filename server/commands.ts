import readline from 'readline';
import { set_state } from './server';

/**
 * CLI Commands Parser. Any commands inputed via STDIN are read by this function
 * and matched against the following list:
 * - start: Starts the presentation and closes the pipe to any pending connections
 * @param text
 */
function cli_command_parser(text: string) {
  switch (text) {
    case 'start':
      set_state('RUNNING_PRESENTATION');
      break;
  }
}

readline
  .createInterface({
    input: process.stdin,
    output: process.stdout,
    terminal: false,
  })
  .on('line', cli_command_parser);
