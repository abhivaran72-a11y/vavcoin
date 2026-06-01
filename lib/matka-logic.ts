import { connectDB } from "./mongodb";
import { MatkaRound } from "@/models/matka-round";
import { MatkaBet } from "@/models/matka-bet";
import { User } from "@/models/user";
import { Transaction } from "@/models/transaction";
import { MatkaSettings } from "@/models/matka-settings";

export async function getCurrentMatkaRound() {
  await connectDB();
  const now = new Date();

  let currentRound = await MatkaRound.findOne().sort({ createdAt: -1 });

  if (!currentRound) {
    currentRound = await createNewMatkaRound();
  }

  if (currentRound.status === "COMPLETED") {
    const updatedAt = new Date(currentRound.updatedAt || currentRound.createdAt);
    const timeSinceCompletion = now.getTime() - updatedAt.getTime();
    
    // 8 seconds global buffer for transition (similar to Head & Tail)
    if (timeSinceCompletion < 8000) {
      return {
        round: currentRound,
        secondsLeft: 0,
      };
    } else {
      currentRound = await createNewMatkaRound();
    }
  }

  const secondsLeft = Math.max(0, Math.floor((currentRound.endTime.getTime() - now.getTime()) / 1000));
  
  if (secondsLeft <= 0 || currentRound.endTime < now) {
    await resolveMatkaRound(currentRound);
    currentRound = await MatkaRound.findById(currentRound._id);
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

async function createNewMatkaRound() {
  const settings = await MatkaSettings.findOne() || await MatkaSettings.create({});
  const roundNumber = "M" + Date.now().toString();
  const endTime = new Date(Date.now() + (settings.timerSeconds * 1000));
  
  const newRound = await MatkaRound.create({
    roundNumber,
    endTime,
    status: "ACTIVE",
    totalAmounts: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 },
    totalPool: 0
  });
  
  if ((global as any).io) {
    (global as any).io.emit("MATKA_NEW_ROUND", newRound);
  }
  
  return newRound;
}

async function resolveMatkaRound(round: any) {
  const updatedRound = await MatkaRound.findOneAndUpdate(
    { _id: round._id, status: { $ne: "COMPLETED" } },
    { $set: { status: "COMPLETED" } },
    { new: true }
  );

  if (!updatedRound) return;

  console.log(`=> Resolving Matka Round ${updatedRound.roundNumber}...`);

  const settings = await MatkaSettings.findOne() || await MatkaSettings.create({});
  
  // Result Logic: Find numbers with the LOWEST total amount wagered
  const amounts = updatedRound.totalAmounts;
  let minAmount = Infinity;
  let candidates: number[] = [];

  for (let i = 1; i <= 5; i++) {
    const amount = amounts[i] || 0;
    if (amount < minAmount) {
      minAmount = amount;
      candidates = [i];
    } else if (amount === minAmount) {
      candidates.push(i);
    }
  }

  // Randomly choose one from the candidates
  const result = candidates[Math.floor(Math.random() * candidates.length)];

  updatedRound.result = result;
  await updatedRound.save();

  if ((global as any).io) {
    (global as any).io.emit("MATKA_ROUND_RESOLVED", { 
      roundNumber: updatedRound.roundNumber, 
      result, 
      totalAmounts: updatedRound.totalAmounts,
      totalPool: updatedRound.totalPool
    });
  }

  const bets = await MatkaBet.find({ roundId: updatedRound._id, status: "PENDING" });
  console.log(`=> Matka Round ${updatedRound.roundNumber} Result: ${result}. Processing ${bets.length} bets...`);

  for (const bet of bets) {
    if (bet.choice === result) {
      // Total return = amount * 4 (as per requirement: ₹10 bet -> ₹40 total return)
      const winAmount = bet.amount * settings.payoutMultiplier;

      await MatkaBet.updateOne(
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
        description: `Won Matka Round ${updatedRound.roundNumber} on ${result}`,
        roundId: updatedRound._id,
      });
    } else {
      await MatkaBet.updateOne(
        { _id: bet._id },
        { $set: { status: "LOSS", result } }
      );

      await User.updateOne(
        { _id: bet.userId },
        { $inc: { totalLoss: bet.amount } }
      );
    }
  }
  console.log(`=> Matka Round ${updatedRound.roundNumber} resolved successfully`);
}
