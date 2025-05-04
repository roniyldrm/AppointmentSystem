package websocket

import (
	"encoding/json"
	"log"
	"time"

	"github.com/google/uuid"
	"github.com/gorilla/websocket"
)

const (
	// Time allowed to write a message to the peer.
	writeWait = 10 * time.Second

	// Time allowed to read the next pong message from the peer.
	pongWait = 60 * time.Second

	// Send pings to peer with this period. Must be less than pongWait.
	pingPeriod = (pongWait * 9) / 10

	// Maximum message size allowed from peer.
	maxMessageSize = 512
)

// NewClient creates a new Client instance
func NewClient(conn *websocket.Conn, manager *ClientManager, userType, userCode string) *Client {
	return &Client{
		ID:       uuid.New().String(),
		UserType: userType,
		UserCode: userCode,
		socket:   conn,
		send:     make(chan []byte, 256),
		manager:  manager,
	}
}

// Read reads messages from the WebSocket connection
func (c *Client) Read() {
	defer func() {
		c.manager.Unregister(c)
		c.socket.Close()
	}()

	c.socket.SetReadLimit(maxMessageSize)
	c.socket.SetReadDeadline(time.Now().Add(pongWait))
	c.socket.SetPongHandler(func(string) error {
		c.socket.SetReadDeadline(time.Now().Add(pongWait))
		return nil
	})

	for {
		_, message, err := c.socket.ReadMessage()
		if err != nil {
			if websocket.IsUnexpectedCloseError(err, websocket.CloseGoingAway, websocket.CloseAbnormalClosure) {
				log.Printf("error: %v", err)
			}
			break
		}

		// Process incoming messages if needed
		// For now, we're just handling outgoing notifications
		log.Printf("Received message: %s", message)
	}
}

// Write writes messages to the WebSocket connection
func (c *Client) Write() {
	ticker := time.NewTicker(pingPeriod)
	defer func() {
		ticker.Stop()
		c.socket.Close()
	}()

	for {
		select {
		case message, ok := <-c.send:
			c.socket.SetWriteDeadline(time.Now().Add(writeWait))
			if !ok {
				// The manager closed the channel.
				c.socket.WriteMessage(websocket.CloseMessage, []byte{})
				return
			}

			w, err := c.socket.NextWriter(websocket.TextMessage)
			if err != nil {
				return
			}
			w.Write(message)

			// Add queued messages to the current websocket message
			n := len(c.send)
			for i := 0; i < n; i++ {
				w.Write(<-c.send)
			}

			if err := w.Close(); err != nil {
				return
			}
		case <-ticker.C:
			c.socket.SetWriteDeadline(time.Now().Add(writeWait))
			if err := c.socket.WriteMessage(websocket.PingMessage, nil); err != nil {
				return
			}
		}
	}
}

// SendNotification sends a notification to the client
func (c *Client) SendNotification(notificationType string, content interface{}) {
	message := Message{
		Type:    notificationType,
		Content: content,
	}

	jsonMessage, err := json.Marshal(message)
	if err != nil {
		log.Println("Error marshaling notification:", err)
		return
	}

	c.send <- jsonMessage
}
