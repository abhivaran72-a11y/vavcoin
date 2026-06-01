import jwt from "jsonwebtoken";
import { parse } from "cookie";

const JWT_SECRET = process.env.JWT_SECRET || "vavcoin_secret";
console.log(`[AUTH HELPER] JWT_SECRET LOADED (PREFIX): ${JWT_SECRET.substring(0, 5)}...`);

export function verifyToken(req: Request) {
  try {
    let token = "";
    const authHeader = req.headers.get("authorization");
    const cookieHeader = req.headers.get("cookie");
    
    if (authHeader && authHeader.startsWith("Bearer ")) {
      token = authHeader.split(" ")[1];
      console.log("[AUTH HELPER] TOKEN SOURCE: AUTHORIZATION HEADER");
    } else if (cookieHeader) {
      const cookies = parse(cookieHeader);
      token = cookies.token || "";
      console.log("[AUTH HELPER] TOKEN SOURCE: COOKIE");
    }

    if (!token) {
      console.log("[AUTH HELPER] REJECTION: NO TOKEN FOUND");
      return null;
    }

    const decoded = jwt.verify(token, JWT_SECRET) as { id: string; mobile: string; isAdmin?: boolean };
    console.log("[AUTH HELPER] TOKEN VERIFIED SUCCESSFULLY:", decoded.mobile);
    return decoded;
  } catch (error: any) {
    console.log("[AUTH HELPER] VERIFICATION ERROR:", error.message);
    return null;
  }
}
