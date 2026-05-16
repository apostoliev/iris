# Kin Dictation Agent

A minimal Pipecat Cloud agent. Joins a Daily WebRTC room, transcribes the staff
member's speech, posts the final transcript to the Kin webhook on participant
leave. No LLM, no TTS — capture only.

## Deploy to Pipecat Cloud

```sh
# 1. CLI + auth
pip install pipecatcloud
pcc auth login

# 2. Pick an organization key
pcc organizations keys create
pcc organizations keys use

# 3. Build + push the image
docker build --platform=linux/arm64 -t kin-dictation .
docker push <your-registry>/kin-dictation:latest

# 4. Deploy
pcc deploy

# 5. Set secrets (one-time)
pcc secrets set kin-dictation-secrets \
  DEEPGRAM_API_KEY="<optional, only if you replace Daily transcription>"
```

## Locally test

Pipecat Cloud runs the `bot` async function with `DailySessionArguments`. The
Kin webhook URL flows in through `args.body.callbackUrl`. There is no need to
run this locally for the demo path — the Type fallback in CaptureModal keeps
the app demoable when this agent is unavailable.
