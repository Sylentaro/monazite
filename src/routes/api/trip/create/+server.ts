import { json } from "@sveltejs/kit";
import prisma from "../../../../lib/prisma/prismaClient";
import type { Passenger } from "../../../../ts/types";
import jwt from "jsonwebtoken";

export async function POST({ request }): Promise<Response> {
  const registerData = await request.json();
  try {
    const newTrip = await prisma.trip.create({
      data: registerData
    });
    return json(newTrip);
  }
  catch (error) {
    console.error("Error creating trip in db", error);
    throw error;
  }
}