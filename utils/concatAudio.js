import Crunker from 'crunker'

export async function concatAndDownloadAudio(urls) {
  console.log(`concatAndDownloadAudio: length=${urls.length}, first=${urls[0]}`)
  let crunker = new Crunker()
  await crunker
    .fetchAudio(...urls)
    .then((buffers) => crunker.concatAudio(buffers))
    .then((merged) => crunker.export(merged, 'audio/mp3'))
    .then((output) => crunker.download(output.blob, 'radio'))
    .catch((error) => {
      throw new Error(error)
    })
}
