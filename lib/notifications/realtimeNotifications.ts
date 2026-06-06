// Real-time notification delivery system
// This handles delivering notifications to users in real-time

export interface RealtimeNotification {
  type: string;
  recipientId: string;
  title: string;
  message: string;
  metadata?: any;
  timestamp: number;
}

class RealtimeNotificationService {
  private static instance: RealtimeNotificationService;
  private connections = new Map<string, Set<WebSocket>>();
  private notificationQueue = new Map<string, RealtimeNotification[]>();

  static getInstance(): RealtimeNotificationService {
    if (!RealtimeNotificationService.instance) {
      RealtimeNotificationService.instance = new RealtimeNotificationService();
    }
    return RealtimeNotificationService.instance;
  }

  // Add a WebSocket connection for a user
  addConnection(userId: string, ws: WebSocket): void {
    if (!this.connections.has(userId)) {
      this.connections.set(userId, new Set());
    }
    this.connections.get(userId)!.add(ws);

    // Send any queued notifications
    this.sendQueuedNotifications(userId);

    // Handle connection close
    ws.onclose = () => {
      this.removeConnection(userId, ws);
    };
  }

  // Remove a WebSocket connection
  removeConnection(userId: string, ws: WebSocket): void {
    const userConnections = this.connections.get(userId);
    if (userConnections) {
      userConnections.delete(ws);
      if (userConnections.size === 0) {
        this.connections.delete(userId);
      }
    }
  }

  // Send notification to a specific user
  async sendNotification(notification: RealtimeNotification): Promise<boolean> {
    const userId = notification.recipientId;
    const userConnections = this.connections.get(userId);

    if (userConnections && userConnections.size > 0) {
      // User is online, send immediately
      const message = JSON.stringify(notification);
      let sent = false;

      for (const ws of userConnections) {
        if (ws.readyState === WebSocket.OPEN) {
          try {
            ws.send(message);
            sent = true;
            console.log(`✅ Real-time notification sent to user ${userId}`);
          } catch (error) {
            console.error(`❌ Failed to send real-time notification to user ${userId}:`, error);
          }
        }
      }

      return sent;
    } else {
      // User is offline, queue the notification
      this.queueNotification(notification);
      console.log(`📝 Notification queued for offline user ${userId}`);
      return true;
    }
  }

  // Queue notification for offline user
  private queueNotification(notification: RealtimeNotification): void {
    const userId = notification.recipientId;
    if (!this.notificationQueue.has(userId)) {
      this.notificationQueue.set(userId, []);
    }
    
    const queue = this.notificationQueue.get(userId)!;
    queue.push(notification);
    
    // Keep only last 50 notifications per user
    if (queue.length > 50) {
      queue.splice(0, queue.length - 50);
    }
  }

  // Send queued notifications when user comes online
  private sendQueuedNotifications(userId: string): void {
    const queue = this.notificationQueue.get(userId);
    if (!queue || queue.length === 0) return;

    const userConnections = this.connections.get(userId);
    if (!userConnections || userConnections.size === 0) return;

    console.log(`📤 Sending ${queue.length} queued notifications to user ${userId}`);

    for (const notification of queue) {
      const message = JSON.stringify(notification);
      for (const ws of userConnections) {
        if (ws.readyState === WebSocket.OPEN) {
          try {
            ws.send(message);
          } catch (error) {
            console.error(`❌ Failed to send queued notification:`, error);
          }
        }
      }
    }

    // Clear the queue
    this.notificationQueue.delete(userId);
  }

  // Get connection count for a user
  getConnectionCount(userId: string): number {
    return this.connections.get(userId)?.size || 0;
  }

  // Get total active connections
  getTotalConnections(): number {
    let total = 0;
    for (const connections of this.connections.values()) {
      total += connections.size;
    }
    return total;
  }

  // Get queued notification count for a user
  getQueuedCount(userId: string): number {
    return this.notificationQueue.get(userId)?.length || 0;
  }

  // Clear queued notifications for a user
  clearQueuedNotifications(userId: string): void {
    this.notificationQueue.delete(userId);
    console.log(`🧹 Cleared queued notifications for user ${userId}`);
  }
}

export const realtimeNotificationService = RealtimeNotificationService.getInstance();

// Helper function to send notification
export async function sendRealtimeNotification(notification: Omit<RealtimeNotification, 'timestamp'>): Promise<boolean> {
  return realtimeNotificationService.sendNotification({
    ...notification,
    timestamp: Date.now()
  });
}
