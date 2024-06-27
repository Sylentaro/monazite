import { json } from "@sveltejs/kit";
import prisma from "../../../../lib/prisma/prismaClient";
import type { Passenger } from "../../../../ts/types";
import jwt from "jsonwebtoken";

export async function POST({ request }): Promise<Response> {
  const loginData: Passenger = await request.json();
    const loginPassenger = await prisma.passenger.findFirst({
      where: {
        AND: [
            {login: loginData.login},
            {password: loginData.password}
        ]
      }
    });
    if (!loginPassenger)  {
        throw new Error
    }
    const token = await jwt.sign({id: loginPassenger.id, email: loginPassenger.email}, "my-secret");    
    return json(token);
}