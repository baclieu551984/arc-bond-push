"use client";

import { useTab } from "@/contexts/TabContext";
import { useIsAdmin } from "@/hooks";
import { useAccount } from "wagmi";

export const TabNavigation = () => {
  const { activeTab, setActiveTab } = useTab();
  const { address } = useAccount();
  const { data: isAdmin } = useIsAdmin(address);
  
  return (
    <div className="flex gap-2">
      <button
        onClick={() => setActiveTab("deposit")}
        className={`font-medium h-9 px-4 transition-colors min-w-[120px] text-base ${
          activeTab === "deposit"
            ? "btn-primary text-white"
            : "text-gray-900 btn-transparent"
        }`}
      >
        Deposit
      </button>
      <button
        onClick={() => setActiveTab("portfolio")}
        className={`font-medium h-9 px-4 transition-colors min-w-[120px] text-base ${
          activeTab === "portfolio"
            ? "btn-primary text-white"
            : "text-gray-900 btn-transparent"
        }`}
      >
        Portfolio
      </button>
      <button
        onClick={() => setActiveTab("details")}
        className={`font-medium h-9 px-4 transition-colors min-w-[120px] text-base ${
          activeTab === "details"
            ? "btn-primary text-white"
            : "text-gray-900 btn-transparent"
        }`}
      >
        Details
      </button>
      {isAdmin && (
        <button
          onClick={() => setActiveTab("admin")}
          className={`font-medium h-9 px-4 transition-colors min-w-[120px] text-base ${
            activeTab === "admin"
              ? "btn-primary text-white"
              : "text-gray-900 btn-transparent"
          }`}
        >
          Admin
        </button>
      )}
    </div>
  );
};

