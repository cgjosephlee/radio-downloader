export async function getAudioLinks(url) {
  const parsedUrl = new URL(url)
  const domain = parsedUrl.hostname

  if (domain.includes('voh.com.tw')) {
    return await getVohAudioLinks(url)
  } else if (domain.includes('ner.gov.tw')) {
    return await getNerAudioLinks(url)
  } else if (domain.includes('tradio.gov.taipei')) {
    return await getTradioAudioLinks(url)
  } else {
    throw new Error(`Unsupported domain: ${domain}`)
  }
}

// Example usage:
// getAudioLinks('https://www.voh.com.tw/TW/Playback/ugC_Playback.aspx?PID=168&D=20240917').then(console.log);
// getAudioLinks('https://www.ner.gov.tw/news/66e258d1425f580023b5f80b').then(console.log);
// getAudioLinks('https://tradio.gov.taipei/channel/MjEyOA/MjIwNTg0').then(console.log);

async function edgeFetch(url) {
  const response = await fetch('/api/edgeFetch', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ url })
  })

  if (!response.ok) {
    throw new Error(`Error: ${response.statusText}`)
  }

  const text = await response.text()
  return text
}

// 漢聲廣播電臺
// https://www.voh.com.tw/TW/Playback/ugC_Playback.aspx?PID=168&D=20240917
async function getVohAudioLinks(url) {
  const text = await edgeFetch(url)
  const parser = new DOMParser()
  const doc = parser.parseFromString(text, 'text/html')
  const audioTag = doc.querySelector('div.Audio audio')
  const audioSrc = audioTag.getAttribute('src')
  const baseUrl = new URL(url).origin
  const audioUrl = new URL(audioSrc, baseUrl).href
  return [audioUrl]
}

// 國立教育廣播電臺
// https://www.ner.gov.tw/news/66e258d1425f580023b5f80b
async function getNerAudioLinks(url) {
  const parsedUrl = new URL(url)
  const newsId = parsedUrl.pathname.split('/').pop()
  const apiNewsUrl = new URL(`/api/news/${newsId}`, parsedUrl.origin).href
  const text = await edgeFetch(apiNewsUrl)
  const data = JSON.parse(text)
  const audioId = data.audio
  const audioUrl = new URL(`/api/audio/${audioId}.mp3`, parsedUrl.origin).href
  return [audioUrl]
}

// 聽台北 Tradio
// https://tradio.gov.taipei/channel/MjEyOA/MjIwNTg0
async function getTradioAudioLinks(url) {
  const parsedUrl = new URL(url)
  const text = await edgeFetch(parsedUrl)
  const parser = new DOMParser()
  // Get the json data
  const doc = parser.parseFromString(text, 'text/html')
  const scriptTag = doc.querySelector('#__NUXT_DATA__')
  // Get the player url from the json data
  const data = JSON.parse(scriptTag.textContent)
  // console.log(`getTradioAudioLinks: data: ${data}`)
  const programId = parsedUrl.pathname.split('/').pop()
  let idx = 2
  console.log(`getTradioAudioLinks: idx: ${idx}, ${JSON.stringify(data[idx])}`)
  idx = data[idx][`program-${programId}`]
  console.log(`getTradioAudioLinks: idx: ${idx}, ${JSON.stringify(data[idx])}`)
  idx = data[idx+1]['player_url']
  console.log(`getTradioAudioLinks: idx: ${idx}, ${JSON.stringify(data[idx])}`)
  const playerUrl = data[idx]
  // Get the audio urls from the player
  console.log(`getTradioAudioLinks: playerUrl: ${playerUrl}`)
  const text2 = await edgeFetch(new URL(playerUrl))
  const doc2 = parser.parseFromString(text2, 'text/html')
  const scriptText = Array.from(doc2.querySelectorAll('script:not([src])'))
    .map((script) => script.textContent)
    .join('')
  const audioBaseUrl = scriptText.match(/src:\s*'([^']+)'/)[1].replace(/playlist.m3u8.+/, '')
  const audioUrls = Array.from({ length: 350 }, (_, i) => `${audioBaseUrl}media_${i + 1}.aac`)
  return audioUrls
}
