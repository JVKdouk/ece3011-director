# ECE 3011 - Director

This is the official director repository. It coordinates all robots following the script defined in `server/script.csv`. The script is composed of the robot_id, identified by each team and setup during the initial connection to the server, and the message, which can be the actual line or an index if you are using local storage. The Director is written in TypeScript and uses socket.io to manage all sockets. Other Socket solutions can be used to communicate with socket.io.

## Initial Connection

On your first connection to the server, you must use the web socket protocol (`ws://`) and provide the identifier to your robot as a query string (`robot_id=1`). The id must be the same as the one used in the CSV. The server will then validate your id and respond with IDENTIFIED if the identification is succesful. See client code for an example.

## Presentation

The server will wait for new robots to join the network. To start the presentation, type `start` in the console, and then press enter. The server will then read each line from the script and emit it to the correct robot (identified by the `robot_id`). As soon as your line comes, you will receive a `message` event from the server, with the payload as `LINE:<actual line or index>`. Once completed, you must send a `message` event to the server with `LINE_COMPLETE` as the payload. This will allow the server to move on to the next line in the script. If you take more than a fixed amount of time (to be defined by the instructors), the server will skip you and move on to the next robot in line.

If a given robot is not connected to the network prior to the start of the presentation, it will not be able to join and its lines will be entirely skipped.

## Server to Client Commands

| Command                     | Description                                                                                                                                                                                          |
| --------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| IDENTIFIED                  | Emitted after the initial connection. Tells the robot its robot_id was validated. This is only the moment you can assume the connection has been established. No more actions are required from you. |
| LINE:"actual line or index" | Emitted once it is your turn to speak. You must respond with a LINE_COMPLETE message event once you are done                                                                                         |
| PRESENTATION_COMPLETE       | Emitted once the presentation is complete. You can act upon it, or just ignore.                                                                                                                      |
| FAILED:"reason"             | Emitted if your connection/identification fails for some reason. Reason is provided as data                                                                                                          |

## Client to Server Commands

| Command       | Description                                                                                                                                        |
| ------------- | -------------------------------------------------------------------------------------------------------------------------------------------------- |
| LINE_COMPLETE | Instructs the server to move on to the next line, since you are finished with yours. This will cause the server to move to the next robot in line. |

## Running the Server

To run the server locally, you will only need to install Node.JS (via https://nodejs.org/en/ or using nvm). Once node is installed, you will be able to build the server locally using `npm i` and run it via `npm run server`. You can also run it using yarn (`yarn server`). The same procedure applies to running the client locally.

To change the port the server is running on, edit `server/server.ts` PORT variable to a port of your choosing. Once the server starts, you can connect your socket instance to it. To start the presentation, use the `start` command, and then press enter.

It is important to notice that the server **DOES NOT** start when all robots are connected. This is a design choice to allow for fine-grained control of the server behavior.

## Running the Client

Running the client involves the same procedure as above. The client is a simple demonstration of the director. You can use it as a basis for the design of your solution. Once you get a line, using the client, use the `complete` command to send the `LINE_COMPLETE` message event. In your design, your robot should emit this command once your work is complete.

To change the local server address, update the HOST variable in `client/client.ts`. To change the robot_id, edit ROBOT_ID variable in `client/client.ts`.
