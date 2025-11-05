import { jest } from "@jest/globals";
import { getAdminStats } from "../api/controllers/adminController.js";
import User from "../api/models/User.js";
import MenuItem from "../api/models/MenuItem.js";
import Order from "../api/models/Order.js";

// --- create spies for model methods ---
jest.spyOn(User, "countDocuments");
jest.spyOn(MenuItem, "countDocuments");
jest.spyOn(Order, "countDocuments");
jest.spyOn(Order, "aggregate");

// --- mock entire modules so Jest handles imports cleanly ---
jest.mock("../api/models/User.js");
jest.mock("../api/models/MenuItem.js");
jest.mock("../api/models/Order.js");

describe("AdminController → getAdminStats", () => {
  let req, res;

  beforeEach(() => {
    req = {}; // no input params
    res = {
      json: jest.fn(),
      status: jest.fn().mockReturnThis(),
    };
    jest.clearAllMocks();
  });

  it("✅ should return correct stats when data exists", async () => {
    User.countDocuments.mockResolvedValue(10);
    MenuItem.countDocuments.mockResolvedValue(5);
    Order.countDocuments.mockResolvedValue(20);
    Order.aggregate.mockResolvedValue([{ total: 150.75 }]);

    await getAdminStats(req, res);

    expect(User.countDocuments).toHaveBeenCalled();
    expect(MenuItem.countDocuments).toHaveBeenCalled();
    expect(Order.countDocuments).toHaveBeenCalled();
    expect(Order.aggregate).toHaveBeenCalledWith([
      { $group: { _id: null, total: { $sum: "$totalPrice" } } },
    ]);

    expect(res.status).not.toHaveBeenCalled();
    expect(res.json).toHaveBeenCalledWith({
      totalUsers: 10,
      totalMenuItems: 5,
      totalOrders: 20,
      totalRevenue: 150.75,
    });
  });

  it("✅ should handle case when there are no orders (empty aggregate)", async () => {
    User.countDocuments.mockResolvedValue(2);
    MenuItem.countDocuments.mockResolvedValue(3);
    Order.countDocuments.mockResolvedValue(0);
    Order.aggregate.mockResolvedValue([]);

    await getAdminStats(req, res);

    expect(res.json).toHaveBeenCalledWith({
      totalUsers: 2,
      totalMenuItems: 3,
      totalOrders: 0,
      totalRevenue: 0,
    });
  });

  it("❌ should handle errors gracefully", async () => {
    const fakeError = new Error("Database failure");
    User.countDocuments.mockRejectedValue(fakeError);

    await getAdminStats(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({
      message: "Error fetching stats",
      error: "Database failure",
    });
  });

  it("🧩 should handle aggregate returning malformed data", async () => {
    User.countDocuments.mockResolvedValue(1);
    MenuItem.countDocuments.mockResolvedValue(2);
    Order.countDocuments.mockResolvedValue(3);
    Order.aggregate.mockResolvedValue([{ wrongKey: 500 }]); // missing total

    await getAdminStats(req, res);

    // totalRevenue will be undefined since total is missing
    expect(res.json).toHaveBeenCalledWith({
      totalUsers: 1,
      totalMenuItems: 2,
      totalOrders: 3,
      totalRevenue: undefined,
    });
  });

  it("🧩 should handle partial data (some counts undefined)", async () => {
    User.countDocuments.mockResolvedValue(undefined);
    MenuItem.countDocuments.mockResolvedValue(4);
    Order.countDocuments.mockResolvedValue(10);
    Order.aggregate.mockResolvedValue([{ total: 50 }]);

    await getAdminStats(req, res);

    expect(res.json).toHaveBeenCalledWith({
      totalUsers: undefined,
      totalMenuItems: 4,
      totalOrders: 10,
      totalRevenue: 50,
    });
  });

  it("🧩 should handle one model failing individually", async () => {
    User.countDocuments.mockResolvedValue(3);
    MenuItem.countDocuments.mockRejectedValue(new Error("menu fail"));
    Order.countDocuments.mockResolvedValue(7);
    Order.aggregate.mockResolvedValue([{ total: 20 }]);

    await getAdminStats(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        message: "Error fetching stats",
      })
    );
  });

  it("🧩 should handle aggregate returning null or non-array", async () => {
    User.countDocuments.mockResolvedValue(3);
    MenuItem.countDocuments.mockResolvedValue(2);
    Order.countDocuments.mockResolvedValue(1);
    Order.aggregate.mockResolvedValue(null);

    await getAdminStats(req, res);

    // Controller crashes and returns 500 with error info
    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        message: "Error fetching stats",
        error: expect.stringContaining("Cannot read properties of null"),
      })
    );
  });

  it("🧩 should catch synchronous unexpected error", async () => {
    // temporarily replace with sync-throwing fn
    const originalFn = User.countDocuments;
    User.countDocuments.mockImplementation(() => {
      throw new Error("Sync crash");
    });

    await getAdminStats(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        message: "Error fetching stats",
        error: "Sync crash",
      })
    );

    // restore
    User.countDocuments = originalFn;
  });
});
