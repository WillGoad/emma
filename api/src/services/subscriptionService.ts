// subscriptionService.ts
import { Prisma } from "@prisma/client";
import { calculateEndTime } from "../utils/helpers";
import { removeUserFromProductACL } from "../utils/kong";
import { prisma } from "..";

type SubscriptionWithRelations = Prisma.SubscriptionGetPayload<{
  include: {
    user: {
      include: {
        balances: true;
      };
    };
    dataProduct: true;
  };
}>;

export async function checkSubscriptions() {
  const now = new Date();
  const oneMinuteLater = new Date(now.getTime() + 60 * 1000);

  const subscriptions = await prisma.subscription.findMany({
    where: {
      accessEndTime: {
        lt: oneMinuteLater,
        gte: now,
      },
    },
    include: {
      user: {
        include: {
          balances: true,
        },
      },
      dataProduct: true,
    },
  });

  for (const sub of subscriptions) {
    if (sub.cancelledTime === null) {
      await handleSubscriptionRenewal(sub, now);
    } else {
      await removeUserFromProductACL(sub.userId, sub.dataProductId);
    }
  }
}

async function handleSubscriptionRenewal(
  sub: SubscriptionWithRelations,
  now: Date
) {
  try {
    const currency = sub.currency;
    const amount = sub.amount;
    const userBalance = sub.user.balances.find((b) => b.currency === currency);

    if (!userBalance || userBalance.amount < amount) {
      await prisma.subscription.update({
        where: { id: sub.id },
        data: { cancelledTime: now },
      });
      await removeUserFromProductACL(sub.userId, sub.dataProductId);
      throw new Error(`Insufficient balance for subscription ${sub.id}`);
    }

    await prisma.$transaction([
      prisma.balance.update({
        where: { id: userBalance.id },
        data: { amount: { decrement: amount } },
      }),
      prisma.charge.create({
        data: {
          amount,
          currency,
          time: now,
          subscriptionId: sub.id,
        },
      }),
      prisma.subscription.update({
        where: { id: sub.id },
        data: {
          accessEndTime: calculateEndTime(now, sub.interval),
          updatedAt: now,
        },
      }),
    ]);
  } catch (error) {
    console.error(`Error renewing subscription ${sub.id}:`, error);
  }
}
