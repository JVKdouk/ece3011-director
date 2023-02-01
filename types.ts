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
