"""Kin Dictation — minimal Pipecat agent.

A staff member opens a private voice session from the Kin dashboard. This agent
listens, transcribes (Daily real-time transcription), and POSTs the final
transcript to the Kin webhook when the participant leaves. No LLM, no TTS.

Deployed to Pipecat Cloud. Entry point: ``bot``.
"""

from __future__ import annotations

import os

import aiohttp
from loguru import logger

from pipecat.frames.frames import EndFrame, Frame, TranscriptionFrame
from pipecat.pipeline.pipeline import Pipeline
from pipecat.pipeline.runner import PipelineRunner
from pipecat.pipeline.task import PipelineParams, PipelineTask
from pipecat.processors.frame_processor import FrameDirection, FrameProcessor
from pipecat.transports.daily.transport import DailyParams, DailyTransport
from pipecatcloud.agent import DailySessionArguments


class TranscriptCollector(FrameProcessor):
    """Collects TranscriptionFrames and posts the final concatenated transcript."""

    def __init__(
        self,
        callback_url: str,
        session_id: str,
        guest_id: str,
        source_placemaker_id: str,
    ) -> None:
        super().__init__()
        self.callback_url = callback_url
        self.session_id = session_id
        self.guest_id = guest_id
        self.source_placemaker_id = source_placemaker_id
        self._parts: list[str] = []
        self._posted = False

    async def process_frame(self, frame: Frame, direction: FrameDirection) -> None:
        await super().process_frame(frame, direction)
        if isinstance(frame, TranscriptionFrame):
            text = (frame.text or "").strip()
            if text:
                self._parts.append(text)
                logger.info(f"[{self.session_id}] partial: {text}")
        elif isinstance(frame, EndFrame):
            await self.post_transcript()
        await self.push_frame(frame, direction)

    async def post_transcript(self) -> None:
        if self._posted:
            return
        self._posted = True
        transcript = " ".join(self._parts).strip()
        if not transcript:
            logger.warning(f"[{self.session_id}] no transcript collected — nothing to post")
            return
        payload = {
            "sessionId": self.session_id,
            "guestId": self.guest_id,
            "sourcePlaceMakerId": self.source_placemaker_id,
            "transcript": transcript,
            "eventType": "final",
        }
        async with aiohttp.ClientSession() as session:
            try:
                async with session.post(
                    self.callback_url,
                    json=payload,
                    timeout=aiohttp.ClientTimeout(total=10),
                ) as resp:
                    body = await resp.text()
                    logger.info(
                        f"[{self.session_id}] posted transcript ({len(transcript)} chars) → "
                        f"status={resp.status} body={body[:120]}"
                    )
            except Exception as e:
                logger.error(f"[{self.session_id}] webhook post failed: {e}")


async def bot(args: DailySessionArguments) -> None:
    body = args.body or {}
    session_id = body.get("sessionId", "unknown")
    guest_id = body.get("guestId")
    source_placemaker_id = body.get("sourcePlaceMakerId")
    callback_url = body.get("callbackUrl")

    if not (guest_id and source_placemaker_id and callback_url):
        logger.error(
            "Missing one of guestId, sourcePlaceMakerId, callbackUrl in session body."
        )
        return

    logger.info(
        f"[{session_id}] starting dictation session for guest={guest_id} "
        f"placeMaker={source_placemaker_id}"
    )

    transport = DailyTransport(
        args.room_url,
        args.token,
        "Kin Dictation",
        DailyParams(
            audio_in_enabled=True,
            audio_out_enabled=False,
            transcription_enabled=True,
            vad_enabled=True,
        ),
    )

    collector = TranscriptCollector(
        callback_url=callback_url,
        session_id=session_id,
        guest_id=guest_id,
        source_placemaker_id=source_placemaker_id,
    )

    pipeline = Pipeline([transport.input(), collector, transport.output()])
    task = PipelineTask(pipeline, params=PipelineParams(allow_interruptions=True))

    @transport.event_handler("on_first_participant_joined")
    async def on_first_participant_joined(_t, participant):
        logger.info(f"[{session_id}] participant joined: {participant.get('id')}")

    @transport.event_handler("on_participant_left")
    async def on_participant_left(_t, participant, reason):
        logger.info(f"[{session_id}] participant left ({reason}); flushing transcript")
        await collector.post_transcript()
        await task.queue_frame(EndFrame())

    runner = PipelineRunner()
    await runner.run(task)
