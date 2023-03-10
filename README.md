# ECE 3011 - Director

This is the official director repository. It coordinates all robots following the script defined in `server/script.csv`. The script is composed of the robot_id, identified by each team and setup during the initial connection to the server, and the message, which can be the actual line or an index if you are using local storage. The Director is written in TypeScript and uses socket.io to manage all sockets. Other Socket solutions can be used to communicate with socket.io.

## Initial Connection

On your first connection to the server, you must use the web socket protocol (`ws://`) and provide the identifier to your robot as a query string (`robot_id=1`). The id must be the same as the one used in the CSV. The server will then validate your id and respond with IDENTIFIED if the identification is succesful. See client code for an example.

## Presentation

The server will wait for new robots to join the network. To start the presentation, type `start` in the console, and then press enter. The server will then read each line from the script and emit it to the correct robot (identified by the `robot_id`). As soon as your line comes, you will receive a `message` event from the server, with the payload as `LINE:<actual line or index>`. Once completed, you must send a `message` event to the server with `LINE_COMPLETE` as the payload. This will allow the server to move on to the next line in the script. If you take more than a fixed amount of time (to be defined by the instructors), the server will skip you and move on to the next robot in line.

If a given robot is not connected to the network prior to the start of the presentation, it will not be able to join and its lines will be entirely skipped.

## Server to Client Commands

Every command sent from the server to a client is formatted as a JSON, following the structure { cmd: "Command", data: "Message" }. All commands that can be issued by the server are explained in the table below:

| Command               | Description                                                                                                                                                                                          |
| --------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| IDENTIFIED            | Emitted after the initial connection. Tells the robot its robot_id was validated. This is only the moment you can assume the connection has been established. No more actions are required from you. |
| LINE                  | Emitted once it is your turn to speak. You must respond with a LINE_COMPLETE message event once you are done.                                                                                        |
| ECHO                  | If the server is running in Echo mode, it you just echo back all command issue from a client.                                                                                                        |
| LINES                 | If the server is running in Echo mode, then all lines are sent after the initial connection.                                                                                                         |
| PRESENTATION_COMPLETE | Emitted once the presentation is complete. You can act upon it, or just ignore.                                                                                                                      |
| FAILED                | Emitted if your connection/identification fails for some reason. Reason is provided as data.                                                                                                         |

## Client to Server Commands

All commands from client to server are composed of a JSON string, following the same format as the server. Clients should send the JSON object as { cmd: "<command>", data: "<data>" }. It is acceptable to send no data. Below there is a list of commands that the client can send:

| Command       | Description                                                                                                                                                                       |
| ------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| IDENTIFY      | Performs the identification procedure on the server. Data must be the name of the robot, as defined in the CSV. Should be the first data exchanged after connection is successful |
| LINE_COMPLETE | Instructs the server to move on to the next line, since you are finished with yours. This will cause the server to move to the next robot in line.                                |

## Running the Server

To run the server locally, you will only need to install Node.JS (via https://nodejs.org/en/ or using nvm). Once node is installed, you will be able to build the server locally using `npm i` and run it via `npm run server`. You can also run it using yarn (`yarn server`). The same procedure applies to running the client locally.

To change the port the server is running on, edit `server/server.ts` PORT variable to a port of your choosing. Once the server starts, you can connect your socket instance to it. To start the presentation, use the `start` command, and then press enter.

It is important to notice that the server **DOES NOT** start when all robots are connected. This is a design choice to allow for fine-grained control of the server behavior.

The server can be run in echo mode with the `-m echo` argument. Whenever a connection happens in this mode, the server replies to the robot will all of its lines as an array (LINES command followed by all lines in the data property). If you issue a command to the server, it will simply echo the command back to you via the "ECHO" command.

## Running the Client

To run the client, you must have Python 3 installed locally, since the client is a Python script. By simply running `yarn client` or `python3 client/client.py`, the client will spin up.
