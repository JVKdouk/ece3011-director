import socket
import json
import time

# Global Constants
DIRECTOR_HOST = "localhost"
DIRECTOR_PORT = 3333

CONNECTION_RETRY = 5          # Number of Tries before failrue
CONNECTION_RETRY_DELAY = 5000 # Milliseconds
STATUS = 'CONNECTING'         # System Status (CONNECTING, CONNECTED, RUNNING, FAILED)
ROBOT_ID = 'Charlie'

# Global Variables
s = socket.socket(socket.AF_INET, socket.SOCK_STREAM) # TCP + IPv4

# Initialization Procedure
def main():
  connect(DIRECTOR_HOST, DIRECTOR_PORT)
  if (STATUS != 'CONNECTED'): return print("Failed connection, exiting")

  try:
    while True:
      decode_message(s.recv(1024).decode())
  except socket.error:
    print("[CLIENT] Failed...", )
    s.close()

# Perform initial connection and identification procedure
def connect(host, port):
  global STATUS

  s.connect((host, port))

  # Perform identification procedure
  message = encode_json({ "cmd": "IDENTIFY", "data": ROBOT_ID })
  s.send(message)
  
  # Verify identification was successful
  callback = json.loads(s.recv(1024).decode())
  if (callback['cmd'] == 'IDENTIFY' and callback['data'] == True):
    print("[CLIENT] Connection successful")
    STATUS = 'CONNECTED'
    return
  
  # Identification was unsuccessful
  print("[CLIENT] Connection failed")
  STATUS = 'FAILED'

# Central message decoder. Decodes the JSON message and performs actions
# based on the message.
def decode_message(message):
  payload = json.loads(message)
  
  match (payload['cmd']):
    # Line given by the server once presentation starts and it is your turn
    case 'LINE':
      perform(payload['data'])

    # Server signal that the presentation is complete
    case 'PRESENTATION_COMPLETE':
      print("[CLIENT] Presentation is complete")
    
    # All lines for a given robot. Given by the server during initial connection
    # when running in echo mode
    case 'LINES':
      print("[CLIENT] Got lines:", payload['data'])

    # When the server is running in echo mode, all messages sent to it
    # will be returned to oring
    case 'ECHO':
      print('[CLIENT] Got echo from server:', payload['data'])

    # If the command does not match any of the commands above, move on
    case _:
      print('[CLIENT] Got undefined response from server:', payload['cmd'])

# Handles a given line as handed by the server. In this implementation,
# it waits 5 seconds and sends back LINE_COMPLETE to the server, which
# allows the server to move on with the presentation
def perform(line):
  print("[CLIENT] Got a line:", line)
  time.sleep(5)
  s.send(encode_json({ "cmd": "LINE_COMPLETE" }))
  print("[CLIENT] Sent line complete")

def encode_json(obj):
  return json.dumps(obj, separators=(',', ':')).encode()

main()