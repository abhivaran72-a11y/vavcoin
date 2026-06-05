import { connectDB } from "./mongodb";
import { Round } from "@/models/round";
import { Bet } from "@/models/bet";
import { User } from "@/models/user";
import { Transaction } from "@/models/transaction";
import { Settings } from "@/models/settings";

export async function getCurrentRound() {
  await connectDB();
  const now = new Date();

  // Find the most recent round (regardless of status)
  let currentRound = await Round.findOne().sort({ createdAt: -1 });

  // If no round exists, create first one
  if (!currentRound) {
    currentRound = await createNewRound();
  }

  // LOGIC: If latest round is COMPLETED, we must wait for the UI buffer (animation/popup) 
  // before starting a new one. This ensures every round starts at 30s globally.
  if (currentRound.status === "COMPLETED") {
    const updatedAt = new Date(currentRound.updatedAt || currentRound.createdAt);
    const timeSinceCompletion = now.getTime() - updatedAt.getTime();
    
    if (timeSinceCompletion < 8000) { // 8 seconds global buffer for transition
      return {
        round: currentRound,
        secondsLeft: 0,
      };
    } else {
      currentRound = await createNewRound();
    }
  }

  // Calculate standard seconds left for ACTIVE/LOCKED rounds
  const secondsLeft = Math.max(0, Math.floor((currentRound.endTime.getTime() - now.getTime()) / 1000));
  
  // Round is ACTIVE or LOCKED
  if (secondsLeft <= 0 || currentRound.endTime < now) {
    // Round expired, resolve it
    await resolveRound(currentRound);
    // Re-fetch the newly COMPLETED round to get correct updatedAt
    currentRound = await Round.findById(currentRound._id);
    return {
      round: currentRound,
      secondsLeft: 0,
    };
  }

  if (secondsLeft <= 5 && currentRound.status === "ACTIVE") {
    currentRound.status = "LOCKED";
    await currentRound.save();
  }

  return {
    round: currentRound,
    secondsLeft,
  };
}

async function createNewRound() {
  const roundNumber = Date.now().toString();
  const endTime = new Date(Date.now() + 30000); // 30 second round
  const newRound = await Round.create({
    roundNumber,
    endTime,
    status: "ACTIVE",
  });
  
  if ((global as any).io) {
    (global as any).io.emit("NEW_ROUND", newRound);
  }
  
  return newRound;
}

async function resolveRound(round: any) {
  // Use atomic update to prevent double resolution
  const updatedRound = await Round.findOneAndUpdate(
    { _id: round._id, status: { $ne: "COMPLETED" } },
    { $set: { status: "RESOLVING" } }, // Note: Add RESOLVING to model enum if strictly enforced
    { new: true }
  );

  if (!updatedRound) return;

  console.log(`=> Resolving Round ${updatedRound.roundNumber}...`);

  const settings = await Settings.findOne();
  let result = settings?.forcedResult;

  if (!result) {
    if (updatedRound.totalHeadAmount < updatedRound.totalTailAmount) {
      result = "HEAD";
    } else if (updatedRound.totalTailAmount < updatedRound.totalHeadAmount) {
      result = "TAIL";
    } else {
      result = Math.random() > 0.5 ? "HEAD" : "TAIL";
    }
  }

  updatedRound.result = result;
  updatedRound.status = "COMPLETED";
  await updatedRound.save();

  if (settings?.forcedResult) {
    await Settings.updateOne({}, { $set: { forcedResult: null } });
  }

  if ((global as any).io) {
    (global as any).io.emit("ROUND_RESOLVED", { roundNumber: updatedRound.roundNumber, result, totalHeadAmount: updatedRound.totalHeadAmount, totalTailAmount: updatedRound.totalTailAmount });
  }

  const bets = await Bet.find({ roundId: updatedRound._id, status: "PENDING" });
  console.log(`=> Round ${updatedRound.roundNumber} Result: ${result}. Processing ${bets.length} bets...`);

  for (const bet of bets) {
    if (bet.choice === result) {
      const commission = settings?.commissionPercentage || 1;
      const winAmount = bet.amount + (bet.amount * (1 - (commission / 100))); // Principal + (Profit - Commission)

      await Bet.updateOne(
        { _id: bet._id },
        { $set: { status: "WIN", result, winAmount } }
      );

      const user = await User.findOneAndUpdate(
        { _id: bet.userId },
        { $inc: { balance: winAmount, totalWin: winAmount } },
        { new: true }
      );

      await Transaction.create({
        userId: bet.userId,
        type: "WIN",
        amount: winAmount,
        balanceAfter: user.balance,
        description: `Won Round ${updatedRound.roundNumber} on ${result}`,
        roundId: updatedRound._id,
      });
    } else {
      await Bet.updateOne(
        { _id: bet._id },
        { $set: { status: "LOSS", result } }
      );

      await User.updateOne(
        { _id: bet.userId },
        { $inc: { totalLoss: bet.amount } }
      );
    }
  }
  console.log(`=> Round ${updatedRound.roundNumber} resolved successfully`);
}
