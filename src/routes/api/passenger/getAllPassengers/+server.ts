import { json } from "@sveltejs/kit";
import prisma from "../../../../lib/prisma/prismaClient";
import type { Passenger } from "../../../../ts/types";
import jwt from "jsonwebtoken";

export async function GET(): Promise<Response> {
//  const data = await request.json();
  try {
    const foundPassengers = await prisma.passenger.findMany();
    // const token = await jwt.sign({id: registerData.id, email: registerData.email}, "my-secret");    
    return json(foundPassengers);
  }
  catch (error) {
    console.error("Error reading passengers in db", error);
    throw error;
  }
}