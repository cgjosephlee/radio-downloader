import fetch from 'node-fetch'
import { JSDOM } from 'jsdom'

// 模擬瀏覽器環境中的 fetch 和 DOMParser
global.fetch = fetch
global.DOMParser = new JSDOM().window.DOMParser

// 引入要測試的函數
import { getAudioLinks } from '../getAudioLinks.js'

// 測試函數
async function test() {
  try {
    // const vohLinks = await getAudioLinks(
    //   'https://www.voh.com.tw/TW/Playback/ugC_Playback.aspx?PID=168&D=20240917'
    // );
    // console.log('VOH Links:', vohLinks);

    // const nerLinks = await getAudioLinks('https://www.ner.gov.tw/news/66e258d1425f580023b5f80b');
    // console.log('NER Links:', nerLinks);

    const tradioLinks = await getAudioLinks('https://tradio.gov.taipei/channel/MjEyOA/MjIwNTg0')
    console.log('Tradio Links:', tradioLinks)
  } catch (error) {
    console.error('Error:', error)
  }

  // 測試失敗情況
  try {
    const invalidLinks = await getAudioLinks('https://www.invalid-domain.com')
    console.log('Invalid Links:', invalidLinks)
  } catch (error) {
    console.error('Expected error for unsupported domain:', error.message)
  }
}

test()
