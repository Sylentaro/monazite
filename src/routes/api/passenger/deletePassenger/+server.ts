import { json } from "@sveltejs/kit";
import prisma from "../../../../lib/prisma/prismaClient";
import type { Passenger } from "../../../../ts/types";
import jwt from "jsonwebtoken";

export async function POST({ request }): Promise<Response> {
  const data = await request.json();
  try {
    const deletedPassenger = await prisma.passenger.delete({
      where: {
        id: data.id
      }
    });
    // const token = await jwt.sign({id: registerData.id, email: registerData.email}, "my-secret");    
    return json(deletedPassenger);
  }
  catch (error) {
    console.error("Error deleting passenger in db", error);
    throw error;
  }
}