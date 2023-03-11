import { event_emitter } from '../server/server';

/**
 * This function waits on a given robot to respond with a provided message, via Promise
 * @param robot_id id of the robot being waited on
 * @param message the message being waited on
 * @returns a promise that is only resolved when the robot responds with message
 */
function wait_robot(robot_id: string, message: string, timeout = 0) {
  if (!robot_id) return;

  return new Promise((resolve) => {
    // Timeout for misbehaving robots
    const timeoutId = setTimeout(() => {
      if (timeout === 0) return;
      event_emitter.removeListener(message, check_robot);
      resolve(true);
    }, timeout);

    // Wait for the robot to respond with the expected message
    const check_robot = (data: any, id: string) => {
      if (robot_id === id) {
        event_emitter.removeListener(message, check_robot);
        clearTimeout(timeoutId);
        resolve(true);
      }
    };

    event_emitter.on(message, check_robot);
  });
}

export default wait_robot;
