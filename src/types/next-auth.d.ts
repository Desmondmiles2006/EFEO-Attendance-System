import { DefaultSession } from "next-auth";

declare module "next-auth" {
  interface User {
    role: "MEMBER" | "ADMIN";
    status: "PENDING" | "ACTIVE" | "REJECTED" | "SUSPENDED";
  }

  interface Session {
    user: {
      id: string;
      role: "MEMBER" | "ADMIN";
      status: "PENDING" | "ACTIVE" | "REJECTED" | "SUSPENDED";
    } & DefaultSession["user"];
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string;
    role: "MEMBER" | "ADMIN";
    status: "PENDING" | "ACTIVE" | "REJECTED" | "SUSPENDED";
  }
}
