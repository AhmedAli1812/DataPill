import * as signalR from "@microsoft/signalr";

class SignalRService {
  connection = null;

  startConnection = async (onNotificationReceived) => {
    this.connection = new signalR.HubConnectionBuilder()
      .withUrl("http://localhost:5089/notificationHub")
      .withAutomaticReconnect()
      .build();

    this.connection.on("ReceiveNotification", (notification) => {
      onNotificationReceived(notification);
    });

    try {
      await this.connection.start();
      console.log("SignalR Connected.");
    } catch (err) {
      console.log("SignalR Connection Error: ", err);
    }
  };

  stopConnection = async () => {
    if (this.connection) {
      await this.connection.stop();
    }
  };
}

const signalRService = new SignalRService();
export default signalRService;
