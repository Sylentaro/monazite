import { json } from "@sveltejs/kit";
import prisma from "../../../../lib/prisma/prismaClient";
import jwt from "jsonwebtoken";

export async function POST({ request }): Promise<Response> {
  const updateData = await request.json();
  try {
    const updatedPass = await prisma.passenger.update({
      where: {
        email: updateData.email
      },
      data: {
        onGoing: updateData.onGoing
      }
    });
    // const token = await jwt.sign({id: registerData.id, email: registerData.email}, "my-secret");    
    return json(updatedPass);
  }
  catch (error) {
    console.error("Error updating passenger in db", error);
    throw error;
  }
}