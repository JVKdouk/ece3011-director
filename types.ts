import net from 'net';

export enum SERVER_MODE {
  NORMAL,
  ECHO,
}

export enum SERVER_STATE {
  RUNNING_PRESENTATION,
  WAITING_CONNECTIONS,
}

export enum CLIENT_STATE {
  CONNECTED,
  PENDING_IDENTIFICATION,
  PENDING_CONNECTION,
  FAILED,
}

export interface IScriptLine {
  robot_id: string;
  message: string;
}

export enum ServerCommands {
  IDENTIFIED,
  LINE,
  PRESENTATION_COMPLETE,
  FAILED,
}

export enum ClientCommands {
  LINE_COMPLETE,
}

export class Socket extends net.Socket {
  id?: string;
}
