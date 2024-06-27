import { githubOAuthClient } from "@/lib/githubOauth";
import { lucia } from "@/lib/lucia";
import { prisma } from "@/lib/prisma";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { NextRequest } from "next/server";


export async function GET(request: Request): Promise<Response> {
	const url = new URL(request.url);
	const code = url.searchParams.get("code");
	const state = url.searchParams.get("state");
	const storedState = cookies().get("github_oauth_state")?.value ?? null;
	if (!code || !state || !storedState || state !== storedState) {
		return new Response(null, {
			status: 400
		});
	}

		const tokens = await githubOAuthClient.validateAuthorizationCode(code);
		const githubUserResponse = await fetch("https://api.github.com/user", {
			headers: {
				Authorization: `Bearer ${tokens.accessToken}`
			}
		});
		
        const githubData = (await githubUserResponse.json()) as {
            id: string,
            email: string,
            name: string,
            picture: string
        }

        let userId: string = ''
        // if the email exists in our record, we can create a cookie for them and sign them in
        // if the email doesn't exist, we create a new user, then craete cookie to sign them in
		

        const existingUser = await prisma.user.findUnique({
            where: {
                email: githubData.email
            }
        })
        if (existingUser) {
            userId = existingUser.id
        } else {
            const user = await prisma.user.create({
                data: {
                    name: githubData.name,
                    email: githubData.email,
                    picture: githubData.picture
                }
            })
            userId = user.id
        }


		const session = await lucia.createSession(userId, {})
        const sessionCookie = await lucia.createSessionCookie(session.id)
        cookies().set(sessionCookie.name, sessionCookie.value, sessionCookie.attributes)

        return redirect('/dashboard');
   
    }