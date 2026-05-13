// src/hooks/useSocket.js
import { useEffect, useRef, useCallback } from "react";
import { io } from "socket.io-client";

const SOCKET_URL = "https://skill-swap-cs2a.onrender.com";

let socketInstance = null;

export function getSocket() {
  if (!socketInstance) {
    socketInstance = io(SOCKET_URL, { transports: ["websocket"] });
  }
  return socketInstance;
}

export function useSocket(user, handlers = {}) {
  const socketRef = useRef(null);

  useEffect(() => {
    if (!user?.id) return;

    const socket = getSocket();
    socketRef.current = socket;

    // Register this user as online
    socket.emit("register", user.id);

    // Attach handlers
    if (handlers.onIncomingRequest)  socket.on("incoming-request",  handlers.onIncomingRequest);
    if (handlers.onRequestAccepted)  socket.on("request-accepted",  handlers.onRequestAccepted);
    if (handlers.onRequestRejected)  socket.on("request-rejected",  handlers.onRequestRejected);
    if (handlers.onRequestFailed)    socket.on("request-failed",    handlers.onRequestFailed);
    if (handlers.onReceiveMessage)   socket.on("receive-message",   handlers.onReceiveMessage);
    if (handlers.onUserJoined)       socket.on("user-joined",       handlers.onUserJoined);
    if (handlers.onUserLeft)         socket.on("user-left",         handlers.onUserLeft);
    if (handlers.onOffer)            socket.on("offer",             handlers.onOffer);
    if (handlers.onAnswer)           socket.on("answer",            handlers.onAnswer);
    if (handlers.onCandidate)        socket.on("candidate",         handlers.onCandidate);

    return () => {
      // Clean up handlers only (don't disconnect — socket is shared)
      if (handlers.onIncomingRequest)  socket.off("incoming-request",  handlers.onIncomingRequest);
      if (handlers.onRequestAccepted)  socket.off("request-accepted",  handlers.onRequestAccepted);
      if (handlers.onRequestRejected)  socket.off("request-rejected",  handlers.onRequestRejected);
      if (handlers.onRequestFailed)    socket.off("request-failed",    handlers.onRequestFailed);
      if (handlers.onReceiveMessage)   socket.off("receive-message",   handlers.onReceiveMessage);
      if (handlers.onUserJoined)       socket.off("user-joined",       handlers.onUserJoined);
      if (handlers.onUserLeft)         socket.off("user-left",         handlers.onUserLeft);
      if (handlers.onOffer)            socket.off("offer",             handlers.onOffer);
      if (handlers.onAnswer)           socket.off("answer",            handlers.onAnswer);
      if (handlers.onCandidate)        socket.off("candidate",         handlers.onCandidate);
    };
  }, [user?.id]);

  const sendRequest = useCallback((fromUser, toUserId, roomId) => {
    socketRef.current?.emit("send-request", { fromUser, toUserId, roomId });
  }, []);

  const acceptRequest = useCallback((fromUserId, toUser, roomId) => {
    socketRef.current?.emit("accept-request", { fromUserId, toUser, roomId });
  }, []);

  const rejectRequest = useCallback((fromUserId, toUser) => {
    socketRef.current?.emit("reject-request", { fromUserId, toUser });
  }, []);

  const joinRoom = useCallback((roomId) => {
    socketRef.current?.emit("join-room", roomId);
  }, []);

  const sendMessage = useCallback((roomId, data) => {
    socketRef.current?.emit("send-message", { ...data, roomId });
  }, []);

  const sendOffer = useCallback((roomId, offer) => {
    socketRef.current?.emit("offer", { roomId, offer });
  }, []);

  const sendAnswer = useCallback((roomId, answer) => {
    socketRef.current?.emit("answer", { roomId, answer });
  }, []);

  const sendCandidate = useCallback((roomId, candidate) => {
    socketRef.current?.emit("candidate", { roomId, candidate });
  }, []);

  const leaveRoom = useCallback((roomId) => {
    socketRef.current?.emit("leave-room", roomId);
  }, []);

  return {
    socket: socketRef.current,
    sendRequest,
    acceptRequest,
    rejectRequest,
    joinRoom,
    sendMessage,
    sendOffer,
    sendAnswer,
    sendCandidate,
    leaveRoom,
  };
}
