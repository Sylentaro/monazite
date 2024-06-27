import { json } from "@sveltejs/kit";
import prisma from "../../../../lib/prisma/prismaClient";
import type { Passenger } from "../../../../ts/types";
import jwt from "jsonwebtoken";

export async function GET(): Promise<Response> {
  //const data = await request.json();
  try {
    const foundDrivers = await prisma.driver.findMany();
    // const token = await jwt.sign({id: registerData.id, email: registerData.email}, "my-secret");    
    return json(foundDrivers);
  }
  catch (error) {
    console.error("Error reading drivers in db", error);
    throw error;
  }
}