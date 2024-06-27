import { json } from "@sveltejs/kit";
import prisma from "../../../lib/prisma/prismaClient";
import type { Passenger } from "../../../ts/types";
import jwt from "jsonwebtoken";

export async function POST({ request }): Promise<Response> {
  const tokenData = await request.json();
  try {
    const loggedPassenger = await prisma.passenger.findUnique({
      where: {
        email: tokenData.email
      }
    });
    // const token = await jwt.sign({id: registerData.id, email: registerData.email}, "my-secret");    
    return json(loggedPassenger);
  }
  catch (error) {
    console.error("Error reading passenger in db", error);
    throw error;
  }
}