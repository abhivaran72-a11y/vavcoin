import { User } from "@/models/user";

export async function getNextReferralCode() {
  const result = await User.aggregate([
    { $match: { referralCode: { $regex: /^VAVCODE\d+$/ } } },
    {
      $project: {
        codeNum: {
          $convert: {
            input: { $substr: ["$referralCode", 7, -1] },
            to: "int",
            onError: 0
          }
        }
      }
    },
    { $sort: { codeNum: -1 } },
    { $limit: 1 }
  ]);

  if (result.length === 0) {
    return "VAVCODE450";
  }

  const nextNum = result[0].codeNum + 1;
  // Ensure we don't go below 450
  const finalNum = Math.max(nextNum, 450);
  return `VAVCODE${finalNum}`;
}
