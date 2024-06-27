import { json } from "@sveltejs/kit";
import prisma from "../../../../../lib/prisma/prismaClient";
import type { Passenger } from "../../../../../ts/types";
import jwt from "jsonwebtoken";

export async function GET(): Promise<Response> {
  try {
    const pricePerMeter = await prisma.settings.findUnique({
      where: {
        key: "price_per_meter"
      }
    });
    // const token = await jwt.sign({id: registerData.id, email: registerData.email}, "my-secret");    
    return json(pricePerMeter);
  }
  catch (error) {
    console.error("Error reading price_per_meter in db", error);
    throw error;
  }
}