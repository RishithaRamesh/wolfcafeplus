import { render, screen, waitFor } from "@testing-library/react";
import AdminDashboard from "../pages/admin/AdminDashboard";
import api from "../api/axios";
import React from "react";

// mock axios
vi.mock("../api/axios");

describe("AdminDashboard Component", () => {
  it("renders loading text initially", () => {
    api.get.mockResolvedValueOnce({ data: {} });
    render(<AdminDashboard />);
    expect(screen.getByText(/loading/i)).toBeInTheDocument();
  });

  it("renders metric cards after API data loads", async () => {
    // Mocked backend response
    api.get.mockResolvedValueOnce({
      data: {
        totalUsers: 7,
        totalMenuItems: 5,
        totalOrders: 2,
        totalRevenue: 42.5,
      },
    });

    render(<AdminDashboard />);

    // Wait for the API data to render
    await waitFor(() => {
      expect(api.get).toHaveBeenCalledWith("/admin/stats");
      expect(screen.getByText("Users")).toBeInTheDocument();
      expect(screen.getByText("7")).toBeInTheDocument();
      expect(screen.getByText("Menu Items")).toBeInTheDocument();
      expect(screen.getByText("5")).toBeInTheDocument();
      expect(screen.getByText("Orders")).toBeInTheDocument();
      expect(screen.getByText("2")).toBeInTheDocument();
      expect(screen.getByText("Revenue")).toBeInTheDocument();
      expect(screen.getByText(/\$42\.50/)).toBeInTheDocument();
    });
  });

  it("handles API failure gracefully", async () => {
    api.get.mockRejectedValueOnce(new Error("Network error"));

    render(<AdminDashboard />);

    // Should log error to console but not crash
    await waitFor(() =>
      expect(screen.getByText(/loading/i)).not.toBeInTheDocument()
    );
  });
});
q