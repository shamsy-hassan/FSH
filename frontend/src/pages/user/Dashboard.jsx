import React from "react";

function Dashboard() {
  const actions = [
    { label: "My Orders", color: "bg-blue-100 text-blue-800" },
    { label: "Saved Items", color: "bg-green-100 text-green-800" },
    { label: "Profile Settings", color: "bg-yellow-100 text-yellow-800" },
    { label: "Support", color: "bg-red-100 text-red-800" },
  ];

  return (
    <div className="p-6 space-y-6">
      <h2 className="text-2xl font-bold text-gray-800">User Dashboard</h2>

      {/* Welcome Section */}
      <div className="bg-white p-6 rounded-xl shadow">
        <h3 className="text-lg font-semibold text-gray-800">Welcome Back 👋</h3>
        <p className="text-gray-600 mt-2">
          Here’s a quick overview of your account and activities.
        </p>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {actions.map((action, index) => (
          <button
            key={index}
            className={`p-4 rounded-xl shadow hover:shadow-md transition text-sm font-medium ${action.color}`}
          >
            {action.label}
          </button>
        ))}
      </div>

      {/* Recent Activity */}
      <div className="bg-white p-6 rounded-xl shadow">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">
          Recent Activity
        </h3>
        <ul className="space-y-3 text-sm text-gray-600">
          <li>✅ Order #1234 was delivered</li>
          <li>📦 Order #1235 is being processed</li>
          <li>💬 You received a new message from Support</li>
        </ul>
      </div>
    </div>
  );
}

export default Dashboard;
