"use client";

import { useTab } from "@/contexts/TabContext";
import { useIsAdmin } from "@/hooks";
import { useAccount } from "wagmi";
import DetailsPage from "@/components/dashboard/DashboardOverview";
import DepositPage from "@/components/dashboard/Dashboard";
import Portfolio from "@/components/portfolio/Portfolio";
import Admin from "@/components/admin/Admin";

export default function Home() {
  const { activeTab } = useTab();
  const { address } = useAccount();
  const { data: isAdmin } = useIsAdmin(address);

  return (
    <>
      {activeTab === "details" && <DetailsPage />}
      {activeTab === "deposit" && <DepositPage />}
      {activeTab === "portfolio" && <Portfolio />}
      {activeTab === "admin" && isAdmin && <Admin />}
    </>
  );
}
