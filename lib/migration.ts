import { User } from "@/models/user";
import { getNextReferralCode } from "./referral";

export async function migrateReferralCodes() {
  console.log("=> Starting Referral Code Migration (Optimized)...");
  
  const placeholders = ["PENDING", "LOADING", "GENERATING", "TEMP", "DEFAULT", "undefined", "null"];

  const usersToUpdate = await User.find({
    $or: [
      { referralCode: { $exists: false } },
      { referralCode: null },
      { referralCode: "" },
      { referralCode: { $in: placeholders } },
      { referralCode: { $not: /^VAVCODE\d+$/ } }
    ]
  }).sort({ createdAt: 1 });

  if (usersToUpdate.length === 0) {
    console.log("=> Referral Code Migration: No users need update.");
    return;
  }

  console.log(`=> Referral Code Migration: Found ${usersToUpdate.length} users with invalid/missing codes.`);

  // Get starting number once
  const nextCodeString = await getNextReferralCode();
  let nextNum = parseInt(nextCodeString.replace("VAVCODE", ""));

  for (const user of usersToUpdate) {
    const newCode = `VAVCODE${nextNum}`;
    await User.updateOne({ _id: user._id }, { $set: { referralCode: newCode } });
    console.log(`=> Assigned ${newCode} to user ${user.mobile} (was: ${user.referralCode || "empty"})`);
    nextNum++;
  }

  console.log("=> Referral Code Migration Completed successfully.");
}
