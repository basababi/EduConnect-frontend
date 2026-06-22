"use client";

import { useEffect, useState } from "react";
import { getStoredUser, type User } from "./api";

export function useUser(): User | null {
  const [user, setUser] = useState<User | null>(null);
  useEffect(() => {
    setUser(getStoredUser());
  }, []);
  return user;
}