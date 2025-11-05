"use client";

import BondOverview from "./BondOverview";
import DepositCard from "../portfolio/DepositCard";

export default function DepositPage() {
  return (
    <div className="space-y-6">
      {/* Bond Stats - 40% width */}
      <div className="w-[40%] mx-auto">
        <BondOverview />
      </div>
      
      {/* Deposit Form - 40% width */}
      <div className="w-[40%] mx-auto">
        <DepositCard />
      </div>
    </div>
  );
}

