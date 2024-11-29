export default eventHandler(async (event) => {
  const { url } = await readBody(event)
  const responseText = await $fetch(url)
  return responseText
})
