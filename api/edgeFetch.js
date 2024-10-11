export const config = {
  runtime: 'edge' // this is a pre-requisite
}

export default async function handler(req) {
  if (req.method !== 'POST') {
    return new Response('Method Not Allowed', { status: 405 })
  }

  try {
    const { url } = await req.json()

    if (!url) {
      return new Response('Bad Request: URL is required', { status: 400 })
    }

    const response = await fetch(url)
    const text = await response.text()

    return new Response(text, {
      headers: {
        'Content-Type': 'text/plain'
      }
    })
  } catch (error) {
    return new Response(`Error: ${error.message}`, { status: 500 })
  }
}
