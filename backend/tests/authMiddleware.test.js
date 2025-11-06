/**
 * Integration test for verifyToken middleware
 * ✅ ESM-safe
 * ✅ Uses real Express server
 * ✅ Closes cleanly
 */

import { jest, describe, test, beforeAll, afterAll, expect } from "@jest/globals";
import express from "express";
import request from "supertest";

// --- Mock jsonwebtoken ---
const verifyMock = jest.fn();
jest.unstable_mockModule("jsonwebtoken", () => ({
  default: { verify: verifyMock }
}));

// Import middleware AFTER mocks
const { verifyToken } = await import("../api/middleware/authMiddleware.js");

describe("🔐 verifyToken Middleware", () => {
  let app, server, baseURL;

  beforeAll((done) => {
    process.env.JWT_SECRET = "supersecret";
    process.env.NODE_ENV = "development"; // default non-test env

    app = express();
    app.use(express.json());

    // Example protected route
    app.get("/protected", verifyToken, (req, res) => {
      res.json({ ok: true, user: req.user });
    });

    server = app.listen(0, () => {
      const { port } = server.address();
      baseURL = `http://127.0.0.1:${port}`;
      done();
    });
  });

  afterAll((done) => {
    server.close(done);
  });

  test("✅ bypasses check when NODE_ENV=test", async () => {
    process.env.NODE_ENV = "test";

    const res = await request(baseURL).get("/protected");
    expect(res.status).toBe(200);
    expect(res.body.user).toMatchObject({ role: "admin" });

    process.env.NODE_ENV = "development"; // reset
  });

  test("🚫 returns 401 if no Authorization header", async () => {
    const res = await request(baseURL).get("/protected");
    expect(res.status).toBe(401);
    expect(res.body.message).toBe("No token provided");
  });

  test("✅ allows valid JWT", async () => {
    const fakeToken = "abc.def.ghi";
    verifyMock.mockReturnValueOnce({ _id: "123", role: "customer" });

    const res = await request(baseURL)
      .get("/protected")
      .set("Authorization", `Bearer ${fakeToken}`);

    expect(verifyMock).toHaveBeenCalledWith(fakeToken, "supersecret");
    expect(res.status).toBe(200);
    expect(res.body.user).toEqual({ _id: "123", role: "customer" });
  });

  test("🚫 returns 403 if invalid token", async () => {
    verifyMock.mockImplementationOnce(() => {
      throw new Error("bad token");
    });

    const res = await request(baseURL)
      .get("/protected")
      .set("Authorization", "Bearer invalidtoken");

    expect(res.status).toBe(403);
    expect(res.body.message).toBe("Invalid or expired token");
  });
});
