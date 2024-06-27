import { json } from "@sveltejs/kit";
import prisma from "../../../../lib/prisma/prismaClient";
import type { Passenger } from "../../../../ts/types";
import jwt from "jsonwebtoken";

export async function POST({ request }): Promise<Response> {
  const data = await request.json();
  try {
    const deletedDriver = await prisma.driver.delete({
      where: {
        id: data.id
      }
    });
    // const token = await jwt.sign({id: registerData.id, email: registerData.email}, "my-secret");    
    return json(deletedDriver);
  }
  catch (error) {
    console.error("Error deleting driver in db", error);
    throw error;
  }
}