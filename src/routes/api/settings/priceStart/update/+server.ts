import { json } from "@sveltejs/kit";
import prisma from "../../../../../lib/prisma/prismaClient";
import type { Passenger } from "../../../../../ts/types";
import jwt from "jsonwebtoken";

export async function POST({request}): Promise<Response> {
    const updateData: any = await request.json();

    try {
    const updatedPriceStart = await prisma.settings.upsert({
      where: {
        key: "price_start"
      },
      update: {
        value: updateData.value
      },
      create: {
        key: "price_start",
        value: updateData.value
      }
    });
    // const token = await jwt.sign({id: registerData.id, email: registerData.email}, "my-secret");    
    return json(updatedPriceStart);
  }
  catch (error) {
    console.error("Error updating price_start in db", error);
    throw error;
  }
}