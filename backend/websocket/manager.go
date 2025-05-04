package websocket

import (
	"sync"

	"github.com/gorilla/websocket"
)

// ClientManager manages WebSocket client connections
type ClientManager struct {
	clients       map[*Client]bool
	userClients   map[string][]*Client // Map userCode to clients
	doctorClients map[string][]*Client // Map doctorCode to clients
	adminClients  []*Client
	broadcast     chan []byte
	register      chan *Client
	unregister    chan *Client
	mutex         sync.Mutex
}

// Client represents a WebSocket client connection
type Client struct {
	ID       string
	UserType string // "user", "doctor", "admin"
	UserCode string
	socket   *websocket.Conn
	send     chan []byte
	manager  *ClientManager
}

// Message represents a message to be sent over WebSocket
type Message struct {
	Type    string      `json:"type"`
	Content interface{} `json:"content"`
}

// NewManager creates a new client manager
func NewManager() *ClientManager {
	return &ClientManager{
		clients:       make(map[*Client]bool),
		userClients:   make(map[string][]*Client),
		doctorClients: make(map[string][]*Client),
		adminClients:  []*Client{},
		broadcast:     make(chan []byte),
		register:      make(chan *Client),
		unregister:    make(chan *Client),
	}
}

// Start starts the client manager
func (manager *ClientManager) Start() {
	for {
		select {
		case client := <-manager.register:
			manager.mutex.Lock()
			manager.clients[client] = true

			// Add client to appropriate user/doctor/admin list
			if client.UserType == "user" {
				manager.userClients[client.UserCode] = append(manager.userClients[client.UserCode], client)
			} else if client.UserType == "doctor" {
				manager.doctorClients[client.UserCode] = append(manager.doctorClients[client.UserCode], client)
			} else if client.UserType == "admin" {
				manager.adminClients = append(manager.adminClients, client)
			}

			manager.mutex.Unlock()

		case client := <-manager.unregister:
			manager.mutex.Lock()
			if _, ok := manager.clients[client]; ok {
				delete(manager.clients, client)
				close(client.send)

				// Remove from user/doctor/admin list
				if client.UserType == "user" {
					clients := manager.userClients[client.UserCode]
					for i, c := range clients {
						if c == client {
							manager.userClients[client.UserCode] = append(clients[:i], clients[i+1:]...)
							break
						}
					}
				} else if client.UserType == "doctor" {
					clients := manager.doctorClients[client.UserCode]
					for i, c := range clients {
						if c == client {
							manager.doctorClients[client.UserCode] = append(clients[:i], clients[i+1:]...)
							break
						}
					}
				} else if client.UserType == "admin" {
					for i, c := range manager.adminClients {
						if c == client {
							manager.adminClients = append(manager.adminClients[:i], manager.adminClients[i+1:]...)
							break
						}
					}
				}
			}
			manager.mutex.Unlock()

		case message := <-manager.broadcast:
			for client := range manager.clients {
				select {
				case client.send <- message:
				default:
					close(client.send)
					delete(manager.clients, client)
				}
			}
		}
	}
}

// SendToUser sends a message to a specific user
func (manager *ClientManager) SendToUser(userCode string, message []byte) {
	manager.mutex.Lock()
	defer manager.mutex.Unlock()

	if clients, ok := manager.userClients[userCode]; ok {
		for _, client := range clients {
			client.send <- message
		}
	}
}

// SendToDoctor sends a message to a specific doctor
func (manager *ClientManager) SendToDoctor(doctorCode string, message []byte) {
	manager.mutex.Lock()
	defer manager.mutex.Unlock()

	if clients, ok := manager.doctorClients[doctorCode]; ok {
		for _, client := range clients {
			client.send <- message
		}
	}
}

// SendToAdmin sends a message to all admin users
func (manager *ClientManager) SendToAdmin(message []byte) {
	manager.mutex.Lock()
	defer manager.mutex.Unlock()

	for _, client := range manager.adminClients {
		client.send <- message
	}
}

// SendToAll sends a message to all connected clients
func (manager *ClientManager) SendToAll(message []byte) {
	manager.broadcast <- message
}

// Register registers a new client
func (manager *ClientManager) Register(client *Client) {
	manager.register <- client
}

// Unregister unregisters a client
func (manager *ClientManager) Unregister(client *Client) {
	manager.unregister <- client
}
