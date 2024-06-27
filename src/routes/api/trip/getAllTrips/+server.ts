import { json } from "@sveltejs/kit";
import prisma from "../../../../lib/prisma/prismaClient";
import type { Passenger } from "../../../../ts/types";
import jwt from "jsonwebtoken";

export async function GET(): Promise<Response> {
  //const tripsData = await request.json();
  try {
    const foundTrips = await prisma.trip.findMany();
    // const token = await jwt.sign({id: registerData.id, email: registerData.email}, "my-secret");    
    return json(foundTrips);
  }
  catch (error) {
    console.error("Error reading trip in db", error);
    throw error;
  }
}