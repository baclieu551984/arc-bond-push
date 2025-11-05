"use client";

import { useDashboardData } from "@/hooks";

export default function HealthStatus() {
  const { pendingDistributions, emergencyMode, isLoading } = useDashboardData();

  const getStatusColor = () => {
    if (emergencyMode) return "bg-red-50 border-red-200";
    if (pendingDistributions >= 3) return "bg-orange-50 border-orange-200";
    if (pendingDistributions >= 1) return "bg-yellow-50 border-yellow-200";
    return "bg-green-50 border-green-200";
  };

  const getStatusIcon = () => {
    if (emergencyMode) return "🚨";
    if (pendingDistributions >= 3) return "⚠️";
    if (pendingDistributions >= 1) return "⚠️";
    return "✅";
  };

  const getStatusText = () => {
    if (emergencyMode) return "EMERGENCY MODE: Owner defaulted!";
    if (pendingDistributions >= 3) return "CRITICAL: 3+ snapshots without distribution";
    if (pendingDistributions >= 1) return "WARNING: Pending distribution";
    return "All distributions up to date";
  };

  if (isLoading) {
    return (
      <div className="card">
        <h2 className="text-xl font-bold mb-4 text-gray-900">Health Status</h2>
        <div className="text-gray-500">Loading...</div>
      </div>
    );
  }

  return (
    <div className="card">
      <h2 className="text-xl font-bold mb-4 text-gray-900">Health Status</h2>
      
      <div className={`p-4 rounded-lg border ${getStatusColor()}`}>
        <div className="flex items-center gap-3">
          <span className="text-2xl">{getStatusIcon()}</span>
          <div className="flex-1">
            <div className="font-semibold text-gray-900">{getStatusText()}</div>
            {pendingDistributions > 0 && (
              <div className="text-sm text-gray-600 mt-1">
                {pendingDistributions} snapshot(s) awaiting distribution
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

