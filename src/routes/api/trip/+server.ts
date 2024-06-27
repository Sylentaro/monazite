import { json } from "@sveltejs/kit";
import prisma from "../../../lib/prisma/prismaClient";
import type { Passenger } from "../../../ts/types";
import jwt from "jsonwebtoken";

export async function POST({ request }): Promise<Response> {
  const tripData = await request.json();
  try {
    const foundTrip = await prisma.trip.findUnique({
      where: {
        id: tripData.id
      }
    });
    // const token = await jwt.sign({id: registerData.id, email: registerData.email}, "my-secret");    
    return json(foundTrip);
  }
  catch (error) {
    console.error("Error reading trip in db", error);
    throw error;
  }
}