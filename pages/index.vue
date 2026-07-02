<template>
  <v-main>
    <v-container
      class="d-flex flex-column justify-space-between"
      max-width="960px"
      min-height="100vh"
    >
      <v-container>
        <v-row justify="center">
          <v-col cols="auto">
            <div class="text-h3">Radio Downloader</div>
          </v-col>
        </v-row>

        <!-- Link parsing & downloading component -->
        <AudioDownloader />

        <!-- Tab audio recording component -->
        <WebAudioRecorder />

      </v-container>
      <v-container>
        <v-row justify="center">
          <v-col cols="auto" class="text-center">
            <p>
              © 2024 Joseph Lee,
              <a href="https://github.com/cgjosephlee/radio-downloader">GitHub</a>
            </p>
          </v-col>
        </v-row>
      </v-container>
    </v-container>
  </v-main>
</template>

<style scoped></style>
