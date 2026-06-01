"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { io, Socket } from "socket.io-client";

interface SocketContextType {
  socket: Socket | null;
  notifications: any[];
  addNotification: (n: any) => void;
  clearNotifications: () => void;
}

const SocketContext = createContext<SocketContextType>({
  socket: null,
  notifications: [],
  addNotification: () => {},
  clearNotifications: () => {},
});

export const useSocket = () => useContext(SocketContext);

export const SocketProvider = ({ children }: { children: React.ReactNode }) => {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [notifications, setNotifications] = useState<any[]>([]);

  const addNotification = (n: any) => {
    setNotifications((prev) => [n, ...prev].slice(0, 50));
  };

  const clearNotifications = () => setNotifications([]);

  useEffect(() => {
    const s = io();
    setSocket(s);

    s.on("NEW_USER", (data) => addNotification({ type: "USER", message: `New User: ${data.mobile}`, time: new Date() }));
    s.on("NEW_DEPOSIT", (data) => addNotification({ type: "DEPOSIT", message: `New Deposit: ₹${data.amount}`, time: new Date() }));
    s.on("NEW_WITHDRAWAL", (data) => addNotification({ type: "WITHDRAWAL", message: `New Withdrawal: ₹${data.amount}`, time: new Date() }));
    s.on("MATKA_NEW_BET", (data) => addNotification({ type: "MATKA_BET", message: `New Matka Bet: ₹${data.bet.amount} on ${data.bet.choice}`, time: new Date() }));
    s.on("REFERRAL_QUALIFIED", (data) => addNotification({ type: "REFERRAL", message: `Referral Qualified: ${data.referrer} referred ${data.user}`, time: new Date() }));
    s.on("REFERRAL_REWARD_RELEASED", (data) => addNotification({ type: "REWARD", message: `Referral Bonus Released: ₹${data.amount}`, time: new Date() }));
    s.on("DAILY_REWARD_CLAIMED", (data) => addNotification({ type: "DAILY_REWARD", message: `Daily Claim: ${data.mobile} got ₹${data.amount}`, time: new Date() }));
    s.on("NEW_BET", (data) => {
      if (data.bet.amount >= 5000) {
        addNotification({ type: "LARGE_BET", message: `Large Bet: ₹${data.bet.amount} on ${data.bet.choice}`, time: new Date() });
      }
    });

    return () => {
      s.disconnect();
    };
  }, []);

  return (
    <SocketContext.Provider value={{ socket, notifications, addNotification, clearNotifications }}>
      {children}
    </SocketContext.Provider>
  );
};
