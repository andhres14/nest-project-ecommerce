import { OnGatewayConnection, OnGatewayDisconnect, SubscribeMessage, WebSocketGateway, WebSocketServer } from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { MessagesWsService } from './messages-ws.service';
import { NewMessageDto } from './dtos/new-message.dto';
import { JwtService } from '@nestjs/jwt';
import { JwtPayload } from 'src/auth/interfaces';

@WebSocketGateway({ cors: true })
export class MessagesWsGateway implements OnGatewayConnection, OnGatewayDisconnect {

  @WebSocketServer() wss: Server;

  constructor(
    private readonly messagesWsService: MessagesWsService,
    private readonly jwtService: JwtService
  ) {}

  async handleConnection(client: Socket) {
    const token = client.handshake.headers.authentication as string;
    let payload: JwtPayload;

    try {
      payload = this.jwtService.verify(token);
      await this.messagesWsService.registerClient(client, payload.uid);
    } catch (error) {
      client.disconnect();
      return;
    }

    // console.log({ payload });

    this.wss.emit('clients-updated', this.messagesWsService.getConnectedClients());
  }

  handleDisconnect(client: Socket) {
    this.messagesWsService.removeClient(client.id);
    this.wss.emit('clients-updated', this.messagesWsService.getConnectedClients());
  }

  @SubscribeMessage('message-from-client')
  onMessageFromClient( client: Socket, payload: NewMessageDto) {
    //! SOLO emite al cliente que envio el mensaje
    // client.emit('messages-from-server', {
    //   fullName: 'Soy yo, desde el server',
    //   message: payload.message || 'no-message!!'
    // });

    //! Emitir a todos, menos al cliente inicial (al que emitio el mensaje inicialmente)
    // client.broadcast.emit('messages-from-server', {
    //   fullName: 'Soy yo, desde el server',
    //   message: payload.message || 'no-message!!'
    // });

    //! a ciertas personas que esten en cierta sala
    // this.wss.to('ROOM_ID').emit('event-name', { payload });

    //! Emitir a todos (incluido el client que envio el mensaje)
    this.wss.emit('messages-from-server', {
      fullName: this.messagesWsService.getUserFullName(client.id),
      message: payload.message || 'no-message!!'
    });
  }
}
