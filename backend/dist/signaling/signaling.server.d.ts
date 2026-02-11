import { Server as HttpServer } from 'http';
import { Server as WebSocketServer } from 'ws';
export declare const createSignalingServer: (server: HttpServer) => WebSocketServer<typeof import("ws"), typeof import("http").IncomingMessage>;
