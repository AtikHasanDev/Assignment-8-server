import { createRemoteJWKSet, jwtVerify } from "jose";
export function createTokenVerifier(config) {
  const jwks = createRemoteJWKSet(new URL(config.jwks));
  return (token) =>
    jwtVerify(token, jwks, {
      issuer: config.issuer,
      audience: config.audience,
      algorithms: ["EdDSA"],
    });
}
const studioCookieName = "studiospace_token";

function readBearerToken(req) {
  const header = req.get("authorization");
  return header?.startsWith("Bearer ") ? header.slice(7) : undefined;
}

function readStudioCookie(req) {
  const prefix = `${studioCookieName}=`;
  return req.get("cookie")
    ?.split(";")
    .map((cookie) => cookie.trim())
    .find((cookie) => cookie.startsWith(prefix))
    ?.slice(prefix.length);
}

export function requireAuth(verify, readToken = readBearerToken) {
  return async (req, res, next) => {
    const token = readToken(req);
    if (!token)
      return res.status(401).json({ message: "Please log in to continue." });
    try {
      const { payload } = await verify(token);
      if (
        !payload.sub ||
        typeof payload.email !== "string" ||
        typeof payload.name !== "string"
      )
        throw new Error("Invalid identity");
      req.user = { id: payload.sub, email: payload.email, name: payload.name };
      next();
    } catch {
      res
        .status(401)
        .json({ message: "Your session has expired. Please log in again." });
    }
  };
}

export function requireStudioAuth(verify) {
  return requireAuth(verify, readStudioCookie);
}
