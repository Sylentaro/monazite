import { json } from "@sveltejs/kit";
import prisma from "../../../../lib/prisma/prismaClient";
import type { Passenger } from "../../../../ts/types";
import jwt from "jsonwebtoken";

export async function POST({ request }): Promise<Response> {
  const registerData: Passenger = await request.json();
  try {
    const newPassenger = await prisma.passenger.create({
      data: registerData
    });

    const token = await jwt.sign({id: registerData.id, email: registerData.email}, "my-secret");    
    return json(token);
  }
  catch (error) {
    console.error("Error creating passenger in db", error);
    throw error;
  }
}