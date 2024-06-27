import { json } from "@sveltejs/kit";
import prisma from "../../../lib/prisma/prismaClient";
import type { Passenger } from "../../../ts/types";
import jwt from "jsonwebtoken";

export async function POST({ request }): Promise<Response> {
  const storageToken: string = await request.json();
  try {
    const decodedToken = await jwt.verify(storageToken, "my-secret");    
    return json(decodedToken, {status: 200});
  }
  catch (error) {
    console.error("Unauthorized access", error);
    return json("Unauthorized access", {status: 401});
  }
}