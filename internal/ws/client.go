package ws

import (
	"log"

	"github.com/gofiber/websocket/v2"
)

// HandleClient is the Fiber WebSocket handler for each connected client.
// It registers the client, reads messages (ping/keepalive), and cleans up on disconnect.
func HandleClient(c *websocket.Conn) {
	GlobalHub.Register(c)
	defer func() {
		GlobalHub.Unregister(c)
		c.Close()
	}()

	for {
		// Keep connection alive; accept ping/pong from client
		_, _, err := c.ReadMessage()
		if err != nil {
			if websocket.IsUnexpectedCloseError(err, websocket.CloseGoingAway, websocket.CloseAbnormalClosure) {
				log.Printf("[WS] Unexpected close: %v", err)
			}
			break
		}
	}
}
