import { json } from "@sveltejs/kit";
import prisma from "../../../../../lib/prisma/prismaClient";
import type { Passenger } from "../../../../../ts/types";
import jwt from "jsonwebtoken";

export async function GET(): Promise<Response> {
  try {
    const priceKm = await prisma.settings.findUnique({
      where: {
        key: "price_km"
      }
    });
    // const token = await jwt.sign({id: registerData.id, email: registerData.email}, "my-secret");    
    return json(priceKm);
  }
  catch (error) {
    console.error("Error reading price_km in db", error);
    throw error;
  }
}