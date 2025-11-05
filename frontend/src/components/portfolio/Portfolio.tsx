"use client";

import YourPosition from "./YourPosition";
import ClaimCard from "./ClaimCard";
import RedeemCard from "./RedeemCard";

export default function Portfolio() {
  return (
    <div className="space-y-6">
      {/* Your Position - 40% width */}
      <div className="w-[40%] mx-auto">
        <YourPosition />
      </div>
      
      {/* Action Cards - 40% width */}
      <div className="w-[40%] mx-auto space-y-6">
        <ClaimCard />
        <RedeemCard />
      </div>
    </div>
  );
}

