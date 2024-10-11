export const config = {
  runtime: 'edge' // this is a pre-requisite
}

export function GET(request) {
  return new Response(`Hello from ${process.env.VERCEL_REGION}`)
}
