import { AudioPlayer, createAudioPlayer } from "expo-audio";
import { GameSettings } from "@/lib/game-settings";

let musicPlayer: AudioPlayer | null = null;

const players: Record<string, AudioPlayer | null> = {
  correct: null,
  wrong: null,
  reveal: null,
  hint: null,
  tap: null,
};

function makePlayer(asset: any) {
  return createAudioPlayer(asset);
}

export async function loadGameAudio() {
  if (!players.correct) {
    players.correct = makePlayer(
      require("../../assets/sounds/correct.mp3")
    );

    players.wrong = makePlayer(
      require("../../assets/sounds/wrong.mp3")
    );

    players.reveal = makePlayer(
      require("../../assets/sounds/reveal.mp3")
    );

    players.hint = makePlayer(
      require("../../assets/sounds/hint.mp3")
    );

    players.tap = makePlayer(
      require("../../assets/sounds/tap.mp3")
    );
  }

  if (!musicPlayer) {
    musicPlayer = makePlayer(
      require("../../assets/sounds/cozy_loop.mp3")
    );

    musicPlayer.loop = true;
  }
}

export async function playSfx(
  name: keyof typeof players,
  settings: GameSettings
) {
  if (!settings.sfxEnabled) return;

  const player = players[name];

  if (!player) return;

  player.volume = settings.sfxVolume;

  player.seekTo(0);

  player.play();
}

export async function startMusic(
  settings: GameSettings
) {
  if (!musicPlayer) return;

  musicPlayer.volume = settings.musicVolume;

  if (settings.musicEnabled) {
    musicPlayer.play();
  }
}

export async function stopMusic() {
  if (!musicPlayer) return;

  musicPlayer.pause();
}

export async function updateMusic(
  settings: GameSettings
) {
  if (!musicPlayer) return;

  musicPlayer.volume = settings.musicVolume;

  if (settings.musicEnabled) {
    musicPlayer.play();
  } else {
    musicPlayer.pause();
  }
}