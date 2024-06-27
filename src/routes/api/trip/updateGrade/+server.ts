import { json } from "@sveltejs/kit";
import prisma from "../../../../lib/prisma/prismaClient";
import jwt from "jsonwebtoken";

export async function POST({ request }): Promise<Response> {
  const updateData = await request.json();
  try {
    const updatedTrip = await prisma.trip.update({
      where: {
        id: updateData.id
      },
      data: {
        state: 0,
        rating: updateData.rating
      }
    });
    // const token = await jwt.sign({id: registerData.id, email: registerData.email}, "my-secret");    
    return json(updatedTrip);
  }
  catch (error) {
    console.error("Error updating trip in db", error);
    throw error;
  }
}