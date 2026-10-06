# YPass kiosk machine

This is the separate Node.js kiosk project for a physical hall-pass machine. It runs independently from the central server, displays kiosk-specific status, and sends heartbeat and pass events to the backend service.

## Quick start

```bash
cd kioskMachine
cp .env.example .env
npm test
npm start
```

Then open http://localhost:4177 in the browser or use the kiosk shell as a local kiosk application.

## Environment

- `KIOSK_CODE`: unique kiosk identifier, such as `KSK-204`
- `KIOSK_NAME`: friendly kiosk label
- `KIOSK_LOCATION`: assigned physical location
- `KIOSK_SECRET`: kiosk authentication credential
- `KIOSK_PORT`: port to bind the kiosk app
- `KIOSK_SERVER_URL`: central server URL used for heartbeat and pass submissions
- `KIOSK_HEARTBEAT_MS`: heartbeat interval in milliseconds

## Responsibilities

- display the assigned kiosk and location
- verify student identity using student number and name
- request pass creation or kiosk scanning events
- send periodic heartbeat messages to the central server
- secure the kiosk credential separate from the kiosk code

## Notes

This project intentionally avoids trusting the client for pass rules. All important pass decisions remain enforced by the central server.
