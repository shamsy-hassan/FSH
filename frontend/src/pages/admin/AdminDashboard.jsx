import React from "react";

function AdminDashboard() {
  const stats = [
    { label: "Total Users", value: "1,245", color: "bg-blue-100 text-blue-800" },
    { label: "Orders Today", value: "87", color: "bg-green-100 text-green-800" },
    { label: "Revenue", value: "$12,340", color: "bg-yellow-100 text-yellow-800" },
    { label: "New Messages", value: "14", color: "bg-red-100 text-red-800" },
  ];

  return (
    <div className="p-6 space-y-6">
      <h2 className="text-2xl font-bold text-gray-800">Admin Dashboard</h2>
      
      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {stats.map((stat, index) => (
          <div
            key={index}
            className="p-4 bg-white rounded-xl shadow hover:shadow-md transition"
          >
            <p className={`text-sm font-medium ${stat.color}`}>{stat.label}</p>
            <p className="mt-2 text-xl font-bold text-gray-900">{stat.value}</p>
          </div>
        ))}
      </div>

      {/* Quick Actions */}
      <div className="bg-white rounded-xl shadow p-6">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">Quick Actions</h3>
        <div className="flex gap-4 flex-wrap">
          <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
            Manage Users
          </button>
          <button className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700">
            View Orders
          </button>
          <button className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700">
            Analytics
          </button>
        </div>
      </div>
    </div>
  );
}

export default AdminDashboard;
