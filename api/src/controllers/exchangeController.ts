import { Request, Response } from "express";
import { prisma } from "..";

export const getExchangeByMic = async (req: Request, res: Response) => {
  const { mic } = req.query as { mic: string };
  if (!mic) {
    res.status(200).send("Missing MIC parameter");
    return;
  }
  try {
    const iso_data = await prisma.iSO10383.findUnique({
      where: {
        mic: mic,
      },
    });
    if (iso_data) {
      res.status(200).json(iso_data);
      return;
    } else {
      res.status(404).send("Exchange not found");
      return;
    }
  } catch (error) {
    console.error("Failed to retrieve exchange:", error);
    res.status(500).send("Internal server error");
    return;
  }
};
