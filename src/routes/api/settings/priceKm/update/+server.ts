import { json } from "@sveltejs/kit";
import prisma from "../../../../../lib/prisma/prismaClient";
import type { Passenger } from "../../../../../ts/types";
import jwt from "jsonwebtoken";
import type { Settings } from "@prisma/client";

export async function POST({request}): Promise<Response> {
    const updateData: any = await request.json();
    try {
    const updatedPriceKm = await prisma.settings.upsert({
      where: {
        key: "price_km"
      },
      update: {
        value: updateData.value
      },
      create: {
        key: "price_km",
        value: updateData.value
      }
    });
    // const token = await jwt.sign({id: registerData.id, email: registerData.email}, "my-secret");    
    return json(updatedPriceKm);
  }
  catch (error) {
    console.error("Error updating price_km in db", error);
    throw error;
  }
}