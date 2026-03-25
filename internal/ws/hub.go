package ws

import (
	"encoding/json"
	"log"
	"sync"

	"github.com/gofiber/websocket/v2"
)

// Event is the structure of every WebSocket message sent to clients.
type Event struct {
	Type   string `json:"type"`   // seat_reserved | seat_released | seat_booked
	SeatID int64  `json:"seat_id"`
	Status string `json:"status"` // reserved | available | booked
}

// Hub maintains all active WebSocket clients and routes broadcasts.
type Hub struct {
	mu      sync.RWMutex
	clients map[*websocket.Conn]bool
}

var GlobalHub = &Hub{
	clients: make(map[*websocket.Conn]bool),
}

// Register adds a client to the hub.
func (h *Hub) Register(conn *websocket.Conn) {
	h.mu.Lock()
	defer h.mu.Unlock()
	h.clients[conn] = true
	log.Printf("[WS] Client connected, total: %d", len(h.clients))
}

// Unregister removes a client from the hub.
func (h *Hub) Unregister(conn *websocket.Conn) {
	h.mu.Lock()
	defer h.mu.Unlock()
	delete(h.clients, conn)
	log.Printf("[WS] Client disconnected, total: %d", len(h.clients))
}

// Broadcast sends an event JSON to all connected clients.
func (h *Hub) Broadcast(event Event) {
	payload, err := json.Marshal(event)
	if err != nil {
		log.Printf("[WS] Failed to marshal event: %v", err)
		return
	}

	h.mu.RLock()
	defer h.mu.RUnlock()

	for conn := range h.clients {
		if err := conn.WriteMessage(websocket.TextMessage, payload); err != nil {
			log.Printf("[WS] Write error (client will be cleaned up): %v", err)
		}
	}
}
