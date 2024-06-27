import { json } from "@sveltejs/kit";
import prisma from "../../../../../lib/prisma/prismaClient";
import type { Passenger } from "../../../../../ts/types";
import jwt from "jsonwebtoken";
import type { Settings } from "@prisma/client";

export async function POST({request}): Promise<Response> {
    const updateData: any = await request.json();
    try {
    const updatedPricePerMeter = await prisma.settings.upsert({
      where: {
        key: "price_per_meter"
      },
      update: {
        value: updateData.value
      },
      create: {
        key: "price_per_meter",
        value: updateData.value
      }
    });
    // const token = await jwt.sign({id: registerData.id, email: registerData.email}, "my-secret");    
    return json(updatedPricePerMeter);
  }
  catch (error) {
    console.error("Error updating price_per_meter in db", error);
    throw error;
  }
}