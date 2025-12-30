import { io } from "socket.io-client";

export const createSocket = (token) => {
  return io(import.meta.env.VITE_SOCKET_URL, {
    auth: { token },
    autoConnect: true,
  });
};
