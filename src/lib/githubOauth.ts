import { GitHub } from 'arctic';


export const githubOAuthClient = new GitHub(
    process.env.GITHUB_CLIENT_ID!,
    process.env.GITHUB_CLIENT_SECRET!
  );