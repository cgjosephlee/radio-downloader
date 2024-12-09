export default eventHandler(async (event) => {
  const { url } = await readBody(event)
  const responseText = await $fetch(url, {
    retry: 1,
    timeout: 3000
  })
  return responseText
})
