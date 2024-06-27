import { json } from "@sveltejs/kit";
import prisma from "../../../../../lib/prisma/prismaClient";
import type { Passenger } from "../../../../../ts/types";
import jwt from "jsonwebtoken";

export async function GET(): Promise<Response> {
  try {
    const priceStart = await prisma.settings.findUnique({
      where: {
        key: "price_start"
      }
    });
    // const token = await jwt.sign({id: registerData.id, email: registerData.email}, "my-secret");    
    return json(priceStart);
  }
  catch (error) {
    console.error("Error reading price_start in db", error);
    throw error;
  }
}