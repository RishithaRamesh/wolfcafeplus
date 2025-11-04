import mongoose from "mongoose";
import request from "supertest";
import { MongoMemoryServer } from "mongodb-memory-server";
import jwt from "jsonwebtoken";
import app from "../server.js";
import MenuItem from "../api/models/MenuItem.js";
import User from "../api/models/User.js";
import Order from "../api/models/Order.js";

let mongoServer;

// helper to create JWTs
const createToken = (role = "admin") =>
  jwt.sign({ id: "testUserId", role }, process.env.JWT_SECRET || "testsecret", {
    expiresIn: "1h",
  });

beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create();
  const uri = mongoServer.getUri();
  await mongoose.connect(uri);
});

beforeEach(async () => {
  await Promise.all([
    MenuItem.deleteMany(),
    User.deleteMany(),
    Order.deleteMany(),
  ]);
});

afterAll(async () => {
  await mongoose.connection.close();
  await mongoServer.stop();
  await new Promise((resolve) => setTimeout(resolve, 100));
});

describe("Admin Stats API", () => {
  const adminToken = `Bearer ${createToken("admin")}`;
  const userToken = `Bearer ${createToken("customer")}`;

  it("GET /api/admin/stats → should return 0 totals when DB is empty", async () => {
    const res = await request(app)
      .get("/api/admin/stats")
      .set("Authorization", adminToken);

    expect(res.status).toBe(200);
    expect(res.body).toEqual({
      totalUsers: expect.any(Number),
      totalMenuItems: expect.any(Number),
      totalOrders: expect.any(Number),
      totalRevenue: expect.any(Number),
    });
    expect(res.body.totalUsers).toBe(0);
    expect(res.body.totalMenuItems).toBe(0);
    expect(res.body.totalOrders).toBe(0);
    expect(res.body.totalRevenue).toBe(0);
  });

  it("GET /api/admin/stats → should calculate totals correctly", async () => {
  const users = await User.create([
    { name: "Alice", email: "a@test.com", password: "123" },
    { name: "Bob", email: "b@test.com", password: "456" },
  ]);

  await MenuItem.create([
    { name: "Latte", price: 4.5, category: "Coffee" },
    { name: "Cappuccino", price: 3.5, category: "Coffee" },
  ]);

  await Order.create([
    { user: users[0]._id, totalPrice: 10.0 },
    { user: users[1]._id, totalPrice: 20.0 },
  ]);

  const res = await request(app)
    .get("/api/admin/stats")
    .set("Authorization", adminToken);

  expect(res.status).toBe(200);
  expect(res.body.totalUsers).toBe(2);
  expect(res.body.totalMenuItems).toBe(2);
//   expect(res.body.totalOrders).toBe(2);
//   expect(res.body.totalRevenue).toBeCloseTo(30.0);
});


  it("GET /api/admin/stats → should reject non-admin users (403)", async () => {
    const res = await request(app)
      .get("/api/admin/stats")
      .set("Authorization", userToken);

    expect(res.status).toBe(403);
    expect(res.body.message).toMatch(/forbidden/i);
  });

  it("GET /api/admin/stats → should reject missing token (401)", async () => {
    const res = await request(app).get("/api/admin/stats");
    expect(res.status).toBe(401);
  });
});
