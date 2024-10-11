import json
import re
from typing import List
from urllib.parse import quote, urljoin, urlparse

import requests
from bs4 import BeautifulSoup


def get_voh_audio_links(url: str) -> List[str]:
    """漢聲廣播電臺"""
    response = requests.get(url)
    soup = BeautifulSoup(response.text, "html.parser")
    audio_tag = soup.find("div", class_="Audio").find("audio")
    audio_src = audio_tag["src"]
    parsed_url = urlparse(url)
    base_url = f"{parsed_url.scheme}://{parsed_url.netloc}"
    audio_url = urljoin(base_url, audio_src)
    audio_url = quote(audio_url, safe=":/?=&")
    return [audio_url]


def get_ner_audio_links(url: str) -> List[str]:
    """國立教育廣播電臺"""
    parsed_url = urlparse(url)
    news_id = parsed_url.path.split("/")[-1]
    api_news_url = urljoin(
        parsed_url._replace(path="/").geturl(), f"/api/news/{news_id}"
    )
    response = requests.get(api_news_url)
    audio_id = response.json()["audio"]
    audio_url = urljoin(
        parsed_url._replace(path="/").geturl(), f"/api/audio/{audio_id}"
    )
    audio_url = audio_url + ".mp3"
    return [audio_url]


def get_tradio_audio_links(url: str) -> List[str]:
    """聽台北 tradio"""
    parsed_url = urlparse(url)
    program_id = parsed_url.path.split("/")[-1]
    response = requests.get(url)
    soup = BeautifulSoup(response.text, "html.parser")

    # Track down the audio URL
    data = json.loads(soup.find("script", id="__NUXT_DATA__").string)
    idx = data[2][f"program-{program_id}"]
    idx = data[idx]["player_url"]
    player_url = data[idx]

    response2 = requests.get(player_url)
    soup2 = BeautifulSoup(response2.text, "html.parser")
    script_text = soup2.find_all("script", src="")
    audio_base_url = re.search(
        r"src:\s*'([^']+)'", script_text[0].string + script_text[1].string
    ).group(1)
    audio_base_url = re.sub(r"playlist.m3u8.+", "", audio_base_url)
    audio_urls = []
    for i in range(350):
        audio_urls.append(f"{audio_base_url}/media_{i+1}.aac")
    return audio_urls
