import React, { useEffect, useState } from "react";
import axios from "../../api/axios";

export default function ManageOrders() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  // Fetch all orders
  const fetchOrders = async () => {
    try {
      const res = await axios.get("/orders"); // backend handles auth
      setOrders(res.data);
    } catch (err) {
      console.error("Error fetching orders:", err);
    } finally {
      setLoading(false);
    }
  };

  // Update order status
  const handleStatusChange = async (id, newStatus) => {
    try {
      await axios.patch(`/orders/${id}`, { status: newStatus });
      fetchOrders(); // refresh list
    } catch (err) {
      console.error("Error updating order:", err);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  if (loading) return <p className="text-center mt-10">Loading orders...</p>;

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold text-amber-800 mb-4">
        Manage Orders
      </h1>

      {orders.length === 0 ? (
        <p className="text-gray-600">No orders yet.</p>
      ) : (
        <table className="min-w-full border border-gray-300 text-sm">
          <thead className="bg-amber-100">
            <tr>
              <th className="border px-4 py-2">Order ID</th>
              <th className="border px-4 py-2">Customer</th>
              <th className="border px-4 py-2">Items</th>
              <th className="border px-4 py-2">Status</th>
              <th className="border px-4 py-2">Action</th>
            </tr>
          </thead>
          <tbody>
            {orders.map((order) => (
              <tr key={order._id} className="border-t">
                <td className="border px-4 py-2">{order._id}</td>
                <td className="border px-4 py-2">{order.user?.name}</td>
                <td className="border px-4 py-2">
                  {order.items
                    .map((i) => `${i.menuItem?.name} ×${i.quantity}`)
                    .join(", ")}
                </td>
                <td className="border px-4 py-2 capitalize">
                  {order.status.replace("_", " ")}
                </td>
                <td className="border px-4 py-2">
                  <select
                    value={order.status}
                    onChange={(e) =>
                      handleStatusChange(order._id, e.target.value)
                    }
                    className="border rounded p-1"
                  >
                    <option value="pending">Pending</option>
                    <option value="in_progress">In Progress</option>
                    <option value="ready">Ready</option>
                    <option value="completed">Completed</option>
                  </select>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
