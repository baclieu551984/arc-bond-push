"use client";

import SnapshotCard from "./SnapshotCard";
import TreasuryCard from "./TreasuryCard";
import EmergencyCard from "./EmergencyCard";

export default function Admin() {
  return (
    <div className="w-[60%] mx-auto space-y-6">
      <SnapshotCard />
      <TreasuryCard />
      <EmergencyCard />
    </div>
  );
}

